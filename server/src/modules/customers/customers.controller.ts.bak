import { Controller, Get, Post, Put, Delete, Body, Query, Param, Headers } from '@nestjs/common'
import { CustomersService } from './customers.service'

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * 获取客户列表
   * GET /api/customers
   */
  @Get()
  async getAll(
    @Headers('x-user-id') userId: string,
    @Query('search') search?: string,
  ) {
    const data = await this.customersService.getAll(userId, search)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 获取单个客户
   * GET /api/customers/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.customersService.getById(id)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 创建客户
   * POST /api/customers
   */
  @Post()
  async create(
    @Headers('x-user-id') userId: string,
    @Body() body: {
      name: string
      phone?: string
      address?: string
      company?: string
      remark?: string
      tags?: string[]
    },
  ) {
    const data = await this.customersService.create(userId || 'default-user', body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 更新客户
   * PUT /api/customers/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string
      phone: string
      address: string
      company: string
      remark: string
      tags: string[]
    }>,
  ) {
    const data = await this.customersService.update(id, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  /**
   * 删除客户
   * DELETE /api/customers/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.customersService.delete(id)
    return {
      code: 0,
      msg: 'success',
      data: { success: true },
    }
  }
}
