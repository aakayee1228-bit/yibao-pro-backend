import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import * as crypto from 'crypto'

@Injectable()
export class PaymentService {
  private readonly appId: string
  private readonly mchId: string
  private readonly apiKey: string
  private readonly notifyUrl: string

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('WX_APP_ID') || ''
    this.mchId = this.configService.get<string>('WX_MCH_ID') || ''
    this.apiKey = this.configService.get<string>('WX_API_KEY') || ''
    this.notifyUrl = this.configService.get<string>('WX_NOTIFY_URL') || ''
  }

  /**
   * 创建支付订单
   */
  async createPayment(userId: string, tierId: string) {
    const client = getSupabaseClient()

    // 获取会员等级信息
    const { data: tier, error: tierError } = await client
      .from('membership_tiers')
      .select('*')
      .eq('id', tierId)
      .single()

    if (tierError || !tier) {
      throw new NotFoundException('会员等级不存在')
    }

    // 免费版不需要支付
    if (tier.name === 'free' || parseFloat(tier.price) === 0) {
      throw new BadRequestException('免费版本无需支付')
    }

    // 生成商户订单号
    const outTradeNo = `QT${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // 创建支付记录
    const { data: paymentRecord, error: paymentError } = await client
      .from('payment_records')
      .insert({
        user_id: userId,
        tier_id: tierId,
        out_trade_no: outTradeNo,
        amount: tier.price,
        status: 'pending',
        payment_method: 'wechat',
      })
      .select()
      .single()

    if (paymentError) {
      console.error('创建支付记录失败:', paymentError)
      throw new BadRequestException('创建支付记录失败')
    }

    // 调用微信支付统一下单接口
    const paymentData = await this.callWechatPay({
      outTradeNo,
      amount: parseFloat(tier.price),
      description: `智能报价助手-${tier.display_name}`,
      userId,
    })

    return paymentData
  }

  /**
   * 调用微信支付统一下单接口
   */
  private async callWechatPay(params: {
    outTradeNo: string
    amount: number
    description: string
    userId: string
  }) {
    // 注意：这是简化版本的支付实现
    // 实际生产环境需要使用微信支付 SDK 并处理证书

    const { outTradeNo, amount, description, userId } = params

    // 模拟支付参数（实际应调用微信支付API）
    // 实际实现需要：
    // 1. 引入微信支付 SDK (wechatpay-node-v3)
    // 2. 加载商户证书
    // 3. 调用 JSAPI下单 接口
    // 4. 返回前端支付参数

    console.log('创建微信支付订单:', {
      appId: this.appId,
      mchId: this.mchId,
      outTradeNo,
      amount: Math.round(amount * 100), // 单位：分
      description,
      notifyUrl: this.notifyUrl,
      openid: userId, // 实际应为用户的 openid
    })

    // 模拟返回支付参数
    // 实际应从微信支付API返回
    const timeStamp = Math.floor(Date.now() / 1000).toString()
    const nonceStr = crypto.randomBytes(16).toString('hex')
    const packageStr = `prepay_id=wx${Date.now()}`

    // 生成签名（实际应使用商户证书签名）
    const paySign = crypto
      .createHmac('sha256', this.apiKey)
      .update(`${this.appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`)
      .digest('hex')

    return {
      timeStamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign,
      outTradeNo,
    }
  }

  /**
   * 处理微信支付回调
   */
  async handlePaymentNotify(body: any) {
    const client = getSupabaseClient()

    console.log('收到支付回调:', body)

    // 验证签名（实际应验证微信支付签名）
    // const verified = this.verifySignature(body)

    // 解析回调数据
    const outTradeNo = body.out_trade_no
    const transactionId = body.transaction_id

    if (!outTradeNo) {
      throw new BadRequestException('缺少订单号')
    }

    // 查询支付记录
    const { data: paymentRecord, error: paymentError } = await client
      .from('payment_records')
      .select('*')
      .eq('out_trade_no', outTradeNo)
      .single()

    if (paymentError || !paymentRecord) {
      throw new NotFoundException('支付记录不存在')
    }

    // 更新支付状态
    const now = new Date().toISOString()
    const { error: updateError } = await client
      .from('payment_records')
      .update({
        status: 'success',
        transaction_id: transactionId,
        paid_at: now,
        updated_at: now,
      })
      .eq('id', paymentRecord.id)

    if (updateError) {
      console.error('更新支付状态失败:', updateError)
      throw new BadRequestException('更新支付状态失败')
    }

    // 创建用户订阅
    const { MembershipService } = await import('../membership/membership.service')
    const membershipService = new MembershipService()
    await membershipService.createSubscription(
      paymentRecord.user_id,
      paymentRecord.tier_id,
      paymentRecord.id
    )

    return { success: true }
  }

  /**
   * 验证微信支付签名
   */
  private verifySignature(body: any): boolean {
    // 实际应验证微信支付签名
    // 使用微信支付平台证书验证签名
    return true
  }

  /**
   * 查询支付订单状态
   */
  async queryPaymentStatus(outTradeNo: string) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('payment_records')
      .select('*')
      .eq('out_trade_no', outTradeNo)
      .single()

    if (error) {
      throw new NotFoundException('订单不存在')
    }

    return {
      outTradeNo: data.out_trade_no,
      status: data.status,
      amount: data.amount,
      paidAt: data.paid_at,
    }
  }
}
