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

        // Header - Company Info
        doc.setFontSize(24)
        doc.setTextColor(primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('Sangeet Fashion Textiles', margin, 20)

        doc.setFontSize(9)
        doc.setTextColor(textColor)
        doc.setFont('helvetica', 'normal')
        doc.text('48A Park Street, 3rd Floor, Kolkata 700016', margin, 27)
        doc.text('Phone: 9830043782 | Email: sales@sangeetfashion.com', margin, 32)
        doc.text('GSTIN: 19AALCS8835R1Z4', margin, 37)

        // Invoice title and details
        doc.setFontSize(20)
        doc.setTextColor(primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('TAX INVOICE', pageWidth - margin, 20, { align: 'right' })

        doc.setFontSize(10)
        doc.setTextColor(textColor)
        doc.setFont('helvetica', 'normal')
        doc.text(`Invoice #: ${data.orderNumber}`, pageWidth - margin, 27, { align: 'right' })
        doc.text(`Date: ${new Date(data.orderDate).toLocaleDateString('en-IN')}`, pageWidth - margin, 32, { align: 'right' })

        // Divider line
        doc.setDrawColor(primaryColor)
        doc.setLineWidth(0.5)
        doc.line(margin, 45, pageWidth - margin, 45)

        // Customer Information
        let yPos = 55
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
        doc.setFont('helvetica', 'normal')
        doc.text(`Phone: ${data.customer.phone_number}`, margin, yPos)

        if (data.customer.gst_number) {
          yPos += 5
          doc.text(`GSTIN: ${data.customer.gst_number}`, margin, yPos)
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

        // Calculate subtotal, tax, and total
        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
        const gstRate = 0.18 // 18% GST
        const cgst = subtotal * (gstRate / 2) // 9% CGST
        const sgst = subtotal * (gstRate / 2) // 9% SGST
        const shippingCharges = 0
        const totalWithTax = subtotal + cgst + sgst + shippingCharges

        // Summary section
        yPos += 10
        const summaryX = pageWidth - margin - 70

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(textColor)

        // Subtotal
        doc.text('Subtotal:', summaryX, yPos)
        doc.text(`₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })

        yPos += 6
        // CGST (9%)
        doc.text('CGST (9%):', summaryX, yPos)
        doc.text(`₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })

        yPos += 6
        // SGST (9%)
        doc.text('SGST (9%):', summaryX, yPos)
        doc.text(`₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })

        yPos += 6
        // Shipping
        doc.text('Shipping Charges:', summaryX, yPos)
        doc.text(`₹${shippingCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })

        // Total line
        yPos += 8
        doc.setDrawColor(primaryColor)
        doc.setLineWidth(0.5)
        doc.line(summaryX, yPos, pageWidth - margin, yPos)

        yPos += 7
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(primaryColor)
        doc.text('Total Amount:', summaryX, yPos)
        doc.text(`₹${totalWithTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })

        // Footer
        doc.setFontSize(8)
        doc.setTextColor(grayColor)
        doc.setFont('helvetica', 'normal')
        doc.text('Thank you for your business!', pageWidth / 2, 275, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.text('Sangeet Fashion Textiles', pageWidth / 2, 280, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.text('Phone: 9830043782 | Email: sales@sangeetfashion.com', pageWidth / 2, 285, { align: 'center' })

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
