'use client'

import { useState } from 'react'
import { CustomerFormData } from '@/lib/types'

interface CustomerDetailsFormProps {
  onSubmit: (data: CustomerFormData) => void
}

export default function CustomerDetailsForm({ onSubmit }: CustomerDetailsFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    company_name: '',
    gst_number: '',
    phone_number: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Customer Details</h2>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="company_name" className="block text-sm font-medium mb-2">
          Company Name
        </label>
        <input
          type="text"
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="gst_number" className="block text-sm font-medium mb-2">
          GST Number
        </label>
        <input
          type="text"
          id="gst_number"
          value={formData.gst_number}
          onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
          placeholder="Enter 15-digit GST number"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone_number"
          required
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
          placeholder="+91 1234567890"
        />
        <p className="text-sm text-brand-quaternary mt-1">
          OTP verification will be added in future updates
        </p>
      </div>

      <button
        type="submit"
        className="w-full bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transition-colors"
      >
        Continue to Order
      </button>
    </form>
  )
}
