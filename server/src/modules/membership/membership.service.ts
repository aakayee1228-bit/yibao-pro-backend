import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class MembershipService {
  /**
   * 获取所有会员等级
   */
  async getTiers() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('membership_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取会员等级失败:', error)
      throw new BadRequestException('获取会员等级失败')
    }

    return data
  }

  /**
   * 获取单个会员等级
   */
  async getTier(tierId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('membership_tiers')
      .select('*')
      .eq('id', tierId)
      .single()

    if (error) {
      console.error('获取会员等级失败:', error)
      throw new NotFoundException('会员等级不存在')
    }

    return data
  }

  /**
   * 获取用户订阅状态
   */
  async getUserSubscription(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('获取订阅信息失败:', error)
      throw new BadRequestException('获取订阅信息失败')
    }

    // 如果有过期订阅，更新状态
    if (data && data.expire_at && new Date(data.expire_at) < new Date()) {
      await client.from('user_subscriptions').update({ status: 'expired' }).eq('id', data.id)
      return null
    }

    return data
  }

  /**
   * 检查用户是否为付费会员
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) return false

    const tier = await this.getTier(subscription.tier_id)
    return tier.name !== 'free'
  }

  /**
   * 获取用户权限配置
   */
  async getUserLimits(userId: string) {
    const subscription = await this.getUserSubscription(userId)

    // 默认免费用户权限
    const defaultLimits = {
      max_products: 50,
      max_customers: 20,
      max_quotes: -1,
      max_templates: 3,
      has_advanced_templates: false,
      has_ad: true,
      has_export_pdf: false,
      has_data_statistics: false,
    }

    if (!subscription) {
      return defaultLimits
    }

    const tier = await this.getTier(subscription.tier_id)
    return tier.limits || defaultLimits
  }

  /**
   * 创建用户订阅
   */
  async createSubscription(
    userId: string,
    tierId: string,
    paymentRecordId?: string
  ) {
    const client = getSupabaseClient()
    const tier = await this.getTier(tierId)

    // 计算过期时间
    const now = new Date()
    let expireAt: Date | null = null
    if (tier.duration_days) {
      expireAt = new Date(now.getTime() + tier.duration_days * 24 * 60 * 60 * 1000)
    }

    // 检查是否已有订阅
    const existingSubscription = await this.getUserSubscription(userId)

    if (existingSubscription) {
      // 续费：延长订阅时间
      const existingExpireAt = existingSubscription.expire_at
        ? new Date(existingSubscription.expire_at)
        : now
      const baseTime = existingExpireAt > now ? existingExpireAt : now

      if (tier.duration_days) {
        expireAt = new Date(baseTime.getTime() + tier.duration_days * 24 * 60 * 60 * 1000)
      }

      // 更新订阅
      const { data, error } = await client
        .from('user_subscriptions')
        .update({
          tier_id: tierId,
          status: 'active',
          expire_at: expireAt?.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existingSubscription.id)
        .select()
        .single()

      if (error) {
        console.error('更新订阅失败:', error)
        throw new BadRequestException('更新订阅失败')
      }

      return data
    } else {
      // 新建订阅
      const { data, error } = await client
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier_id: tierId,
          status: 'active',
          start_at: now.toISOString(),
          expire_at: expireAt?.toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('创建订阅失败:', error)
        throw new BadRequestException('创建订阅失败')
      }

      return data
    }
  }

  /**
   * 获取报价单模板
   */
  async getTemplates(userId?: string) {
    const client = getSupabaseClient()

    // 获取所有模板
    const { data, error } = await client
      .from('quote_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取模板失败:', error)
      throw new BadRequestException('获取模板失败')
    }

    // 如果提供了用户ID，检查是否可以使用高级模板
    let canUsePremium = false
    if (userId) {
      const limits = await this.getUserLimits(userId)
      canUsePremium = limits.has_advanced_templates
    }

    // 标记模板是否可用
    return data.map((template) => ({
      ...template,
      can_use: !template.is_premium || canUsePremium,
    }))
  }
}
