import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import {
  Building2,
  FileText,
  Users,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'

interface MerchantInfo {
  id: string
  shop_name: string
  contact_name: string
  phone: string
  address: string
}

const ProfilePage: FC = () => {
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null)

  useEffect(() => {
    console.log('[Profile] useEffect 触发')
    loadMerchantInfo()
  }, [])

  const loadMerchantInfo = async () => {
    console.log('[Profile] loadMerchantInfo 开始执行')
    try {
      const res = await Network.request({
        url: '/api/merchants/info',
        method: 'GET',
      })
      console.log('[商家信息] 响应:', res.data)
      console.log('[商家信息] 响应数据详情:', res.data?.data)

      if (res.data?.code === 0 && res.data?.data) {
        console.log('[商家信息] 设置商家信息:', res.data.data)
        setMerchantInfo(res.data.data)
      } else {
        console.error('[商家信息] 响应异常:', res.data)
      }
    } catch (error) {
      console.error('[商家信息] 加载失败:', error)
    }
  }

  // 将 loadMerchantInfo 挂载到页面实例，以便从其他页面调用
  const instance = Taro.getCurrentInstance()
  if (instance.page) {
    (instance.page as any).loadMerchantInfo = loadMerchantInfo
    console.log('[Profile] loadMerchantInfo 已挂载到页面实例')
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.reLaunch({ url: '/pages/home/index' })
        }
      },
    })
  }

  const menuItems = [
    {
      icon: Users,
      title: '客户管理',
      desc: '管理客户信息',
      path: '/pages/customers/index',
    },
    {
      icon: FileText,
      title: '表单模板',
      desc: '选择表单样式',
      path: '/pages/templates/index',
    },
  ]

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 商家信息卡片 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-12 pb-6">
        <View 
          className="flex items-center gap-3"
          onClick={() => Taro.navigateTo({ url: '/pages/merchant-settings/index' })}
        >
          <View className="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <Building2 size={28} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-lg font-bold text-white">
              {merchantInfo?.shop_name || '点击设置商家名称'}
            </Text>
            <Text className="block text-sm text-blue-100 mt-1">
              {merchantInfo?.phone || '未绑定手机号'}
            </Text>
          </View>
          <ChevronRight size={20} color="#fff" />
        </View>
      </View>

      {/* 功能列表 */}
      <View className="flex-1 p-4">
        <Card className="mb-4">
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <View
                key={item.path}
                className={`flex items-center justify-between p-4 ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => Taro.navigateTo({ url: item.path })}
              >
                <View className="flex items-center gap-3">
                  <item.icon size={20} color="#2563eb" />
                  <View>
                    <Text className="block text-sm font-medium text-gray-900">{item.title}</Text>
                    <Text className="block text-xs text-gray-500 mt-1">{item.desc}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9ca3af" />
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 商家设置入口 */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <View
              className="flex items-center justify-between p-4"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant-settings/index' })}
            >
              <View className="flex items-center gap-3">
                <Settings size={20} color="#2563eb" />
                <View>
                  <Text className="block text-sm font-medium text-gray-900">商家设置</Text>
                  <Text className="block text-xs text-gray-500 mt-1">设置商家名称、联系方式</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </View>
          </CardContent>
        </Card>

        {/* 退出登录按钮 */}
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-500"
          onClick={handleLogout}
        >
          <LogOut size={16} color="#ef4444" className="mr-2" />
          退出登录
        </Button>
      </View>

      {/* 底部版权信息 */}
      <View className="p-4">
        <Text className="block text-xs text-gray-400 text-center">
          易表单Pro v1.0.0
        </Text>
      </View>
    </View>
  )
}

export default ProfilePage
