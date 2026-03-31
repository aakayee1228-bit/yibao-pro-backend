import { Controller, Get, Post, Body, Headers, BadRequestException } from '@nestjs/common'
import { MembershipService } from './membership.service'
import { PaymentService } from '../payment/payment.service'

@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly paymentService: PaymentService
  ) {}

  /**
   * 获取所有会员等级
   * GET /api/membership/tiers
   */
  @Get('tiers')
  async getTiers() {
    const tiers = await this.membershipService.getTiers()
    return tiers
  }

  /**
   * 获取用户订阅状态
   * GET /api/membership/subscription
   */
  @Get('subscription')
  async getSubscription(@Headers('x-user-id') userId: string) {
    // 临时使用测试用户ID（实际应从JWT中获取）
    const testUserId = userId || 'test-user-001'
    const subscription = await this.membershipService.getUserSubscription(testUserId)
    return subscription
  }

  /**
   * 获取用户权限配置
   * GET /api/membership/limits
   */
  @Get('limits')
  async getLimits(@Headers('x-user-id') userId: string) {
    const testUserId = userId || 'test-user-001'
    const limits = await this.membershipService.getUserLimits(testUserId)
    return limits
  }

  /**
   * 获取报价单模板
   * GET /api/membership/templates
   */
  @Get('templates')
  async getTemplates(@Headers('x-user-id') userId: string) {
    const testUserId = userId || 'test-user-001'
    const templates = await this.membershipService.getTemplates(testUserId)
    return templates
  }

  /**
   * 创建支付订单
   * POST /api/payment/create
   */
  @Post('payment/create')
  async createPayment(
    @Body() body: { tier_id: string },
    @Headers('x-user-id') userId: string
  ) {
    const testUserId = userId || 'test-user-001'

    if (!body.tier_id) {
      throw new BadRequestException('请选择会员等级')
    }

    const paymentData = await this.paymentService.createPayment(testUserId, body.tier_id)
    return paymentData
  }

  /**
   * 微信支付回调
   * POST /api/payment/notify
   */
  @Post('payment/notify')
  async handlePaymentNotify(@Body() body: any) {
    const result = await this.paymentService.handlePaymentNotify(body)
    return result
  }
}
