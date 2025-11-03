import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { item_id, price } = body

    // Validate required fields
    if (!item_id || !price) {
      return NextResponse.json(
        { error: 'Item ID and price are required' },
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

    // Update the catalogue item price
    const { data: updatedItem, error: updateError } = await supabase
      .from('catalogue_items')
      .update({ price })
      .eq('id', item_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating catalogue item price:', updateError)
      return NextResponse.json(
        { error: 'Failed to update price', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        item: updatedItem,
        message: 'Price updated successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in update price API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
