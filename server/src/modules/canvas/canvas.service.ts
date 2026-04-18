import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx'

interface QuoteItem {
  id: string
  quote_id: string
  product_id: string | null
  product_name: string
  model: string | null
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
   * 采用通用报价单模板格式，带样式
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

    // 报价单主表（使用数组数组格式）
    const excelData: (string | number)[][] = []

    // 1. 标题行
    excelData.push([])
    excelData.push([])
    excelData.push(['报价单'])
    excelData.push([])

    // 2. 报价单基本信息
    excelData.push(['报价单号', fullQuote.quote_no, '', '报价日期', new Date(fullQuote.created_at).toLocaleDateString('zh-CN')])
    excelData.push(['有效期', fullQuote.valid_days + '天', '', '', ''])

    // 3. 报价方信息
    excelData.push([])
    excelData.push(['报价方'])
    excelData.push(['公司名称', fullQuote.company_name || ''])
    excelData.push(['联系人', fullQuote.contact_person || ''])
    excelData.push(['联系电话', fullQuote.contact_phone || ''])
    excelData.push(['联系地址', fullQuote.contact_address || ''])

    // 4. 客户信息
    if (fullQuote.customers) {
      excelData.push([])
      excelData.push(['客户信息'])
      excelData.push(['客户名称', fullQuote.customers.company || fullQuote.customers.name || ''])
      excelData.push(['联系人', fullQuote.customers.name || ''])
      excelData.push(['联系电话', fullQuote.customers.phone || ''])
      excelData.push(['客户地址', fullQuote.customers.address || ''])
    }

    excelData.push([])
    excelData.push([])
    excelData.push(['商品明细'])
    excelData.push([])

    // 5. 商品表格表头
    excelData.push([
      '序号',
      '商品名称',
      '型号规格',
      '单位',
      '数量',
      '单价（元）',
      '折扣（元）',
      '小计（元）',
      '备注'
    ])

    // 6. 商品数据
    fullQuote.items.forEach((item, index) => {
      excelData.push([
        index + 1,
        item.product_name,
        item.model || '',
        item.unit,
        item.quantity,
        parseFloat(item.unit_price).toFixed(2),
        parseFloat(item.discount).toFixed(2),
        parseFloat(item.amount).toFixed(2),
        item.remark || ''
      ])
    })

    excelData.push([])

    // 7. 汇总信息（两列布局）
    excelData.push([
      '商品数量',
      fullQuote.items.length + ' 种',
      '',
      '',
      '小计金额',
      parseFloat(fullQuote.subtotal).toFixed(2) + ' 元'
    ])
    excelData.push([
      '',
      '',
      '',
      '',
      '折扣金额',
      '-' + parseFloat(fullQuote.discount).toFixed(2) + ' 元'
    ])
    excelData.push([
      '',
      '',
      '',
      '',
      '总计金额',
      parseFloat(fullQuote.total_amount).toFixed(2) + ' 元'
    ])

    excelData.push([])

    // 8. 备注
    if (fullQuote.remark) {
      excelData.push(['备注', fullQuote.remark])
      excelData.push([])
    }

    // 9. 底部说明
    excelData.push(['此报价单仅供参考，具体以实际合同为准'])
    excelData.push([])

    // 10. 底部信息
    excelData.push(['报价方', fullQuote.company_name || ''])
    excelData.push(['联系人', fullQuote.contact_person || ''])
    excelData.push(['联系电话', fullQuote.contact_phone || ''])
    excelData.push(['联系地址', fullQuote.contact_address || ''])

    // 添加 sheet
    const sheet = XLSX.utils.aoa_to_sheet(excelData)

    // 设置列宽
    sheet['!cols'] = [
      { wch: 10 },  // 序号
      { wch: 30 },  // 商品名称
      { wch: 15 },  // 型号规格
      { wch: 8 },   // 单位
      { wch: 10 },  // 数量
      { wch: 12 },  // 单价
      { wch: 12 },  // 折扣
      { wch: 12 },  // 小计
      { wch: 20 },  // 备注
    ]

