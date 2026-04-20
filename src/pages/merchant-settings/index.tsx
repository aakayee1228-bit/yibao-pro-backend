import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Save, Phone, MapPin, User, Store } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'

interface MerchantInfo {
  id: string
  shop_name: string
  contact_name: string
  phone: string
  address: string
  logo: string | null
  stamp: string | null
}

const MerchantSettingsPage: FC = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shopName, setShopName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useDidShow(() => {
    loadMerchantInfo()
  })

  const loadMerchantInfo = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/merchants/info',
        method: 'GET',
      })

      console.log('[商家信息] 响应:', res.data)

      if (res.data?.code === 0 && res.data?.data) {
        const data = res.data.data as MerchantInfo
        setShopName(data.shop_name || '')
        setContactName(data.contact_name || '')
        setPhone(data.phone || '')
        setAddress(data.address || '')
      }
    } catch (error) {
      console.error('[商家信息] 加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    console.log('[商家设置] 开始保存，当前表单数据:', { shopName, contactName, phone, address })

    if (!shopName.trim()) {
      Taro.showToast({ title: '请输入商家名称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const res = await Network.request({
        url: '/api/merchants/update',
        method: 'POST',
        data: {
          company_name: shopName.trim(),
          contact_person: contactName.trim(),
          contact_phone: phone.trim(),
          contact_address: address.trim() || '',
        },
      })

      console.log('[保存商家信息] 完整响应:', res)
      console.log('[保存商家信息] 状态码:', res.statusCode)
      console.log('[保存商家信息] 响应数据:', res.data)

      if (res.statusCode === 200 && res.data?.code === 0) {
        console.log('[保存商家信息] 保存成功')
        Taro.showToast({ title: '保存成功', icon: 'success' })

        // 使用页面栈，返回上一页并刷新
        setTimeout(() => {
          const pages = Taro.getCurrentPages()
          if (pages.length >= 2) {
            const prevPage = pages[pages.length - 2] as any
            // 如果上一页是 profile 页面，刷新商家信息
            if (prevPage.route?.includes('profile')) {
              prevPage.loadMerchantInfo?.()
            }
          }
          Taro.navigateBack()
        }, 1500)
      } else {
        console.error('[保存商家信息] 保存失败，响应:', res.data)
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[保存商家信息] 异常:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Text className="text-sm text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      <View className="p-4">
        {/* 基本信息卡片 */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-4">
              {/* 商家名称 */}
              <View className="flex items-center gap-3">
                <Store size={20} color="#6b7280" />
                <View className="flex-1">
                  <Text className="block text-xs text-gray-500 mb-1">商家名称</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="请输入商家名称"
                      value={shopName}
                      onInput={(e) => setShopName(e.detail.value)}
                      maxlength={50}
                    />
                  </View>
                </View>
              </View>

              {/* 联系人 */}
              <View className="flex items-center gap-3">
                <User size={20} color="#6b7280" />
                <View className="flex-1">
                  <Text className="block text-xs text-gray-500 mb-1">联系人</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="请输入联系人姓名"
                      value={contactName}
                      onInput={(e) => setContactName(e.detail.value)}
                      maxlength={20}
                    />
                  </View>
                </View>
              </View>

              {/* 手机号 */}
              <View className="flex items-center gap-3">
                <Phone size={20} color="#6b7280" />
                <View className="flex-1">
                  <Text className="block text-xs text-gray-500 mb-1">联系电话</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      type="number"
                      placeholder="请输入手机号"
                      value={phone}
                      onInput={(e) => setPhone(e.detail.value)}
                      maxlength={11}
                    />
                  </View>
                </View>
              </View>

              {/* 地址 */}
              <View className="flex items-center gap-3">
                <MapPin size={20} color="#6b7280" />
                <View className="flex-1">
                  <Text className="block text-xs text-gray-500 mb-1">地址</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="请输入地址"
                      value={address}
                      onInput={(e) => setAddress(e.detail.value)}
                      maxlength={200}
                    />
                  </View>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 手机号绑定说明 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="block text-xs text-gray-500 leading-relaxed">
              提示：手机号作为联系方式使用，用于表单信息展示。个人主体小程序暂不支持微信一键授权获取手机号，请手动输入。
            </Text>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <Button
          className="w-full bg-blue-500 text-white py-3 rounded-lg"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} color="#ffffff" />
          <Text className="ml-2">{saving ? '保存中...' : '保存设置'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default MerchantSettingsPage
