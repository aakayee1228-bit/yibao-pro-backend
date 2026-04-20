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
    console.log('[商家设置] useDidShow 触发，加载商家信息')
    loadMerchantInfo()
  })

  const loadMerchantInfo = async () => {
    console.log('[商家设置] loadMerchantInfo 开始执行 - 强制刷新')
    setLoading(true)
    try {
      // 添加随机数避免缓存
      const random = Math.random().toString(36).substring(7)
      const res = await Network.request({
        url: '/api/merchants/info',
        method: 'GET',
        data: { _t: random },
      })

      console.log('[商家信息] 完整响应对象:', res)
      console.log('[商家信息] 响应.statusCode:', res.statusCode)
      console.log('[商家信息] 响应.data:', res.data)
      console.log('[商家信息] 响应.data.data:', res.data?.data)

      if (res.statusCode === 200 && res.data?.code === 0 && res.data?.data) {
        const data = res.data.data as MerchantInfo
        console.log('[商家设置] 解析到的商家数据:', data)
        console.log('[商家设置] 准备设置表单数据 - shopName:', data.shop_name)

        setShopName(data.shop_name || '')
        setContactName(data.contact_name || '')
        setPhone(data.phone || '')
        setAddress(data.address || '')

        console.log('[商家设置] 表单数据已更新:', {
          shopName: data.shop_name,
          contactName: data.contact_name,
          phone: data.phone,
          address: data.address,
        })
      } else {
        console.error('[商家信息] 响应数据格式异常:', res.data)
      }
    } catch (error) {
      console.error('[商家信息] 加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    console.log('[商家设置] 开始保存，当前表单数据:', { shopName, contactName, phone, address })
    console.log('[商家设置] 表单数据类型:', {
      shopName: typeof shopName,
      contactName: typeof contactName,
      phone: typeof phone,
      address: typeof address,
    })

    if (!shopName.trim()) {
      Taro.showToast({ title: '请输入商家名称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const requestData = {
        shop_name: shopName.trim(),
        contact_name: contactName.trim(),
        phone: phone.trim(),
        address: address.trim() || '',
      }

      console.log('[商家设置] 准备发送的数据:', requestData)
      console.log('[商家设置] 请求URL:', '/api/merchants/update')

      const res = await Network.request({
        url: '/api/merchants/update',
        method: 'POST',
        data: requestData,
      })

      console.log('[保存商家信息] 完整响应:', res)
      console.log('[保存商家信息] 响应对象结构:', {
        statusCode: res.statusCode,
        data: res.data,
        hasData: !!res.data,
        dataCode: res.data?.code,
        dataMsg: res.data?.msg,
      })

      if (res.statusCode === 200 && res.data?.code === 0) {
        console.log('[保存商家信息] 保存成功，重新加载最新数据')

        Taro.showToast({ title: '保存成功', icon: 'success' })

        // 保存成功后，立即重新加载商家信息
        await loadMerchantInfo()

        console.log('[保存商家信息] 数据已重新加载')
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
      {/* 版本标记 - 代码更新后应该能看到这个 */}
      <View className="bg-red-500 p-2 text-center">
        <Text className="block text-white text-sm font-bold">
          ✅ 代码已更新 - 20240420版本
        </Text>
      </View>

      {/* 调试信息 */}
      <View className="bg-yellow-50 p-3 border-b border-yellow-200">
        <Text className="block text-xs text-yellow-700 mb-1">调试信息：</Text>
        <Text className="block text-xs text-yellow-600">公司: {shopName || '(空)'}</Text>
        <Text className="block text-xs text-yellow-600">联系人: {contactName || '(空)'}</Text>
        <Text className="block text-xs text-yellow-600">电话: {phone || '(空)'}</Text>
        <Text className="block text-xs text-yellow-600">地址: {address || '(空)'}</Text>
      </View>

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
