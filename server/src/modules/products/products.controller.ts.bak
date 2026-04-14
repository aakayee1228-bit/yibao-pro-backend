import { Controller, Get, Post, Put, Delete, Body, Param, Headers, BadRequestException, HttpStatus } from '@nestjs/common'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * 获取商品列表
   * GET /api/products
   */
  @Get()
  async getAll(@Headers('x-user-id') userId: string) {
    const testUserId = userId || 'test-user-001'
    const products = await this.productsService.getAll(testUserId)
    return { code: 0, msg: 'success', data: products }
  }

  /**
   * 获取单个商品
   * GET /api/products/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const product = await this.productsService.getById(id)
    return { code: 0, msg: 'success', data: product }
  }

  /**
   * 创建商品
   * POST /api/products
   */
  @Post()
  async create(
    @Body()
    body: {
      industry_id: string
      name: string
      code?: string
      unit: string
      specification?: string
      cost_price?: string
      retail_price: string
      wholesale_price?: string
    },
    @Headers('x-user-id') userId: string
  ) {
    const testUserId = userId || 'test-user-001'

    // 参数校验
    if (!body.name?.trim()) {
      throw new BadRequestException('商品名称不能为空')
    }
    if (!body.retail_price) {
      throw new BadRequestException('零售价不能为空')
    }

    // 如果没有行业ID，使用默认行业
    let industryId = body.industry_id
    if (!industryId) {
      industryId = 'industry-engineering' // 默认工程建材
    }

    const product = await this.productsService.create(testUserId, {
      industry_id: industryId,
      name: body.name.trim(),
      code: body.code?.trim() || undefined,
      unit: body.unit?.trim() || '个',
      specification: body.specification?.trim() || undefined,
      cost_price: body.cost_price || undefined,
      retail_price: body.retail_price,
      wholesale_price: body.wholesale_price || undefined,
    })

    return { code: 0, msg: 'success', data: product }
  }

  /**
   * 更新商品
   * PUT /api/products/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      industry_id: string
      name: string
      code: string
      unit: string
      specification: string
      cost_price: string
      retail_price: string
      wholesale_price: string
    }>
  ) {
    // 参数校验
    if (body.name !== undefined && !body.name.trim()) {
      throw new BadRequestException('商品名称不能为空')
    }
    if (body.retail_price !== undefined && !body.retail_price) {
      throw new BadRequestException('零售价不能为空')
    }

    const product = await this.productsService.update(id, {
      ...body,
      name: body.name?.trim(),
      code: body.code?.trim(),
      unit: body.unit?.trim(),
      specification: body.specification?.trim(),
    })

    return { code: 0, msg: 'success', data: product }
  }

  /**
   * 删除商品
   * DELETE /api/products/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.productsService.delete(id)
    return { code: 0, msg: 'success', data: result }
  }
}
