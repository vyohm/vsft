'use client'

import { useState } from 'react'
import Image from 'next/image'

interface WhatsAppVerificationModalProps {
  phoneNumber: string
  onVerified: () => void
  onClose: () => void
}

export default function WhatsAppVerificationModal({
  phoneNumber,
  onVerified,
  onClose
}: WhatsAppVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const whatsappLink = 'https://wa.me/917439856065?text=I%20would%20like%20to%20begin%20my%20order%20for%20Sangeet%20Fashion%20Textiles%20at%20Kerala%20Fashion%20Expo.%20Please%20send%20me%20a%20verification%20code%20to%20start%20my%20order.'

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Verification code must be 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/whatsapp/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          verificationCode
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.message || 'Invalid verification code. Please try again.')
        setLoading(false)
        return
      }

      // Success - proceed
      onVerified()
    } catch (err) {
      setError('Failed to verify code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">WhatsApp Verification</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-brand-quaternary text-center">
            Verify your WhatsApp number to receive the invoice
          </p>

          {/* Step 1: Send Message */}
          <div className="border-2 border-brand-quaternary rounded-lg p-4 space-y-4">
            <div className="md:hidden flex items-center justify-center mb-3">
              <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="hidden md:flex flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Send us a WhatsApp message</h3>
                <p className="text-sm text-brand-quaternary mb-4">
                  Click the button below or scan the QR code to send us a message
                </p>

                {/* WhatsApp Link Button */}
                <div className="text-center">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-colors font-semibold mb-4"
                  >
                    Receive Verification Code
                  </a>
                </div>

                {/* QR Code */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm font-semibold mb-3">Or scan this QR code:</p>
                  <div className="relative w-48 h-48 mx-auto">
                    <Image
                      src="/assets/images/wa-me.png"
                      alt="WhatsApp QR Code"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Enter Code */}
          <div className="border-2 border-brand-quaternary rounded-lg p-4 space-y-4">
            <div className="md:hidden flex items-center justify-center mb-3">
              <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="hidden md:flex flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Enter verification code</h3>
                <p className="text-sm text-brand-quaternary mb-4">
                  We'll send you a 6-digit code on WhatsApp. Enter it below:
                </p>

                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-primary transition-colors text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />

                {error && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}

                <button
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full mt-4 bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Send Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
