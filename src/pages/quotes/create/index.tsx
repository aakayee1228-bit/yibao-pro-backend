import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Plus, Trash2, ChevronRight, Package } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import './index.css'

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  company: string
}

interface Product {
  id: string
  name: string
  unit: string
  retail_price: string
  specification: string
}

interface QuoteItem {
  product_id?: string
  product_name: string
  unit: string
  quantity: number
  unit_price: number
  discount: number
  amount: number
  remark?: string
}

const CreateQuotePage: FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [remark, setRemark] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)

  useDidShow(() => {
    fetchCustomers()
    fetchProducts()
  })

  const fetchCustomers = async () => {
    try {
      const res = await Network.request({ url: '/api/customers', method: 'GET' })
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Customer[] }
        setCustomers(responseData.data || [])
      }
    } catch (err) {
      console.error('获取客户列表失败:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await Network.request({ url: '/api/products', method: 'GET' })
      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Product[] }
        setProducts(responseData.data || [])
      }
    } catch (err) {
      console.error('获取商品列表失败:', err)
    }
  }

  const addItem = (product: Product) => {
    const unitPrice = parseFloat(product.retail_price) || 0
    const newItem: QuoteItem = {
      product_id: product.id,
      product_name: product.name,
      unit: product.unit,
      quantity: 1,
      unit_price: unitPrice,
      discount: 0,
      amount: unitPrice,
    }
    setItems([...items, newItem])
    setShowProductPicker(false)
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: number | string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // 重新计算金额
    if (field === 'quantity' || field === 'unit_price' || field === 'discount') {
      const item = newItems[index]
      const qty = item.quantity
      const price = item.unit_price
      const disc = item.discount
      newItems[index].amount = Math.round((qty * price - disc) * 100) / 100
    }
    
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const totalAmount = subtotal - discount

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Taro.showToast({ title: '请选择客户', icon: 'error' })
      return
    }
    if (items.length === 0) {
      Taro.showToast({ title: '请添加商品', icon: 'error' })
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/quotes',
        method: 'POST',
        data: {
          customer_id: selectedCustomer.id,
          items: items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            amount: item.amount,
            remark: item.remark,
          })),
          discount,
          remark,
          valid_days: validDays,
        },
      })

      if (res.statusCode === 200 || res.statusCode === 201) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1000)
      } else {
        Taro.showToast({ title: '创建失败', icon: 'error' })
      }
    } catch (err) {
      console.error('创建报价单失败:', err)
      Taro.showToast({ title: '创建失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* 选择客户 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">客户信息</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedCustomer ? (
              <View
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                onClick={() => setShowCustomerPicker(true)}
              >
                <View>
                  <Text className="block text-sm font-medium text-gray-900">{selectedCustomer.name}</Text>
                  <Text className="block text-xs text-gray-500 mt-1">
                    {selectedCustomer.phone} {selectedCustomer.company && `· ${selectedCustomer.company}`}
                  </Text>
                </View>
                <ChevronRight size={18} color="#9ca3af" />
              </View>
            ) : (
              <View
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg"
                onClick={() => setShowCustomerPicker(true)}
              >
                <Plus size={18} color="#9ca3af" />
                <Text className="text-sm text-gray-400 ml-2">选择客户</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 商品列表 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex items-center justify-between">
              <CardTitle className="text-base">商品明细</CardTitle>
              <Text
                className="text-sm text-blue-500"
                onClick={() => setShowProductPicker(true)}
              >
                添加商品
              </Text>
            </View>
          </CardHeader>
          <CardContent className="pt-0">
            {items.length === 0 ? (
              <View
                className="flex flex-col items-center justify-center py-8"
                onClick={() => setShowProductPicker(true)}
              >
                <Package size={40} color="#d1d5db" />
                <Text className="text-sm text-gray-400 mt-2">点击添加商品</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <View key={index} className="p-3 bg-gray-50 rounded-lg">
                    <View className="flex items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-gray-900">{item.product_name}</Text>
                      <View onClick={() => removeItem(index)}>
                        <Trash2 size={16} color="#ef4444" />
                      </View>
                    </View>
                    <View className="flex items-center gap-2 mb-2">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500">数量</Text>
                        <Input
                          type="number"
                          value={String(item.quantity)}
                          onInput={(e) => updateItem(index, 'quantity', parseFloat(e.detail.value) || 0)}
                          className="mt-1"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500">单价</Text>
                        <Input
                          type="digit"
                          value={String(item.unit_price)}
                          onInput={(e) => updateItem(index, 'unit_price', parseFloat(e.detail.value) || 0)}
                          className="mt-1"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500">优惠</Text>
                        <Input
                          type="digit"
                          value={String(item.discount)}
                          onInput={(e) => updateItem(index, 'discount', parseFloat(e.detail.value) || 0)}
                          className="mt-1"
                        />
                      </View>
                    </View>
                    <View className="flex items-center justify-between">
                      <Badge variant="secondary">{item.unit}</Badge>
                      <Text className="text-sm font-bold text-blue-600">¥{item.amount.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* 合计信息 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-gray-500">商品金额</Text>
              <Text className="text-sm text-gray-900">¥{subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-gray-500">优惠金额</Text>
              <View className="flex items-center">
                <Text className="text-sm text-gray-400 mr-1">¥</Text>
                <Input
                  type="digit"
                  value={String(discount)}
                  onInput={(e) => setDiscount(parseFloat(e.detail.value) || 0)}
                  className="w-20 text-right"
                />
              </View>
            </View>
            <View className="border-t border-gray-100 pt-2 mt-2">
              <View className="flex items-center justify-between">
                <Text className="text-base font-medium text-gray-900">合计金额</Text>
                <Text className="text-xl font-bold text-blue-600">¥{totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 其他信息 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-sm text-gray-500">有效期（天）</Text>
              <Input
                type="number"
                value={String(validDays)}
                onInput={(e) => setValidDays(parseInt(e.detail.value) || 30)}
                className="w-20 text-right"
              />
            </View>
            <View className="flex items-start">
              <Text className="text-sm text-gray-500 mr-2">备注</Text>
              <Input
                value={remark}
                onInput={(e) => setRemark(e.detail.value)}
                placeholder="请输入备注信息"
                className="flex-1"
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          className="w-full bg-blue-500 text-white py-3 rounded-lg"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '创建中...' : '创建报价单'}
        </Button>
      </View>

      {/* 客户选择弹窗 */}
      {showCustomerPicker && (
        <View className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <View className="w-full bg-white rounded-t-xl max-h-96">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-base font-medium">选择客户</Text>
              <Text
                className="absolute right-4 top-4 text-sm text-gray-400"
                onClick={() => setShowCustomerPicker(false)}
              >
                关闭
              </Text>
            </View>
            <ScrollView className="p-4" style={{ maxHeight: '300px' }}>
              {customers.length === 0 ? (
                <View className="py-8 text-center">
                  <Text className="text-sm text-gray-400">暂无客户</Text>
                  <Text
                    className="text-sm text-blue-500 mt-2"
                    onClick={() => {
                      setShowCustomerPicker(false)
                      Taro.navigateTo({ url: '/pages/customers/index' })
                    }}
                  >
                    去添加客户
                  </Text>
                </View>
              ) : (
                customers.map((customer) => (
                  <View
                    key={customer.id}
                    className="p-3 border-b border-gray-50"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setShowCustomerPicker(false)
                    }}
                  >
                    <Text className="text-sm font-medium text-gray-900">{customer.name}</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {customer.phone} {customer.company && `· ${customer.company}`}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 商品选择弹窗 */}
      {showProductPicker && (
        <View className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <View className="w-full bg-white rounded-t-xl max-h-96">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-base font-medium">选择商品</Text>
              <Text
                className="absolute right-4 top-4 text-sm text-gray-400"
                onClick={() => setShowProductPicker(false)}
              >
                关闭
              </Text>
            </View>
            <ScrollView className="p-4" style={{ maxHeight: '300px' }}>
              {products.length === 0 ? (
                <View className="py-8 text-center">
                  <Text className="text-sm text-gray-400">暂无商品</Text>
                  <Text
                    className="text-sm text-blue-500 mt-2"
                    onClick={() => {
                      setShowProductPicker(false)
                      Taro.switchTab({ url: '/pages/products/index' })
                    }}
                  >
                    去添加商品
                  </Text>
                </View>
              ) : (
                products.map((product) => (
                  <View
                    key={product.id}
                    className="p-3 border-b border-gray-50"
                    onClick={() => addItem(product)}
                  >
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-sm font-medium text-gray-900">{product.name}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {product.specification} · {product.unit}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-blue-600">¥{product.retail_price}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

export default CreateQuotePage
