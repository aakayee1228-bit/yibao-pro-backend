import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import ExcelJS from 'exceljs'
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
   * 使用 exceljs 库，支持丰富样式
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
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('报价单')

    // 设置列宽
    worksheet.columns = [
      { width: 8 },   // A
      { width: 30 },  // B
      { width: 15 },  // C
      { width: 8 },   // D
      { width: 10 },  // E
      { width: 12 },  // F
      { width: 12 },  // G
      { width: 12 },  // H
      { width: 20 },  // I
    ]

    // 边框样式
    const borderStyle = {
      top: { style: 'thin' as any, color: { argb: 'FF000000' } },
      left: { style: 'thin' as any, color: { argb: 'FF000000' } },
      bottom: { style: 'thin' as any, color: { argb: 'FF000000' } },
      right: { style: 'thin' as any, color: { argb: 'FF000000' } }
    } as any

    // 行号
    let row = 1

    // 1. 标题行 - 居中、加粗、大字体
    const titleCell = worksheet.getCell(row, 1)
    titleCell.value = '报价单'
    titleCell.font = { bold: true, size: 20, name: '微软雅黑' }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.mergeCells(row, 1, row, 9)
    row += 2

    // 2. 报价单基本信息 - 两列布局
    const infoData = [
      ['报价单号', fullQuote.quote_no, '', '', '报价日期', new Date(fullQuote.created_at).toLocaleDateString('zh-CN')],
      ['有效期', fullQuote.valid_days + '天', '', '', '', ''],
    ]

    infoData.forEach(rowData => {
      const infoRow = worksheet.getRow(row)
      infoRow.values = rowData

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(row, colIndex + 1)
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.font = { size: 11, name: '微软雅黑' }
        cell.border = borderStyle
      })

      row++
    })

    row += 1

    // 3. 报价方信息
    const quoteTitleRow = worksheet.getRow(row)
    quoteTitleRow.getCell(1).value = '报价方'
    quoteTitleRow.getCell(1).font = { bold: true, size: 14, name: '微软雅黑' }
    quoteTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    worksheet.mergeCells(row, 1, row, 9)
    row++

    const quoteData = [
      ['公司名称', fullQuote.company_name || ''],
      ['联系人', fullQuote.contact_person || ''],
      ['联系电话', fullQuote.contact_phone || ''],
      ['联系地址', fullQuote.contact_address || ''],
    ]

    quoteData.forEach(rowData => {
      const quoteRow = worksheet.getRow(row)
      quoteRow.values = rowData

      quoteRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle' }
        cell.font = { size: 11, name: '微软雅黑' }
        cell.border = borderStyle
      })

      // 合并单元格
      worksheet.mergeCells(row, 2, row, 9)
      row++
    })

    row += 1

    // 4. 客户信息（如果有）
    if (fullQuote.customers) {
      const customerTitleRow = worksheet.getRow(row)
      customerTitleRow.getCell(1).value = '客户信息'
      customerTitleRow.getCell(1).font = { bold: true, size: 14, name: '微软雅黑' }
      customerTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
      worksheet.mergeCells(row, 1, row, 9)
      row++

      const customerData = [
        ['客户名称', fullQuote.customers.company || fullQuote.customers.name || ''],
        ['联系人', fullQuote.customers.name || ''],
        ['联系电话', fullQuote.customers.phone || ''],
        ['客户地址', fullQuote.customers.address || ''],
      ]

      customerData.forEach(rowData => {
        const customerRow = worksheet.getRow(row)
        customerRow.values = rowData

        customerRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle' }
          cell.font = { size: 11, name: '微软雅黑' }
          cell.border = borderStyle
        })

        // 合并单元格
        worksheet.mergeCells(row, 2, row, 9)
        row++
      })

      row += 1
    }

    row += 2

    // 5. 商品明细标题
    const productsTitleRow = worksheet.getRow(row)
    productsTitleRow.getCell(1).value = '商品明细'
    productsTitleRow.getCell(1).font = { bold: true, size: 14, name: '微软雅黑' }
    productsTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    worksheet.mergeCells(row, 1, row, 9)
    row += 2

    // 6. 商品表格表头
    const headerData = ['序号', '商品名称', '型号规格', '单位', '数量', '单价（元）', '折扣（元）', '小计（元）', '备注']
    const headerRow = worksheet.getRow(row)
    headerRow.values = headerData

    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, size: 11, name: '微软雅黑' }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
      cell.border = borderStyle
    })
    row++

    // 7. 商品数据
    fullQuote.items.forEach((item, index) => {
      const dataRow = worksheet.getRow(row)
      dataRow.values = [
        index + 1,
        item.product_name,
        item.model || '',
        item.unit,
        item.quantity,
        parseFloat(item.unit_price),
        parseFloat(item.discount),
        parseFloat(item.amount),
        item.remark || ''
      ]

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { size: 11, name: '微软雅黑' }
        cell.border = borderStyle

        // 数字格式化
        if ([6, 7, 8].includes(colNumber)) {
          cell.numFmt = '0.00'
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
      })

      row++
    })

    row += 1

    // 8. 汇总信息
    const summaryData = [
      ['商品数量', fullQuote.items.length + ' 种', '', '', '小计金额', parseFloat(fullQuote.subtotal)],
      ['', '', '', '', '折扣金额', -parseFloat(fullQuote.discount)],
      ['', '', '', '', '总计金额', parseFloat(fullQuote.total_amount)],
    ]

    summaryData.forEach(rowData => {
      const summaryRow = worksheet.getRow(row)
      summaryRow.values = rowData

      summaryRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { size: 11, name: '微软雅黑' }
        cell.border = borderStyle

        // 数字格式化
        if (colNumber === 6) {
          cell.numFmt = '0.00'
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          // 总计行突出显示
          if (rowData[4] === '总计金额') {
            cell.font = { bold: true, size: 12, color: { argb: 'FFFF0000' }, name: '微软雅黑' }
          }
        } else if (colNumber > 0 && colNumber <= 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        } else if (colNumber === 1) {
          cell.font = { bold: true, name: '微软雅黑' }
        }
      })

      // 合并前几列的空白单元格
      worksheet.mergeCells(row, 1, row, 3)
      worksheet.mergeCells(row, 4, row, 5)

      row++
    })

    row += 1

    // 9. 备注
    if (fullQuote.remark) {
      const remarkRow = worksheet.getRow(row)
      remarkRow.getCell(1).value = '备注'
      remarkRow.getCell(1).font = { bold: true, name: '微软雅黑' }
      remarkRow.getCell(2).value = fullQuote.remark
      worksheet.mergeCells(row, 2, row, 9)
      row++

      worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = borderStyle
        })
      })

      row += 1
    }

    // 10. 底部说明
    const footerRow = worksheet.getRow(row)
    footerRow.getCell(1).value = '此报价单仅供参考，具体以实际合同为准'
    worksheet.mergeCells(row, 1, row, 9)
    footerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    footerRow.getCell(1).font = { size: 10, color: { argb: 'FF666666' }, name: '微软雅黑' }
    row += 2

    // 11. 底部信息
    const footerData = [
      ['报价方', fullQuote.company_name || ''],
      ['联系人', fullQuote.contact_person || ''],
      ['联系电话', fullQuote.contact_phone || ''],
      ['联系地址', fullQuote.contact_address || ''],
    ]

    footerData.forEach(rowData => {
      const footerRow = worksheet.getRow(row)
      footerRow.values = rowData

      footerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { size: 11, name: '微软雅黑' }
        cell.border = borderStyle
      })

      worksheet.mergeCells(row, 2, row, 9)
      row++
    })

    // 生成 Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer() as Buffer
    const size = excelBuffer.byteLength
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
    const wordBuffer = await Packer.toBuffer(doc) as Buffer
    const size = wordBuffer.byteLength
    const base64 = wordBuffer.toString('base64')

    console.log('Word 生成成功，大小:', size, 'bytes，商品数量:', fullQuote.items.length)

    return {
      base64,
      size,
    }
  }
}
