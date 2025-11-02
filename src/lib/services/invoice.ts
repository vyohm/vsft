import { jsPDF } from 'jspdf'

export interface InvoiceData {
  orderId: string
  orderNumber: string
  orderDate: string
  customer: {
    name: string
    company_name?: string
    phone_number: string
    gst_number?: string
  }
  items: Array<{
    design_number: string
    quantity: number
    unit_price: number
    size?: string
    color?: string
  }>
  totalAmount: number
}

export class InvoiceService {
  generateInvoice(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 15

        // Colors
        const primaryColor = '#2C5F2D' // Dark green
        const secondaryColor = '#97BC62' // Light green/gold
        const textColor = '#000000'
        const grayColor = '#666666'

        // Header
        doc.setFontSize(24)
        doc.setTextColor(primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('Sangeet Fashion Textiles', margin, 20)

        doc.setFontSize(10)
        doc.setTextColor(grayColor)
        doc.setFont('helvetica', 'normal')
        doc.text('Premium Fashion Textiles', margin, 27)
        doc.text('sangeetfashion.com', margin, 32)

        // Invoice title and details
        doc.setFontSize(20)
        doc.setTextColor(primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('INVOICE', pageWidth - margin, 20, { align: 'right' })

        doc.setFontSize(10)
        doc.setTextColor(textColor)
        doc.setFont('helvetica', 'normal')
        doc.text(`Order #: ${data.orderNumber}`, pageWidth - margin, 27, { align: 'right' })
        doc.text(`Date: ${new Date(data.orderDate).toLocaleDateString('en-IN')}`, pageWidth - margin, 32, { align: 'right' })

        // Divider line
        doc.setDrawColor(primaryColor)
        doc.setLineWidth(0.5)
        doc.line(margin, 40, pageWidth - margin, 40)

        // Customer Information
        let yPos = 50
        doc.setFontSize(12)
        doc.setTextColor(primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('Bill To:', margin, yPos)

        yPos += 7
        doc.setFontSize(10)
        doc.setTextColor(textColor)
        doc.setFont('helvetica', 'bold')
        doc.text(data.customer.name, margin, yPos)

        if (data.customer.company_name) {
          yPos += 5
          doc.setFont('helvetica', 'normal')
          doc.text(data.customer.company_name, margin, yPos)
        }

        yPos += 5
        doc.text(`Phone: ${data.customer.phone_number}`, margin, yPos)

        if (data.customer.gst_number) {
          yPos += 5
          doc.text(`GST: ${data.customer.gst_number}`, margin, yPos)
        }

        yPos += 15

        // Table Header
        const tableStartY = yPos
        const colWidths = [25, 20, 25, 15, 30, 30]
        const headers = ['Design #', 'Size', 'Color', 'Qty', 'Unit Price', 'Amount']

        // Header background
        doc.setFillColor(secondaryColor)
        doc.rect(margin, tableStartY, pageWidth - 2 * margin, 8, 'F')

        // Header text
        doc.setFontSize(10)
        doc.setTextColor('#FFFFFF')
        doc.setFont('helvetica', 'bold')
        let xPos = margin + 2

        headers.forEach((header, i) => {
          const align = i >= 3 ? 'right' : 'left'
          if (align === 'right') {
            doc.text(header, xPos + colWidths[i] - 2, tableStartY + 5.5, { align: 'right' })
          } else {
            doc.text(header, xPos, tableStartY + 5.5)
          }
          xPos += colWidths[i]
        })

        // Table Rows
        yPos = tableStartY + 8
        doc.setTextColor(textColor)
        doc.setFont('helvetica', 'normal')

        data.items.forEach((item, index) => {
          // Check if need new page
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }

          // Alternate row colors
          if (index % 2 === 1) {
            doc.setFillColor('#F5F5F5')
            doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F')
          }

          xPos = margin + 2

          // Design Number
          doc.text(item.design_number, xPos, yPos + 5)
          xPos += colWidths[0]

          // Size
          doc.text(item.size || '-', xPos, yPos + 5)
          xPos += colWidths[1]

          // Color
          doc.text(item.color || '-', xPos, yPos + 5)
          xPos += colWidths[2]

          // Quantity
          doc.text(item.quantity.toString(), xPos + colWidths[3] - 2, yPos + 5, { align: 'right' })
          xPos += colWidths[3]

          // Unit Price
          doc.text(`₹${item.unit_price.toLocaleString('en-IN')}`, xPos + colWidths[4] - 2, yPos + 5, { align: 'right' })
          xPos += colWidths[4]

          // Amount
          const lineTotal = item.quantity * item.unit_price
          doc.text(`₹${lineTotal.toLocaleString('en-IN')}`, xPos + colWidths[5] - 2, yPos + 5, { align: 'right' })

          yPos += 7
        })

        // Total line
        yPos += 5
        doc.setDrawColor(primaryColor)
        doc.setLineWidth(0.3)
        doc.line(pageWidth - margin - 70, yPos, pageWidth - margin, yPos)

        yPos += 7
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(primaryColor)
        doc.text('Total Amount:', pageWidth - margin - 70, yPos)
        doc.text(`₹${data.totalAmount.toLocaleString('en-IN')}`, pageWidth - margin, yPos, { align: 'right' })

        // Footer
        doc.setFontSize(9)
        doc.setTextColor(grayColor)
        doc.setFont('helvetica', 'normal')
        doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' })
        doc.text('For any queries, please contact us at sangeetfashion.com', pageWidth / 2, 285, { align: 'center' })

        // Convert to Buffer
        const pdfOutput = doc.output('arraybuffer')
        const buffer = Buffer.from(pdfOutput)

        resolve(buffer)
      } catch (error) {
        reject(error)
      }
    })
  }
}

export const invoiceService = new InvoiceService()
