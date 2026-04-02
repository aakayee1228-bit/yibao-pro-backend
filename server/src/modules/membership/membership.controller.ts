import { Controller, Get, Headers } from '@nestjs/common'
import { MembershipService } from './membership.service'

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

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
}
