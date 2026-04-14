import { Controller, Get, Post, Put, Delete, Body, Param, Headers, Query } from '@nestjs/common'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll(
    @Headers('x-openid') userId: string,
    @Query('category') category?: string,
  ) {
    const data = await this.productsService.getAll(userId, { category })
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Post()
  async create(
    @Headers('x-openid') userId: string,
    @Body() body: { name: string; unit: string; price: number; category?: string },
  ) {
    if (!userId) {
      return {
        code: 401,
        msg: '未授权：缺少用户身份信息',
      }
    }
    const data = await this.productsService.create(userId, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; unit: string; price: number; category?: string }>,
  ) {
    const data = await this.productsService.update(id, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.productsService.delete(id)
    return {
      code: 0,
      msg: 'success',
      data: { success: true },
    }
  }
}
