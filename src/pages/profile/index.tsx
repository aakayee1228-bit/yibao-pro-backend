import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import {
  Crown,
  Settings,
  FileText,
  Users,
  Calculator,
  CircleAlert,
  Info,
  ChevronRight,
} from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
import './index.css'

interface UserSubscription {
  id: string
  tier_id: string
  status: string
  expire_at: string | null
}

interface MembershipTier {
  id: string
  name: string
  display_name: string
}

const ProfilePage: FC = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [currentTier, setCurrentTier] = useState<MembershipTier | null>(null)

  useDidShow(() => {
    fetchSubscription()
  })

  const fetchSubscription = async () => {
    try {
      const res = await Network.request({
        url: '/api/membership/subscription',
        method: 'GET',
      })

      console.log('获取订阅信息:', res.data)
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: UserSubscription }
        const subData = responseData.data || null
        setSubscription(subData)

        // 如果有订阅，获取等级信息
        if (subData?.tier_id) {
          const tiersRes = await Network.request({
            url: '/api/membership/tiers',
            method: 'GET',
          })
          if (tiersRes.statusCode === 200 && tiersRes.data) {
            const tiersData = tiersRes.data as { data?: MembershipTier[] }
            const tier = tiersData.data?.find((t) => t.id === subData.tier_id)
            setCurrentTier(tier || null)
          }
        }
      }
    } catch (err) {
      console.error('获取订阅信息异常:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const menuItems = [
    {
      title: '客户管理',
      icon: Users,
      color: '#3b82f6',
      onClick: () => Taro.navigateTo({ url: '/pages/customers/index' }),
    },
    {
      title: '商家设置',
      icon: Settings,
      color: '#6b7280',
      onClick: () => Taro.navigateTo({ url: '/pages/merchant/settings' }),
    },
    {
      title: '报价单模板',
      icon: FileText,
      color: '#8b5cf6',
      onClick: () => Taro.navigateTo({ url: '/pages/templates/index' }),
    },
    {
      title: '单位换算',
      icon: Calculator,
      color: '#10b981',
      onClick: () => Taro.navigateTo({ url: '/pages/unit-converter/index' }),
    },
  ]

  const otherItems = [
    {
      title: '帮助文档',
      icon: CircleAlert,
      onClick: () => Taro.navigateTo({ url: '/pages/help/index' }),
    },
    {
      title: '关于我们',
      icon: Info,
      onClick: () => Taro.navigateTo({ url: '/pages/about/index' }),
    },
  ]

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部用户信息 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-12 pb-8">
        <View className="flex items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <Text className="text-2xl text-white">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="block text-xl font-bold text-white">智能报价助手</Text>
            <Text className="block text-sm text-blue-100 mt-1">专业报价工具</Text>
          </View>
        </View>
      </View>

      {/* 会员卡片 */}
      <View className="px-4 -mt-4">
        <Card
          className="cursor-pointer"
          onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}
        >
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Crown size={20} color="#f59e0b" />
                </View>
                <View>
                  {subscription && subscription.status === 'active' ? (
                    <>
                      <View className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-gray-900">会员状态</Text>
                        <Badge className="bg-amber-500 text-white">
                          {currentTier?.display_name || '会员'}
                        </Badge>
                      </View>
                      {subscription.expire_at && (
                        <Text className="text-xs text-gray-500 mt-1">
                          有效期至 {formatDate(subscription.expire_at)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text className="text-sm font-medium text-gray-900">免费版</Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        商品上限 50 个 · 点击查看会员权益
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能列表 */}
      <View className="px-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">功能中心</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex flex-col">
              {menuItems.map((item, index) => (
                <View key={index}>
                  <View
                    className="flex items-center justify-between py-3 cursor-pointer"
                    onClick={item.onClick}
                  >
                    <View className="flex items-center gap-3">
                      <item.icon size={20} color={item.color} />
                      <Text className="text-sm text-gray-700">{item.title}</Text>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                  </View>
                  {index < menuItems.length - 1 && <Separator />}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 其他功能 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="p-0">
            <View className="flex flex-col">
              {otherItems.map((item, index) => (
                <View key={index}>
                  <View
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={item.onClick}
                  >
                    <View className="flex items-center gap-3">
                      <item.icon size={18} color="#6b7280" />
                      <Text className="text-sm text-gray-700">{item.title}</Text>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                  </View>
                  {index < otherItems.length - 1 && <Separator />}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部版本信息 */}
      <View className="flex-1 flex items-end justify-center pb-8">
        <Text className="text-xs text-gray-400">版本 1.0.0</Text>
      </View>
    </View>
  )
}

export default ProfilePage
