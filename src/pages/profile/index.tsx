import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import {
  Settings,
  FileText,
  Users,
  Calculator,
  CircleAlert,
  Info,
  ChevronRight,
} from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import './index.css'

const ProfilePage: FC = () => {
  useDidShow(() => {
    // 可以在这里加载一些数据
  })

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
            <Text className="block text-xl font-bold text-white">易报价Pro</Text>
            <Text className="block text-sm text-blue-100 mt-1">专业报价工具</Text>
          </View>
        </View>
      </View>

      {/* 使用提示 */}
      <View className="px-4 -mt-4">
        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Text className="text-lg">📦</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-900">免费版</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    商品上限 20 个 · 客户上限 10 个
                  </Text>
                </View>
              </View>
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
