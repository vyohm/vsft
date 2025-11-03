'use client'

import { useState } from 'react'

interface EditPriceModalProps {
  itemId: string
  designNumber: string
  currentPrice: number
  onClose: () => void
  onSuccess: () => void
}

const ADMIN_PASSWORD = 'sft43782'

export default function EditPriceModal({ itemId, designNumber, currentPrice, onClose, onSuccess }: EditPriceModalProps) {
  const [step, setStep] = useState<'password' | 'form'>('password')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Form fields
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setStep('form')
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/catalogue/update-price', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: itemId,
          price: parseFloat(price)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update price')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {step === 'password' ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-brand-primary">Admin Verification</h2>
            <p className="text-brand-quaternary mb-4">
              Enter admin password to edit the price for Design #{designNumber}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-brand-quaternary mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-brand-tertiary rounded-lg focus:outline-none focus:border-brand-primary"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-600 text-sm mt-2">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border-2 border-brand-quaternary text-brand-quaternary rounded-lg hover:bg-brand-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-brand-primary">Edit Price</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="design_number" className="block text-sm font-medium text-brand-quaternary mb-2">
                  Design Number
                </label>
                <input
                  type="text"
                  id="design_number"
                  value={designNumber}
                  disabled
                  className="w-full px-3 py-2 border-2 border-brand-tertiary rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="current_price" className="block text-sm font-medium text-brand-quaternary mb-2">
                  Current Price
                </label>
                <input
                  type="text"
                  id="current_price"
                  value={`₹${currentPrice}`}
                  disabled
                  className="w-full px-3 py-2 border-2 border-brand-tertiary rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="price" className="block text-sm font-medium text-brand-quaternary mb-2">
                  New Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter new price"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full px-3 py-2 border-2 border-brand-tertiary rounded-lg focus:outline-none focus:border-brand-primary"
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-brand-quaternary text-brand-quaternary rounded-lg hover:bg-brand-tertiary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Price'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
