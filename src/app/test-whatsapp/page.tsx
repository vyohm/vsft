'use client'

import { useState } from 'react'

export default function TestWhatsAppPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const testSendMessage = async () => {
    if (!phoneNumber) {
      setMessage('Please enter a phone number')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          message: `Test from SFT! 👋\n\nThis is a test message. Reply with "123456" to test the webhook.\n\nYour verification code: 123456`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Message sent! Check your WhatsApp and reply with "123456" to test verification.')
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to send message'}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2">WhatsApp Integration Test</h1>
          <p className="text-brand-quaternary mb-6">Test sending messages and webhook functionality</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Your WhatsApp Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="919876543210 (with country code, no +)"
                className="w-full px-4 py-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-primary"
              />
              <p className="text-xs text-brand-quaternary mt-1">
                Format: Country code + number (e.g., 919876543210 for India)
              </p>
            </div>

            <button
              onClick={testSendMessage}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Sending...' : '📱 Send Test Message'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-red-50 text-red-700 border-2 border-red-200'}`}>
                {message}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">How to Test:</h3>
            <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
              <li>Enter your WhatsApp number (with country code)</li>
              <li>Click "Send Test Message"</li>
              <li>Check your WhatsApp for the message</li>
              <li>Reply with "123456"</li>
              <li>Check server logs to see webhook received your reply!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
