import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { ShieldCheck, UserCheck } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user'
import './index.css'

const LoginPage: FC = () => {
  const { user, isLoggedIn, login, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [isWeapp, setIsWeapp] = useState(false)

  useEffect(() => {
    setIsWeapp(Taro.getEnv() === Taro.ENV_TYPE.WEAPP)
  }, [])

  useDidShow(() => {
    // 如果已登录，跳转到首页
    if (isLoggedIn && user) {
      Taro.switchTab({ url: '/pages/home/index' })
    }
  })

  const handleLogin = async () => {
    if (loading) return

    setLoading(true)
    try {
      // 获取微信登录 code
      if (isWeapp) {
        const { code } = await Taro.login()
        if (code) {
          const userData = await login(code)
          if (userData) {
            Taro.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/home/index' })
            }, 1000)
          } else {
            Taro.showToast({ title: '登录失败', icon: 'error' })
          }
        }
      } else {
        // H5 环境模拟登录
        const mockCode = `h5_${Date.now()}`
        const userData = await login(mockCode)
        if (userData) {
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/home/index' })
          }, 1000)
        } else {
          Taro.showToast({ title: '登录失败', icon: 'error' })
        }
      }
    } catch (err) {
      console.error('登录异常:', err)
      Taro.showToast({ title: '登录失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // 设置一个默认用户，允许游客模式
    setUser({
      id: 'guest-user',
      openid: 'guest',
      nickname: '游客用户',
      avatar: null,
      phone: null,
      is_active: true,
      created_at: new Date().toISOString(),
      last_login_at: null,
    })
    Taro.switchTab({ url: '/pages/home/index' })
  }

  return (
    <View className="flex flex-col min-h-screen bg-gradient-to-br from-blue-500 to-blue-600">
      {/* 顶部装饰 */}
      <View className="pt-20 pb-8 px-4 text-center">
        <View className="w-20 h-20 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
          <Text className="text-4xl">📋</Text>
        </View>
        <Text className="block text-2xl font-bold text-white">智能报价助手</Text>
        <Text className="block text-sm text-blue-100 mt-2">专业报价工具，轻松管理商品</Text>
      </View>

      {/* 登录卡片 */}
      <View className="flex-1 px-4">
        <Card className="bg-white">
          <CardContent className="p-6">
            <Text className="block text-lg font-semibold text-gray-900 text-center mb-6">
              欢迎使用
            </Text>

            {/* 功能说明 */}
            <View className="space-y-4 mb-8">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShieldCheck size={20} color="#2563eb" />
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-900">数据安全</Text>
                  <Text className="block text-xs text-gray-500">云端存储，数据不丢失</Text>
                </View>
              </View>

              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <UserCheck size={20} color="#10b981" />
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-900">会员权益</Text>
                  <Text className="block text-xs text-gray-500">登录解锁更多功能</Text>
                </View>
              </View>
            </View>

            {/* 登录按钮 */}
            <Button
              className="w-full bg-blue-500 text-white rounded-lg py-3 text-base font-medium"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? '登录中...' : (isWeapp ? '微信一键登录' : '立即登录')}
            </Button>

            {/* 游客模式 */}
            <View className="mt-4 text-center">
              <Text className="text-sm text-blue-500" onClick={handleSkip}>
                暂不登录，先看看
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部协议 */}
      <View className="px-4 py-6 text-center">
        <Text className="text-xs text-blue-100">
          登录即表示同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}

export default LoginPage
