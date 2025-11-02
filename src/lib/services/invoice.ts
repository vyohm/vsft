import PDFDocument from 'pdfkit'

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
        const doc = new PDFDocument({ margin: 50, size: 'A4' })
        const buffers: Buffer[] = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers)
          resolve(pdfData)
        })
        doc.on('error', reject)

        // Header with logo and company info
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#2C5F2D')
          .text('Sangeet Fashion Textiles', 50, 50)
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text('Premium Fashion Textiles', 50, 80)
          .text('sangeetfashion.com', 50, 95)

        // Invoice title
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#2C5F2D')
          .text('INVOICE', 400, 50, { align: 'right' })

        // Order details box
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`Order #: ${data.orderNumber}`, 400, 80, { align: 'right' })
          .text(`Date: ${new Date(data.orderDate).toLocaleDateString('en-IN')}`, 400, 95, { align: 'right' })

        // Divider line
        doc
          .strokeColor('#2C5F2D')
          .lineWidth(2)
          .moveTo(50, 130)
          .lineTo(550, 130)
          .stroke()

        // Customer Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#2C5F2D')
          .text('Bill To:', 50, 150)

        let yPos = 170
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(data.customer.name, 50, yPos)

        yPos += 15
        if (data.customer.company_name) {
          doc
            .font('Helvetica')
            .text(data.customer.company_name, 50, yPos)
          yPos += 15
        }

        doc.text(`Phone: ${data.customer.phone_number}`, 50, yPos)
        yPos += 15

        if (data.customer.gst_number) {
          doc.text(`GST: ${data.customer.gst_number}`, 50, yPos)
          yPos += 15
        }

        yPos += 20

        // Table Header
        const tableTop = yPos
        const tableHeaders = ['Design #', 'Size', 'Color', 'Qty', 'Unit Price', 'Amount']
        const columnWidths = [80, 60, 80, 50, 80, 80]
        let xPos = 50

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#FFFFFF')
          .rect(50, tableTop, 500, 25)
          .fill('#97BC62')

        doc.fillColor('#FFFFFF')
        tableHeaders.forEach((header, index) => {
          const align = index >= 3 ? 'right' : 'left'
          const textWidth = columnWidths[index]
          const textX = align === 'right' ? xPos + textWidth - 10 : xPos + 5

          doc.text(header, textX, tableTop + 8, {
            width: textWidth,
            align: align
          })
          xPos += columnWidths[index]
        })

        // Table Rows
        yPos = tableTop + 30
        doc.fillColor('#000000').font('Helvetica')

        data.items.forEach((item, index) => {
          // Add new page if needed
          if (yPos > 700) {
            doc.addPage()
            yPos = 50
          }

          xPos = 50

          // Alternate row colors
          if (index % 2 === 1) {
            doc.rect(50, yPos - 5, 500, 20).fillAndStroke('#F5F5F5', '#F5F5F5')
          }

          doc.fillColor('#000000')

          // Design Number
          doc.text(item.design_number, xPos + 5, yPos, {
            width: columnWidths[0],
            align: 'left'
          })
          xPos += columnWidths[0]

          // Size
          doc.text(item.size || '-', xPos + 5, yPos, {
            width: columnWidths[1],
            align: 'left'
          })
          xPos += columnWidths[1]

          // Color
          doc.text(item.color || '-', xPos + 5, yPos, {
            width: columnWidths[2],
            align: 'left'
          })
          xPos += columnWidths[2]

          // Quantity
          doc.text(item.quantity.toString(), xPos + columnWidths[3] - 10, yPos, {
            width: columnWidths[3],
            align: 'right'
          })
          xPos += columnWidths[3]

          // Unit Price
          doc.text(`₹${item.unit_price.toLocaleString('en-IN')}`, xPos + columnWidths[4] - 10, yPos, {
            width: columnWidths[4],
            align: 'right'
          })
          xPos += columnWidths[4]

          // Amount
          const lineTotal = item.quantity * item.unit_price
          doc.text(`₹${lineTotal.toLocaleString('en-IN')}`, xPos + columnWidths[5] - 10, yPos, {
            width: columnWidths[5],
            align: 'right'
          })

          yPos += 20
        })

        // Total line
        yPos += 10
        doc
          .strokeColor('#2C5F2D')
          .lineWidth(1)
          .moveTo(350, yPos)
          .lineTo(550, yPos)
          .stroke()

        yPos += 15
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#2C5F2D')
          .text('Total Amount:', 350, yPos)
          .text(`₹${data.totalAmount.toLocaleString('en-IN')}`, 430, yPos, {
            width: 120,
            align: 'right'
          })

        // Footer
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#666666')
          .text(
            'Thank you for your business!',
            50,
            750,
            { align: 'center', width: 500 }
          )
          .text(
            'For any queries, please contact us at sangeetfashion.com',
            50,
            765,
            { align: 'center', width: 500 }
          )

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}

export const invoiceService = new InvoiceService()
