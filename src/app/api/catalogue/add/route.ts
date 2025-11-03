import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { design_number, name, price } = body

    // Validate required fields
    if (!design_number || !price) {
      return NextResponse.json(
        { error: 'Design number and price are required' },
        { status: 400 }
      )
    }

    // Validate price is a positive number
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Check if item already exists
    const { data: existing } = await supabase
      .from('catalogue_items')
      .select('id')
      .eq('design_number', design_number)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Item with this design number already exists' },
        { status: 409 }
      )
    }

    // Insert new catalogue item
    const { data: newItem, error: insertError } = await supabase
      .from('catalogue_items')
      .insert([
        {
          design_number,
          name: name || `Design ${design_number}`,
          price,
          is_active: true
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting catalogue item:', insertError)
      return NextResponse.json(
        { error: 'Failed to add item to catalogue', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        item: newItem,
        message: 'Item added successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in add catalogue item API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
