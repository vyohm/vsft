'use client'

import { useState } from 'react'

interface InvoiceSectionProps {
  orderId: string
  customerId: string
  isWhatsAppVerified: boolean
  invoiceSent: boolean
  invoiceUrl?: string
}

export default function InvoiceSection({
  orderId,
  customerId,
  isWhatsAppVerified,
  invoiceSent: initialInvoiceSent,
  invoiceUrl: initialInvoiceUrl
}: InvoiceSectionProps) {
  const [sending, setSending] = useState(false)
  const [invoiceSent, setInvoiceSent] = useState(initialInvoiceSent)
  const [invoiceUrl, setInvoiceUrl] = useState(initialInvoiceUrl)
  const [error, setError] = useState<string | null>(null)
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)

  const handleSendInvoice = async () => {
    if (!isWhatsAppVerified) {
      setShowVerificationPrompt(true)
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/send-invoice`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send invoice')
      }

      setInvoiceSent(true)
      setInvoiceUrl(data.invoiceUrl)
    } catch (err: any) {
      setError(err.message)
      console.error('Error sending invoice:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-6 p-4 border-2 border-brand-quaternary rounded-lg">
      <h2 className="text-xl font-semibold mb-4">📄 Invoice</h2>

      {showVerificationPrompt && !isWhatsAppVerified ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-3">
            ⚠️ WhatsApp verification required to receive invoice
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            To receive your invoice via WhatsApp, you need to verify your WhatsApp number first.
            Click the button below to receive a verification code.
          </p>
          <button
            onClick={() => window.location.href = '/order'}
            className="bg-brand-secondary text-brand-primary px-6 py-2 rounded-lg font-semibold hover:bg-brand-tertiary transition-colors"
          >
            Verify WhatsApp Number
          </button>
        </div>
      ) : invoiceSent ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Invoice sent via WhatsApp!</span>
          </div>
          {invoiceUrl && (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-secondary underline text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Invoice
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-brand-quaternary text-sm">
            Send invoice and order confirmation via WhatsApp
          </p>
          <button
            onClick={handleSendInvoice}
            disabled={sending}
            className="bg-brand-primary text-brand-light px-6 py-3 rounded-lg font-semibold hover:bg-brand-secondary hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Send Invoice via WhatsApp
              </>
            )}
          </button>
          {error && (
            <p className="text-red-600 text-sm mt-2">
              ❌ {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
