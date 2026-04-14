import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
// 使用 CommonJS 导入方式
const PDFDocument = require('pdfkit')
import * as path from 'path'
import * as fs from 'fs'

interface QuoteItem {
  id: string
  quote_id: string
  product_id: string | null
  product_name: string
  unit: string
  quantity: string
  unit_price: string
  discount: string
  amount: string
  remark: string | null
}

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  company: string
}

interface Quote {
  id: string
  quote_no: string
  customer_id: string
  status: string
  subtotal: string
  discount: string
  total_amount: string
  remark: string
  valid_days: number
  created_at: string
  company_name?: string
  contact_person?: string
  contact_phone?: string
  contact_address?: string
  contact_email?: string
  customers: Customer | null
  items: QuoteItem[]
}

@Injectable()
export class CanvasService {
  /**
   * 生成报价单 PDF
   */
  async generateQuoteImage(quoteId: string, userId?: string): Promise<{ tempFilePath: string; size: number }> {
    const client = getSupabaseClient()

    // 获取报价单详情（简化查询，避免关联查询失败）
    const { data: quote, error } = await client
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (error || !quote) {
      console.error('获取报价单详情失败:', error)
      throw new BadRequestException('获取报价单详情失败')
    }

    // 如果需要客户信息，单独查询
    let customer = null
    if (quote.customer_id) {
      const { data: customerData } = await client
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .single()
      customer = customerData
    }

    // 如果需要商品列表，单独查询
    let items: QuoteItem[] = []
    const { data: itemsData } = await client
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)

    if (itemsData) {
      items = itemsData as QuoteItem[]
    }

    // 组装完整数据
    const fullQuote = {
      ...quote,
      customers: customer,
      items: items
    }

