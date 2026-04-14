import { Controller, Get, Post, Body } from '@nestjs/common'
import { MerchantsService } from './merchants.service'

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  /**
   * 获取商家信息
   * GET /api/merchants/info
   */
  @Get('info')
  async getInfo() {
    const info = await this.merchantsService.getMerchantInfo()
    return {
      code: 200,
      msg: 'success',
      data: info,
    }
  }

  /**
   * 更新商家信息
   * POST /api/merchants/update
   */
  @Post('update')
  async update(@Body() body: {
    shopName?: string
    contactName?: string
    phone?: string
    address?: string
    logo?: string
    stamp?: string
  }) {
    const info = await this.merchantsService.upsertMerchantInfo(body)
    return {
      code: 200,
      msg: '更新成功',
      data: info,
    }
  }

  /**
   * 更新商家名称
   * POST /api/merchants/shop-name
   */
  @Post('shop-name')
  async updateShopName(@Body('shopName') shopName: string) {
    if (!shopName || shopName.trim().length === 0) {
      return {
        code: 400,
        msg: '商家名称不能为空',
        data: null,
      }
    }

    const info = await this.merchantsService.updateShopName(shopName.trim())
    return {
      code: 200,
      msg: '更新成功',
      data: info,
    }
  }
}
