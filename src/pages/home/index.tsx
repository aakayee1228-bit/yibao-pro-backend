import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Plus, Package, Users, FileText, TrendingUp, DollarSign } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import './index.css'

interface Quote {
  id: string
  quote_no: string
  customer_id: string
  status: string
  total_amount: string
  created_at: string
}

interface Stats {
  total_quotes: number
  total_amount: number
  month_quotes: number
  month_amount: number
}

const HomePage: FC = () => {
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<Stats>({
    total_quotes: 0,
    total_amount: 0,
    month_quotes: 0,
    month_amount: 0,
  })

  useDidShow(() => {
    fetchRecentQuotes()
    fetchStats()
  })

  const fetchRecentQuotes = async () => {
    try {
      const res = await Network.request({
        url: '/api/quotes',
        method: 'GET',
        data: { limit: 5 },
      })

      console.log('获取最近报价:', res.data)
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Quote[]; msg?: string }
        setRecentQuotes(responseData.data || [])
      }
    } catch (err) {
      console.error('获取最近报价异常:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await Network.request({
        url: '/api/quotes/stats',
        method: 'GET',
      })

      console.log('获取统计数据:', res.data)
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Stats; msg?: string }
        setStats(responseData.data || stats)
      }
    } catch (err) {
      console.error('获取统计数据异常:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: '草稿', variant: 'secondary' },
      sent: { label: '已发送', variant: 'default' },
      accepted: { label: '已成交', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
    }
    return statusMap[status] || { label: status, variant: 'secondary' }
  }

  const quickActions = [
    {
      title: '新建清单',
      icon: Plus,
      color: 'bg-blue-500',
      onClick: () => Taro.navigateTo({ url: '/pages/quotes/create/index' }),
    },
    {
      title: '商品库',
      icon: Package,
      color: 'bg-emerald-500',
      onClick: () => Taro.switchTab({ url: '/pages/products/index' }),
    },
    {
      title: '客户管理',
      icon: Users,
      color: 'bg-amber-500',
      onClick: () => Taro.navigateTo({ url: '/pages/customers/index' }),
    },
    {
      title: '历史清单',
      icon: FileText,
      color: 'bg-purple-500',
      onClick: () => Taro.switchTab({ url: '/pages/quotes/index' }),
    },
  ]

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部区域 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-12 pb-8">
        <Text className="block text-2xl font-bold text-white">易清单</Text>
        <Text className="block text-sm text-blue-100 mt-1">快速生成商品清单</Text>
      </View>

      {/* 快捷入口 */}
      <View className="px-4 -mt-4">
        <Card>
          <CardContent className="p-4">
            <View className="flex flex-row justify-around">
              {quickActions.map((action, index) => (
                <View
                  key={index}
                  className="flex flex-col items-center gap-2"
                  onClick={action.onClick}
                >
                  <View className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <action.icon size={24} color="#ffffff" />
                  </View>
                  <Text className="text-xs text-gray-700">{action.title}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 数据概览 */}
      <View className="px-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">本月数据</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <View className="flex flex-row gap-4">
              <View className="flex-1 bg-blue-50 rounded-lg p-3">
                <View className="flex items-center gap-2">
                  <TrendingUp size={16} color="#2563eb" />
                  <Text className="text-xs text-gray-500">清单数</Text>
                </View>
                <Text className="block text-2xl font-bold text-blue-600 mt-1">
                  {stats.month_quotes}
                </Text>
              </View>
              <View className="flex-1 bg-emerald-50 rounded-lg p-3">
                <View className="flex items-center gap-2">
                  <DollarSign size={16} color="#10b981" />
                  <Text className="text-xs text-gray-500">成交金额</Text>
                </View>
                <Text className="block text-2xl font-bold text-emerald-600 mt-1">
                  ¥{stats.month_amount.toLocaleString()}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 最近报价 */}
      <View className="px-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">最近清单</CardTitle>
              <Text
                className="text-xs text-blue-600"
                onClick={() => Taro.switchTab({ url: '/pages/quotes/index' })}
              >
                查看全部
              </Text>
            </View>
          </CardHeader>
          <CardContent className="pt-2">
            {recentQuotes.length === 0 ? (
              <View className="py-8 text-center">
                <Text className="text-sm text-gray-400">暂无清单</Text>
                <Text className="text-xs text-gray-400 mt-1">点击「新建清单」开始创建</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                {recentQuotes.map((quote) => {
                  const statusInfo = getStatusBadge(quote.status)
                  return (
                    <View
                      key={quote.id}
                      className="flex flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      onClick={() =>
                        Taro.navigateTo({
                          url: `/pages/quotes/preview/index?id=${quote.id}`,
                        })
                      }
                    >
                      <View className="flex flex-col gap-1">
                        <Text className="text-sm font-medium text-gray-900">
                          {quote.quote_no}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex flex-col items-end gap-1">
                        <Text className="text-sm font-bold text-gray-900">
                          ¥{parseFloat(quote.total_amount).toLocaleString()}
                        </Text>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default HomePage