    // 设置合并单元格
    sheet['!merges'] = [
      // 标题居中
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      // 报价单基本信息（两列布局）
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
      { s: { r: 4, c: 6 }, e: { r: 4, c: 8 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
      // 报价方信息
      { s: { r: 7, c: 0 }, e: { r: 7, c: 8 } },
      // 客户信息（如果有）
      ...fullQuote.customers ? [
        { s: { r: 12, c: 0 }, e: { r: 12, c: 8 } },
      ] : [],
      // 商品明细标题
      ...fullQuote.customers ? [
        { s: { r: 17, c: 0 }, e: { r: 17, c: 8 } },
      ] : [
        { s: { r: 12, c: 0 }, e: { r: 12, c: 8 } },
      ],
      // 底部说明
      { s: { r: 18 + fullQuote.items.length, c: 0 }, e: { r: 18 + fullQuote.items.length, c: 8 } },
    ]

    XLSX.utils.book_append_sheet(workbook, sheet, '报价单')

    // 生成 Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const size = excelBuffer.length
    const base64 = excelBuffer.toString('base64')

    console.log('Excel 生成成功，大小:', size, 'bytes，商品数量:', fullQuote.items.length)

    return {
      base64,
      size,
    }
  }

  /**
   * 生成报价单 Word（Base64 格式）
   * 采用通用报价单模板格式
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

    // 1. 标题 - 居中大标题
    children.push(
      new Paragraph({
        text: '报 价 单',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 300 },
      })
    )

    // 2. 编号信息区 - 两列布局（使用空格对齐）
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `报价单号：${fullQuote.quote_no}`,
            size: 24,
          }),
          new TextRun({
            text: `    报价日期：${new Date(fullQuote.created_at).toLocaleDateString('zh-CN')}`,
            size: 24,
          }),
        ],
        spacing: { after: 120 },
      })
    )
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `有效期：${fullQuote.valid_days}天`,
            size: 24,
          }),
        ],
        spacing: { after: 240 },
      })
    )

    // 3. 客户信息
    if (fullQuote.customers) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '客户信息',
              bold: true,
              size: 24,
              underline: {},
            }),
          ],
          spacing: { before: 200, after: 120 },
        })
      )

      const customerInfo = [
        `客户名称：${fullQuote.customers.company || fullQuote.customers.name || ''}`,
        `联系人：${fullQuote.customers.name || ''}`,
        `联系电话：${fullQuote.customers.phone || ''}`,
        `客户地址：${fullQuote.customers.address || ''}`,
      ]

      customerInfo.forEach(info => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: info, size: 24 })],
            spacing: { after: 120 },
          })
        )
      })
    }

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )

    // 4. 商品明细表格
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '商品明细',
            bold: true,
            size: 24,
            underline: {},
          }),
        ],
        spacing: { before: 200, after: 120 },
      })
    )

    // 商品表格
    const tableRows: TableRow[] = []

    // 表头行
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '序号', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '商品名称', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '型号规格', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '单位', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '数量', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '单价（元）', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '折扣（元）', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '小计（元）', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            shading: { fill: 'E0E0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '备注', bold: true })], alignment: AlignmentType.CENTER })],
          }),
        ],
      })
    )

    // 商品数据行
    fullQuote.items.forEach((item, index) => {
      const itemParas: Paragraph[] = [
        new Paragraph({ children: [new TextRun({ text: item.remark || '', size: 20 })] })
      ]

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.product_name })] })],
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.model || '' })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 7, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.unit })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.quantity })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: parseFloat(item.unit_price).toFixed(2) })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: parseFloat(item.discount).toFixed(2) })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: parseFloat(item.amount).toFixed(2) })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 9, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: item.remark || '', size: 20 })] })],
            }),
          ],
        })
      )
    })

    // 汇总行
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: '汇总信息', bold: true })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: '商品数量' })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: fullQuote.items.length.toString() })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: '小计（元）' })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: parseFloat(fullQuote.subtotal).toFixed(2) })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
        ],
      })
    )

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: '折扣（元）' })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: '-' + parseFloat(fullQuote.discount).toFixed(2) })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
        ],
      })
    )

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFE0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: '总计（元）', bold: true, size: 28 })], alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFE0E0' },
            children: [new Paragraph({ children: [new TextRun({ text: parseFloat(fullQuote.total_amount).toFixed(2), bold: true, size: 28 })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')],
          }),
        ],
      })
    )

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      }) as any
    )

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 300 },
      })
    )

    // 5. 备注
    if (fullQuote.remark) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '备注：',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 120 },
        })
      )
      children.push(
        new Paragraph({
          children: [new TextRun({ text: fullQuote.remark, size: 24 })],
          spacing: { after: 300 },
        })
      )
    }

    // 6. 底部信息
    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '报价方：',
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: fullQuote.company_name || '',
            size: 24,
          }),
          new TextRun({
            text: '    联系人：',
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: fullQuote.contact_person || '',
            size: 24,
          }),
        ],
        spacing: { after: 120 },
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '联系电话：',
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: fullQuote.contact_phone || '',
            size: 24,
          }),
          new TextRun({
            text: '    报价日期：',
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: new Date(fullQuote.created_at).toLocaleDateString('zh-CN'),
            size: 24,
          }),
        ],
        spacing: { after: 120 },
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '联系地址：',
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: fullQuote.contact_address || '',
            size: 24,
          }),
        ],
        spacing: { after: 300 },
      })
    )

    // 7. 底部说明
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '此报价单仅供参考，具体以实际合同为准',
            size: 20,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 200 },
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

    console.log('Word 生成成功，大小:', size, 'bytes，商品数量:', fullQuote.items.length)

    return {
      base64,
      size,
    }
  }
}
