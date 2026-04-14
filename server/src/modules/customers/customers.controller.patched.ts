import { Controller, Get, Post, Put, Delete, Body, Param, Headers } from '@nestjs/common'
import { CustomersService } from './customers.service'

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getAll(@Headers('x-openid') userId: string) {
    const data = await this.customersService.getAll(userId)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Post()
  async create(
    @Headers('x-openid') userId: string,
    @Body() body: { name: string; phone: string; address?: string; company?: string },
  ) {
    if (!userId) {
      return {
        code: 401,
        msg: '未授权：缺少用户身份信息',
      }
    }
    const data = await this.customersService.create(userId, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; phone: string; address?: string; company?: string }>,
  ) {
    const data = await this.customersService.update(id, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

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
