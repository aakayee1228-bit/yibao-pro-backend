import { Controller, Get, Post, Put, Delete, Body, Query, Param, Headers } from '@nestjs/common'
import { QuotesService } from './quotes.service'

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  /**
   * 获取报价单列表
   * GET /api/quotes
   */
  @Get()
  async getAll(
    @Headers('x-openid') userId: string,
    @Query('status') status?: string,
    @Query('customer_id') customerId?: string,
  ) {
    const data = await this.quotesService.getAll(userId, { status, customer_id: customerId })
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 获取统计数据
   * GET /api/quotes/stats
   */
  @Get('stats')
  async getStats(@Headers('x-openid') userId: string) {
    const data = await this.quotesService.getStats(userId)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 获取报价单详情
   * GET /api/quotes/:id
   */
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Headers('x-openid') userId: string,
  ) {
    const data = await this.quotesService.getById(id, userId)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 创建报价单
   * POST /api/quotes
   */
  @Post()
  async create(
    @Headers('x-openid') userId: string,
    @Body() body: {
      customer_id: string
      items: Array<{
        product_id?: string
        product_name: string
        unit: string
        quantity: number
        unit_price: number
        discount?: number
        amount: number
        remark?: string
      }>
      discount?: number
      remark?: string
      valid_days?: number
      // 报价方信息
      company_name?: string
      contact_person?: string
      contact_phone?: string
      contact_address?: string
      contact_email?: string
    },
  ) {
    if (!userId) {
      return {
        code: 401,
        msg: '未授权：缺少用户身份信息',
      }
    }
    const data = await this.quotesService.create(userId, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 更新报价单
   * PUT /api/quotes/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      customer_id: string
      items: Array<{
        product_id?: string
        product_name: string
        unit: string
        quantity: number
        unit_price: number
        discount?: number
        amount: number
        remark?: string
      }>
      discount: number
      remark: string
      valid_days: number
      // 报价方信息
      company_name?: string
      contact_person?: string
      contact_phone?: string
      contact_address?: string
      contact_email?: string
    }>,
  ) {
    const data = await this.quotesService.update(id, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 更新报价单状态
   * PUT /api/quotes/:id/status
   */
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const data = await this.quotesService.updateStatus(id, status)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 删除报价单
   * DELETE /api/quotes/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.quotesService.delete(id)
    return {
      code: 0,
      msg: 'success',
      data: { success: true },
    }
  }
}
