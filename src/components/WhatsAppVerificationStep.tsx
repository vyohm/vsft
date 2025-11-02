'use client'

import { useState } from 'react'
import Image from 'next/image'

interface WhatsAppVerificationStepProps {
  phoneNumber: string
  onVerified: (code: string) => void
  onSkip: () => void
}

export default function WhatsAppVerificationStep({
  phoneNumber,
  onVerified,
  onSkip
}: WhatsAppVerificationStepProps) {
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
      // Verify the code by sending it to WhatsApp
      // The webhook will process it and verify the customer
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
      onVerified(verificationCode)
    } catch (err) {
      setError('Failed to verify code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 bg-white p-4 sm:p-8 rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">WhatsApp Verification</h2>
        <p className="text-brand-quaternary">
          Verify your number to receive order updates
        </p>
      </div>

      {/* Step 1: Send Message */}
      <div className="border-2 border-brand-quaternary rounded-lg p-3 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Send us a WhatsApp message</h3>
            <p className="text-sm text-brand-quaternary mb-4">
              Click the button below or scan the QR code to send us a message on WhatsApp
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
      <div className="border-2 border-brand-quaternary rounded-lg p-3 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold">
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
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center pt-4 border-t-2 border-brand-quaternary">
        <p className="text-sm text-brand-quaternary mb-3">
          Don't want to verify now?
        </p>
        <button
          onClick={onSkip}
          className="text-brand-primary hover:text-brand-secondary underline font-medium"
        >
          Skip verification and continue
        </button>
      </div>
    </div>
  )
}
