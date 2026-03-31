import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Check, Crown, Sparkles } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
import './index.css'

interface MembershipTier {
  id: string
  name: string
  display_name: string
  price: string
  original_price: string | null
  duration_days: number | null
  description: string
  features: string[]
  limits: {
    max_products: number
    max_customers: number
    has_advanced_templates: boolean
    has_ad: boolean
    has_export_pdf: boolean
    has_data_statistics: boolean
  }
}

interface UserSubscription {
  id: string
  tier_id: string
  status: string
  expire_at: string | null
}

const MembershipPage: FC = () => {
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    fetchTiers()
    fetchCurrentSubscription()
  })

  const fetchTiers = async () => {
    try {
      const res = await Network.request({
        url: '/api/membership/tiers',
        method: 'GET',
      })

      console.log('获取会员等级:', res.data)
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: MembershipTier[] }
        setTiers(responseData.data || [])
      }
    } catch (err) {
      console.error('获取会员等级异常:', err)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const res = await Network.request({
        url: '/api/membership/subscription',
        method: 'GET',
      })

      console.log('获取订阅信息:', res.data)
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: UserSubscription }
        setCurrentSubscription(responseData.data || null)
      }
    } catch (err) {
      console.error('获取订阅信息异常:', err)
    }
  }

  const handleUpgrade = async (tierId: string) => {
    const tier = tiers.find((t) => t.id === tierId)
    if (!tier) return

    // 免费版不需要支付
    if (tier.name === 'free') {
      Taro.showToast({ title: '当前已是免费版', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      // 创建支付订单
      const res = await Network.request({
        url: '/api/payment/create',
        method: 'POST',
        data: { tier_id: tierId },
      })

      console.log('支付订单:', res.data)

      // 调起微信支付
      const paymentData = res.data as {
        timeStamp?: string
        nonceStr?: string
        package?: string
        signType?: string
        paySign?: string
      }
      if (paymentData && paymentData.timeStamp) {
        await Taro.requestPayment({
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr || '',
          package: paymentData.package || '',
          signType: (paymentData.signType as 'MD5' | 'RSA') || 'RSA',
          paySign: paymentData.paySign || '',
        })

        Taro.showToast({ title: '支付成功', icon: 'success' })
        // 刷新订阅状态
        setTimeout(() => {
          fetchCurrentSubscription()
        }, 1000)
      }
    } catch (err: any) {
      console.error('支付失败:', err)
      if (err.errMsg?.includes('cancel')) {
        Taro.showToast({ title: '已取消支付', icon: 'none' })
      } else {
        Taro.showToast({ title: '支付失败', icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  const getTierStyle = (tierName: string) => {
    const styles: Record<string, { border: string; bg: string; badge: string }> = {
      free: { border: 'border-gray-200', bg: 'bg-white', badge: 'bg-gray-100 text-gray-700' },
      monthly: { border: 'border-2 border-blue-500', bg: 'bg-white', badge: 'bg-blue-500 text-white' },
      yearly: {
        border: 'border-2 border-amber-500',
        bg: 'bg-gradient-to-br from-amber-50 to-white',
        badge: 'bg-amber-500 text-white',
      },
    }
    return styles[tierName] || styles.free
  }

  const isCurrentTier = (tierId: string) => {
    return currentSubscription?.tier_id === tierId && currentSubscription?.status === 'active'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部区域 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-12 pb-8">
        <Text className="block text-2xl font-bold text-white">会员中心</Text>
        <Text className="block text-sm text-blue-100 mt-1">解锁全部功能，提升报价效率</Text>
      </View>

      {/* 当前会员状态 */}
      {currentSubscription && currentSubscription.status === 'active' && (
        <View className="px-4 -mt-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <Crown size={20} color="#f59e0b" />
                  <Text className="text-sm font-medium text-gray-900">当前会员</Text>
                </View>
                {currentSubscription.expire_at && (
                  <Text className="text-xs text-gray-500">
                    有效期至 {formatDate(currentSubscription.expire_at)}
                  </Text>
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 会员等级卡片 */}
      <View className="px-4">
        <View className="flex flex-row gap-3 overflow-x-auto pb-4">
          {tiers.map((tier) => {
            const style = getTierStyle(tier.name)
            const isCurrent = isCurrentTier(tier.id)

            return (
              <View
                key={tier.id}
                className={`flex-shrink-0 w-36 ${style.border} ${style.bg} rounded-xl p-4 relative`}
              >
                {/* 标签 */}
                {tier.name === 'monthly' && (
                  <View className="absolute -top-2 left-3 bg-blue-500 px-2 py-1 rounded">
                    <Text className="text-xs text-white">推荐</Text>
                  </View>
                )}
                {tier.name === 'yearly' && (
                  <View className="absolute -top-2 left-3 bg-amber-500 px-2 py-1 rounded">
                    <Text className="text-xs text-white">省¥159</Text>
                  </View>
                )}

                {/* 等级名称 */}
                <Badge className={`${style.badge} mb-2`}>{tier.display_name}</Badge>

                {/* 价格 */}
                <View className="mt-2">
                  <View className="flex items-baseline gap-1">
                    <Text className="text-2xl font-bold text-gray-900">¥{tier.price}</Text>
                    {tier.duration_days && (
                      <Text className="text-xs text-gray-500">
                        /{tier.duration_days === 30 ? '月' : '年'}
                      </Text>
                    )}
                  </View>
                  {tier.original_price && (
                    <Text className="text-xs text-gray-400 line-through">
                      ¥{tier.original_price}
                    </Text>
                  )}
                </View>

                {/* 描述 */}
                <Text className="block text-xs text-gray-500 mt-2 line-clamp-2">
                  {tier.description}
                </Text>

                {/* 升级按钮 */}
                <Button
                  size="sm"
                  className="w-full mt-3"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || loading}
                  onClick={() => handleUpgrade(tier.id)}
                >
                  {isCurrent ? '当前等级' : '立即升级'}
                </Button>
              </View>
            )
          })}
        </View>
      </View>

      {/* 功能对比 */}
      <View className="px-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">功能对比</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex flex-col gap-3">
              {/* 功能对比行 */}
              {[
                { label: '商品数量', free: '50个', monthly: '无限', yearly: '无限' },
                { label: '客户数量', free: '20个', monthly: '无限', yearly: '无限' },
                { label: '报价模板', free: '3个基础', monthly: '全部', yearly: '全部' },
                { label: '导出PDF', free: '❌', monthly: '✅', yearly: '✅' },
                { label: '数据统计', free: '❌', monthly: '✅', yearly: '✅' },
                { label: '广告展示', free: '有', monthly: '无', yearly: '无' },
                { label: '专属客服', free: '❌', monthly: '❌', yearly: '✅' },
              ].map((item, index) => (
                <View key={index}>
                  <View className="flex flex-row items-center">
                    <View className="w-20">
                      <Text className="text-sm text-gray-700">{item.label}</Text>
                    </View>
                    <View className="flex-1 grid grid-cols-3 gap-2">
                      <Text className="text-xs text-gray-500 text-center">{item.free}</Text>
                      <Text className="text-xs text-blue-600 text-center">{item.monthly}</Text>
                      <Text className="text-xs text-amber-600 text-center">{item.yearly}</Text>
                    </View>
                  </View>
                  {index < 6 && <Separator className="my-2" />}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 会员权益说明 */}
      <View className="px-4 mt-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles size={16} color="#f59e0b" />
              会员权益
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex flex-col gap-2">
              {[
                '无限商品数量，不再受限制',
                '高级报价模板，提升专业形象',
                '导出PDF功能，方便发送客户',
                '数据统计分析，掌握经营状况',
                '去除广告干扰，专注工作',
              ].map((feature, index) => (
                <View key={index} className="flex items-center gap-2">
                  <Check size={14} color="#10b981" />
                  <Text className="text-sm text-gray-700">{feature}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default MembershipPage
