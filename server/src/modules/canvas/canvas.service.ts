import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'

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
  customer_id: string | null
  status: string
  subtotal: string
  discount: string
  total_amount: string
  remark: string | null
  valid_days: string
  created_at: string
  company_name: string
  contact_person: string
  contact_phone: string
  contact_address: string
  contact_email: string
  customers: Customer | null
  items: QuoteItem[]
}

@Injectable()
export class CanvasService {
  /**
   * 生成报价单 Excel（Base64 格式）
   */
  async generateExcel(quoteId: string, userId?: string): Promise<{ base64: string; size: number }> {
    const client = getSupabaseClient()

    // 获取报价单详情
    const { data: quote, error } = await client
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (error || !quote) {
      console.error('获取报价单详情失败:', error)
      throw new BadRequestException('获取报价单详情失败')
    }

    // 获取客户信息
    let customer = null
    if (quote.customer_id) {
      const { data: customerData } = await client
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .single()
      customer = customerData
    }

    // 获取商品列表
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

    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 报价单信息
    const quoteInfoData = [
      ['报价单信息'],
      ['报价单号', fullQuote.quote_no],
      ['创建日期', new Date(fullQuote.created_at).toLocaleDateString('zh-CN')],
      ['有效期', fullQuote.valid_days + '天'],
      [],
      ['报价方信息'],
      ['公司名称', fullQuote.company_name || ''],
      ['联系人', fullQuote.contact_person || ''],
      ['联系电话', fullQuote.contact_phone || ''],
      ['联系地址', fullQuote.contact_address || ''],
      [],
    ]

    if (fullQuote.customers) {
      quoteInfoData.push(['客户信息'])
      quoteInfoData.push(['客户姓名', fullQuote.customers.name || ''])
      quoteInfoData.push(['联系电话', fullQuote.customers.phone || ''])
      quoteInfoData.push(['地址', fullQuote.customers.address || ''])
      quoteInfoData.push(['公司', fullQuote.customers.company || ''])
      quoteInfoData.push([])
    }

    // 添加报价单信息 sheet
    const quoteInfoSheet = XLSX.utils.aoa_to_sheet(quoteInfoData)
    quoteInfoSheet['!cols'] = [
      { wch: 15 },
      { wch: 30 },
    ]
    XLSX.utils.book_append_sheet(workbook, quoteInfoSheet, '报价单信息')

    // 商品列表
    const excelItemsData = [
      ['商品名称', '数量', '单位', '单价', '折扣', '小计', '备注'],
      ...fullQuote.items.map(item => [
        item.product_name,
        item.quantity,
        item.unit,
        item.unit_price,
        item.discount,
        item.amount,
        item.remark || ''
      ]),
      [],
      ['小计', '', '', '', '', fullQuote.subtotal, ''],
      ['折扣', '', '', '', '-', fullQuote.discount, ''],
      ['总计', '', '', '', '', fullQuote.total_amount, ''],
    ]

    // 添加商品列表 sheet
    const itemsSheet = XLSX.utils.aoa_to_sheet(excelItemsData)
    itemsSheet['!cols'] = [
      { wch: 30 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(workbook, itemsSheet, '商品列表')

    // 备注信息
    if (fullQuote.remark) {
      const remarkData = [
        ['备注'],
        [fullQuote.remark],
      ]
      const remarkSheet = XLSX.utils.aoa_to_sheet(remarkData)
      remarkSheet['!cols'] = [{ wch: 80 }]
      XLSX.utils.book_append_sheet(workbook, remarkSheet, '备注')
    }

    // 生成 Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const size = excelBuffer.length
    const base64 = excelBuffer.toString('base64')

    console.log('Excel 生成成功，大小:', size, 'bytes')

    return {
      base64,
      size,
    }
  }

  /**
   * 生成报价单 Word（Base64 格式）
   */
  async generateWord(quoteId: string, userId?: string): Promise<{ base64: string; size: number }> {
    const client = getSupabaseClient()

    // 获取报价单详情
    const { data: quote, error } = await client
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (error || !quote) {
      console.error('获取报价单详情失败:', error)
      throw new BadRequestException('获取报价单详情失败')
    }

    // 获取客户信息
    let customer = null
    if (quote.customer_id) {
      const { data: customerData } = await client
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .single()
      customer = customerData
    }

    // 获取商品列表
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

    // 创建 Word 文档
    const children: Paragraph[] = []

    // 标题
    children.push(
      new Paragraph({
        text: '报价单',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      })
    )

    // 报价单信息
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '报价单号：',
            bold: true,
          }),
          new TextRun(fullQuote.quote_no),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '创建日期：',
            bold: true,
          }),
          new TextRun(new Date(fullQuote.created_at).toLocaleDateString('zh-CN')),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '有效期：',
            bold: true,
          }),
          new TextRun(fullQuote.valid_days + '天'),
        ],
        spacing: { after: 200 },
      })
    )

    // 报价方信息
    if (fullQuote.company_name || fullQuote.contact_person || fullQuote.contact_phone) {
      children.push(
        new Paragraph({
          text: '报价方信息',
          heading: 'Heading2',
          spacing: { before: 200, after: 100 },
        })
      )

      if (fullQuote.company_name) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '公司名称：', bold: true }),
              new TextRun(fullQuote.company_name),
            ],
            spacing: { after: 100 },
          })
        )
      }
      if (fullQuote.contact_person) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '联系人：', bold: true }),
              new TextRun(fullQuote.contact_person),
            ],
            spacing: { after: 100 },
          })
        )
      }
      if (fullQuote.contact_phone) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '联系电话：', bold: true }),
              new TextRun(fullQuote.contact_phone),
            ],
            spacing: { after: 100 },
          })
        )
      }
      if (fullQuote.contact_address) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '联系地址：', bold: true }),
              new TextRun(fullQuote.contact_address),
            ],
            spacing: { after: 200 },
          })
        )
      }
    }

    // 客户信息
    if (fullQuote.customers) {
      children.push(
        new Paragraph({
          text: '客户信息',
          heading: 'Heading2',
          spacing: { before: 200, after: 100 },
        })
      )

      if (fullQuote.customers.name) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '客户姓名：', bold: true }),
              new TextRun(fullQuote.customers.name),
            ],
            spacing: { after: 100 },
          })
        )
      }
      if (fullQuote.customers.phone) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '联系电话：', bold: true }),
              new TextRun(fullQuote.customers.phone),
            ],
            spacing: { after: 100 },
          })
        )
      }
      if (fullQuote.customers.address) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '地址：', bold: true }),
              new TextRun(fullQuote.customers.address),
            ],
            spacing: { after: 100 },
          })
        )
      }
      if (fullQuote.customers.company) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '公司：', bold: true }),
              new TextRun(fullQuote.customers.company),
            ],
            spacing: { after: 200 },
          })
        )
      }
    }

    // 商品列表
    children.push(
      new Paragraph({
        text: '商品列表',
        heading: 'Heading2',
        spacing: { before: 200, after: 100 },
      })
    )

    // 商品表格
    const tableRows = [
      // 表头
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: '3B82F6' },
            children: [new Paragraph({ children: [new TextRun({ text: '商品名称', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '3B82F6' },
            children: [new Paragraph({ children: [new TextRun({ text: '数量', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '3B82F6' },
            children: [new Paragraph({ children: [new TextRun({ text: '单价', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '3B82F6' },
            children: [new Paragraph({ children: [new TextRun({ text: '折扣', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '3B82F6' },
            children: [new Paragraph({ children: [new TextRun({ text: '小计', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      // 商品数据
      ...fullQuote.items.map(item =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph(item.product_name)],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph(`${item.quantity}${item.unit}`), item.remark ? new Paragraph({ children: [new TextRun({ text: `备注：${item.remark}`, size: 20, color: '666666' })] }) : undefined].filter(Boolean) as Paragraph[],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph(`¥${item.unit_price}`)],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph(`¥${item.discount}`)],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph(`¥${item.amount}`)],
            }),
          ],
        })
      ),
      // 合计行
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            columnSpan: 4,
            children: [new Paragraph({ children: [new TextRun({ text: '小计：¥' + fullQuote.subtotal, bold: true })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph(`¥${fullQuote.subtotal}`)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            columnSpan: 4,
            children: [new Paragraph({ children: [new TextRun({ text: '折扣：-¥' + fullQuote.discount, bold: true })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph(`-¥${fullQuote.discount}`)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            columnSpan: 4,
            shading: { fill: '1E40AF' },
            children: [new Paragraph({ children: [new TextRun({ text: '总计：¥' + fullQuote.total_amount, bold: true, size: 28, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: '1E40AF' },
            children: [new Paragraph({ children: [new TextRun({ text: '¥' + fullQuote.total_amount, bold: true, size: 28, color: 'FFFFFF' })] })],
          }),
        ],
      }),
    ]

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      }) as any
    )

    // 备注
    if (fullQuote.remark) {
      children.push(
        new Paragraph({
          text: '备注',
          heading: 'Heading2',
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun(fullQuote.remark)],
          spacing: { after: 300 },
        })
      )
    }

    // 底部信息
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '此报价单仅供参考，具体以实际合同为准', size: 20, color: '666666' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      })
    )

    // 创建文档
    const doc = new Document({
      sections: [
        {
          children,
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
        },
      ],
    })

    // 生成 Word buffer
    const wordBuffer = await Packer.toBuffer(doc)
    const size = wordBuffer.length
    const base64 = wordBuffer.toString('base64')

    console.log('Word 生成成功，大小:', size, 'bytes')

    return {
      base64,
      size,
    }
  }
}
