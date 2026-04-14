import { Controller, Get, Put, Post, Body, Headers } from '@nestjs/common'
import { MerchantsService } from './merchants.service'

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get('info')
  async getInfo(@Headers('x-openid') userId: string) {
    const data = await this.merchantsService.get(userId)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Put('info')
  async updateInfo(
    @Headers('x-openid') userId: string,
    @Body() body: {
      company_name: string
      contact_person: string
      contact_phone: string
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
    const data = await this.merchantsService.upsert(userId, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }

  @Post('update')
  async updateMerchant(
    @Headers('x-openid') userId: string,
    @Body() body: {
      company_name: string
      contact_person: string
      contact_phone: string
      contact_address?: string
      contact_email?: string
    },
  ) {
    // 暂时允许不传 userId（用于测试）
    // if (!userId) {
    //   return {
    //     code: 401,
    //     msg: '未授权：缺少用户身份信息',
    //   }
    // }
    const data = await this.merchantsService.upsert(userId, body)
    return {
      code: 0,
      msg: 'success',
      data,
    }
  }
}
