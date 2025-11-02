'use client'

import { useState } from 'react'

interface CustomerDetails {
  name: string
  phone_number: string
  company_name?: string
  gst_number?: string
}

interface CustomerDetailsModalProps {
  onSubmit: (details: CustomerDetails, verifyNow: boolean) => void
  onClose: () => void
}

export default function CustomerDetailsModal({ onSubmit, onClose }: CustomerDetailsModalProps) {
  const [details, setDetails] = useState<CustomerDetails>({
    name: '',
    phone_number: '',
    company_name: '',
    gst_number: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (verifyNow: boolean) => {
    // Validate required fields
    if (!details.name.trim()) {
      setError('Name is required')
      return
    }

    if (!details.phone_number.trim()) {
      setError('Phone number is required')
      return
    }

    // Basic phone validation (should be 10+ digits)
    const phoneDigits = details.phone_number.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(details, verifyNow)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-brand-quaternary p-4 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Your Details</h2>
              <p className="text-sm text-brand-quaternary mt-1">
                We need these to process your order
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-brand-quaternary hover:text-brand-primary text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                placeholder="Your full name"
                className="w-full px-3 py-2 border-2 border-brand-quaternary rounded-lg text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={details.phone_number}
                onChange={(e) => setDetails({ ...details, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border-2 border-brand-quaternary rounded-lg text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Company (optional) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Company Name <span className="text-xs text-brand-quaternary">(Optional)</span>
              </label>
              <input
                type="text"
                value={details.company_name}
                onChange={(e) => setDetails({ ...details, company_name: e.target.value })}
                placeholder="Your company name"
                className="w-full px-3 py-2 border-2 border-brand-quaternary rounded-lg text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* GST (optional) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                GST Number <span className="text-xs text-brand-quaternary">(Optional)</span>
              </label>
              <input
                type="text"
                value={details.gst_number}
                onChange={(e) => setDetails({ ...details, gst_number: e.target.value })}
                placeholder="GST number"
                className="w-full px-3 py-2 border-2 border-brand-quaternary rounded-lg text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* WhatsApp Verification Info */}
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2 text-sm">
              📱 WhatsApp Updates
            </h3>
            <p className="text-xs text-blue-600">
              After placing your order, you'll have the option to verify via WhatsApp and receive instant order updates!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-brand-quaternary p-4">
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full bg-brand-primary text-white px-6 py-3 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Continue Shopping'}
          </button>
        </div>
      </div>
    </div>
  )
}
