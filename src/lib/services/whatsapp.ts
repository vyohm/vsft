import axios from 'axios'

interface WhatsAppConfig {
  token: string
  phoneNumberId: string
  apiVersion?: string
}

interface MessageResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export class WhatsAppService {
  private token: string
  private phoneNumberId: string
  private apiVersion: string
  private baseUrl: string

  constructor(config?: WhatsAppConfig) {
    this.token = config?.token || process.env.WHATSAPP_TOKEN || ''
    this.phoneNumberId = config?.phoneNumberId || process.env.PHONE_NUMBER_ID || ''
    this.apiVersion = config?.apiVersion || process.env.GRAPH_API_VERSION || 'v21.0'
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`
  }

  async sendMessage(to: string, message: string): Promise<MessageResponse> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: message }
      }

      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/${this.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        data: payload,
      })

      console.log('WhatsApp message sent successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message)
      throw error
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components: any[] = []
  ): Promise<MessageResponse> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      }

      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/${this.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        data: payload,
      })

      console.log('WhatsApp template message sent successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error sending WhatsApp template message:', error.response?.data || error.message)
      throw error
    }
  }

  async markAsRead(messageId: string): Promise<any> {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/${this.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
      })

      console.log('Message marked as read:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error marking message as read:', error.response?.data || error.message)
      // Don't throw - marking as read is not critical
      return null
    }
  }

  async sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<MessageResponse> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename
        }
      }

      if (caption) {
        payload.document.caption = caption
      }

      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/${this.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        data: payload,
      })

      console.log('WhatsApp document sent successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error sending WhatsApp document:', error.response?.data || error.message)
      throw error
    }
  }

  parseIncomingMessage(webhookBody: any): any {
    try {
      const entry = webhookBody.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (!value) return null

      const message = value.messages?.[0]
      const contact = value.contacts?.[0]

      if (message) {
        const parsedMessage: any = {
          type: 'message',
          messageId: message.id,
          from: message.from,
          timestamp: message.timestamp,
          messageType: message.type,
          contact: {
            name: contact?.profile?.name,
            waId: contact?.wa_id
          }
        }

        // Parse different message types
        switch (message.type) {
          case 'text':
            parsedMessage.text = message.text?.body
            break
          case 'image':
            parsedMessage.image = {
              id: message.image?.id,
              mimeType: message.image?.mime_type,
              caption: message.image?.caption
            }
            break
          // Add other message types as needed
        }

        return parsedMessage
      }

      return null
    } catch (error) {
      console.error('Error parsing incoming message:', error)
      return null
    }
  }
}

export const whatsappService = new WhatsAppService()