    // 创建 PDF 文档
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    })

    // 保存到内存
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    // 生成 PDF 内容
    this.generatePDFContent(doc, fullQuote)

    doc.end()

    // 等待 PDF 生成完成
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const size = buffer.length

        // 保存临时文件
        const tempDir = process.env.TEMP || '/tmp'
        const tempFilePath = path.join(tempDir, `quote_${Date.now()}.pdf`)

        try {
          fs.writeFileSync(tempFilePath, buffer)

          console.log('PDF 生成成功，大小:', size, 'bytes')

          resolve({
            tempFilePath,
            size,
          })
        } catch (error) {
          console.error('保存 PDF 失败:', error)
          reject(new BadRequestException('保存 PDF 失败'))
        }
      })

      doc.on('error', (error) => {
        console.error('PDF 生成失败:', error)
        reject(new BadRequestException('PDF 生成失败'))
      })
    })
  }

  /**
   * 生成 PDF 内容
   */
  private generatePDFContent(doc: any, quote: any): void {
    const width = doc.page.width
    const height = doc.page.height
    const margin = 50

    // 颜色定义
    const colors = {
      blue800: '#1E40AF',
      blue500: '#3B82F6',
      gray100: '#F3F4F6',
      gray600: '#4B5563',
      black: '#000000',
      white: '#FFFFFF',
    }

    let y = margin

    // 标题
    doc.fontSize(24)
    .fillColor(colors.blue800)
    .font('Helvetica-Bold')
    .text('报价单', { align: 'center' })
    .moveDown(1)

    y += 60

    // 报价单号和日期
    doc.fontSize(12)
    .fillColor(colors.gray600)
    .font('Helvetica')
    .text(`报价单号：${quote.quote_no}`, { width: width - margin * 2 })
    .text(`创建日期：${new Date(quote.created_at).toLocaleDateString('zh-CN')}`, { width: width - margin * 2 })
    .text(`有效期：${quote.valid_days}天`, { width: width - margin * 2 })
    .moveDown(1)

    y += 40

    // 绘制分隔线
    doc.moveTo(margin, y)
    .lineTo(width - margin, y)
    .lineWidth(1)
    .strokeColor(colors.gray100)
    .stroke()

    y += 20

    // 报价方信息
    if (quote.company_name || quote.contact_person || quote.contact_phone) {
      doc.fontSize(14)
      .fillColor(colors.blue800)
      .font('Helvetica-Bold')
      .text('报价方信息', { continued: false })
      .moveDown(0.3)

      doc.fontSize(11)
      .fillColor(colors.black)
      .font('Helvetica')

      if (quote.company_name) {
        doc.text(`公司名称：${quote.company_name}`)
      }
      if (quote.contact_person) {
        doc.text(`联系人：${quote.contact_person}`)
      }
      if (quote.contact_phone) {
        doc.text(`联系电话：${quote.contact_phone}`)
      }
      if (quote.contact_address) {
        doc.text(`联系地址：${quote.contact_address}`)
      }

      doc.moveDown(1)
    }

    y = doc.y

    // 绘制分隔线
    doc.moveTo(margin, y)
    .lineTo(width - margin, y)
    .lineWidth(1)
    .strokeColor(colors.gray100)
    .stroke()

    y += 20

    // 客户信息
    if (quote.customers) {
      doc.fontSize(14)
      .fillColor(colors.blue800)
      .font('Helvetica-Bold')
      .text('客户信息', { continued: false })
      .moveDown(0.3)

      doc.fontSize(11)
      .fillColor(colors.black)
      .font('Helvetica')

      if (quote.customers.name) {
        doc.text(`客户姓名：${quote.customers.name}`)
      }
      if (quote.customers.phone) {
        doc.text(`联系电话：${quote.customers.phone}`)
      }
      if (quote.customers.address) {
        doc.text(`地址：${quote.customers.address}`)
      }
      if (quote.customers.company) {
        doc.text(`公司：${quote.customers.company}`)
      }

      doc.moveDown(1)
    }

    y = doc.y

    // 绘制分隔线
    doc.moveTo(margin, y)
    .lineTo(width - margin, y)
    .lineWidth(1)
    .strokeColor(colors.gray100)
    .stroke()

    y += 20

    // 商品列表标题
    doc.fontSize(14)
    .fillColor(colors.blue800)
    .font('Helvetica-Bold')
    .text('商品列表', { continued: false })
    .moveDown(0.3)

    // 表格头
    const tableY = doc.y
    const colWidths = [200, 80, 100, 120]
    const startX = margin

    doc.fontSize(10)
    .fillColor(colors.white)
    .rect(startX, tableY, width - margin * 2, 20)
    .fill(colors.blue500)

    doc.fillColor(colors.white)
    .text('商品名称', startX + 5, tableY + 5)
    .text('数量', startX + colWidths[0] + 5, tableY + 5)
    .text('单价', startX + colWidths[0] + colWidths[1] + 5, tableY + 5)
    .text('小计', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableY + 5)

    // 商品列表
    doc.fontSize(10)
    .fillColor(colors.black)
    .font('Helvetica')

    quote.items.forEach((item: QuoteItem, index: number) => {
      const itemY = tableY + 25 + index * 20

      // 交替背景色
      if (index % 2 === 1) {
        doc.rect(startX, itemY - 2, width - margin * 2, 20)
        .fill(colors.gray100)
      }

      doc.text(item.product_name, startX + 5, itemY + 5)
      .text(`${item.quantity}${item.unit}`, startX + colWidths[0] + 5, itemY + 5)
      .text(`¥${item.unit_price}`, startX + colWidths[0] + colWidths[1] + 5, itemY + 5)
      .text(`¥${item.amount}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, itemY + 5)

      if (item.remark) {
        doc.fontSize(9)
        .fillColor(colors.gray600)
        .text(`备注：${item.remark}`, startX + 5, itemY + 25)
        .fontSize(10)
        .fillColor(colors.black)
      }
    })

    y = doc.y + 10

    // 绘制分隔线
    doc.moveTo(margin, y)
    .lineTo(width - margin, y)
    .lineWidth(1)
    .strokeColor(colors.gray100)
    .stroke()

    y += 20

    // 合计信息
    doc.fontSize(11)
    .fillColor(colors.gray600)
    .font('Helvetica')
    .text(`小计：¥${quote.subtotal}`, { width: width - margin * 2, align: 'right' })
    .text(`折扣：-¥${quote.discount}`, { width: width - margin * 2, align: 'right' })
    .fontSize(16)
    .fillColor(colors.blue800)
    .font('Helvetica-Bold')
    .text(`总计：¥${quote.total_amount}`, { width: width - margin * 2, align: 'right' })
    .moveDown(1)

    y = doc.y

    // 备注
    if (quote.remark) {
      doc.fontSize(14)
      .fillColor(colors.blue800)
      .font('Helvetica-Bold')
      .text('备注', { continued: false })
      .moveDown(0.3)

      doc.fontSize(11)
      .fillColor(colors.black)
      .font('Helvetica')
      .text(quote.remark, { width: width - margin * 2 })
      .moveDown(1)
    }

    // 底部信息
    y = doc.page.height - margin - 30

    doc.moveTo(margin, y)
    .lineTo(width - margin, y)
    .lineWidth(1)
    .strokeColor(colors.gray100)
    .stroke()

    doc.fontSize(9)
    .fillColor(colors.gray600)
    .font('Helvetica')
    .text('此报价单仅供参考，具体以实际合同为准', { align: 'center' })
  }
}
