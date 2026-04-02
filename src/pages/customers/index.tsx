import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Plus, Phone, MapPin, Pencil, Trash2, Search, X, CircleAlert } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import './index.css'

const MAX_CUSTOMERS = 10

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  company: string
  remark: string
  tags: string[]
  created_at: string
}

const CustomersPage: FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    company: '',
    remark: '',
  })

  useDidShow(() => {
    fetchCustomers()
  })

  const fetchCustomers = async () => {
    try {
      const res = await Network.request({
        url: '/api/customers',
        method: 'GET',
        data: search ? { search } : {},
      })

      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Customer[] }
        setCustomers(responseData.data || [])
      }
    } catch (err) {
      console.error('获取客户列表失败:', err)
    }
  }

  const handleAddCustomer = () => {
    // 检查客户数量限制
    if (customers.length >= MAX_CUSTOMERS) {
      Taro.showModal({
        title: '客户数量已达上限',
        content: `免费版最多添加 ${MAX_CUSTOMERS} 个客户，请删除不需要的客户后再添加`,
        showCancel: false,
      })
      return
    }

    setEditingCustomer(null)
    setFormData({ name: '', phone: '', address: '', company: '', remark: '' })
    setShowAddModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      company: customer.company || '',
      remark: customer.remark || '',
    })
    setShowAddModal(true)
  }

  const handleDeleteCustomer = async (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除该客户吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/customers/${id}`,
              method: 'DELETE',
            })
            Taro.showToast({ title: '删除成功', icon: 'success' })
            fetchCustomers()
          } catch (err) {
            console.error('删除客户失败:', err)
            Taro.showToast({ title: '删除失败', icon: 'error' })
          }
        }
      },
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入客户名称', icon: 'error' })
      return
    }

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const res = await Network.request({
        url,
        method,
        data: formData,
      })

      if (res.statusCode === 200 || res.statusCode === 201) {
        Taro.showToast({ title: editingCustomer ? '更新成功' : '添加成功', icon: 'success' })
        setShowAddModal(false)
        fetchCustomers()
      }
    } catch (err) {
      console.error('保存客户失败:', err)
      Taro.showToast({ title: '保存失败', icon: 'error' })
    }
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <View className="p-4 bg-white">
        <View className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search size={18} color="#9ca3af" />
          <Input
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            onConfirm={fetchCustomers}
            placeholder="搜索客户名称/电话/公司"
            className="flex-1 bg-transparent"
          />
          {search && (
            <View onClick={() => { setSearch(''); fetchCustomers() }}>
              <X size={18} color="#9ca3af" />
            </View>
          )}
        </View>
      </View>

      {/* 客户数量提示 */}
      <View className="px-4 py-2">
        <View className="bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <CircleAlert size={14} color="#f59e0b" />
          <Text className="text-xs text-amber-700">
            已添加 {customers.length}/{MAX_CUSTOMERS} 个客户
          </Text>
          {customers.length >= MAX_CUSTOMERS - 3 && (
            <Text className="text-xs text-gray-400">
              {customers.length >= MAX_CUSTOMERS ? '已达上限' : '即将达上限'}
            </Text>
          )}
        </View>
      </View>

      {/* 客户列表 */}
      <ScrollView className="flex-1 p-4">
        {customers.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Text className="text-4xl mb-4">👥</Text>
            <Text className="text-sm text-gray-400">暂无客户</Text>
            <Text className="text-xs text-gray-400 mt-1">点击右下角添加客户</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <View className="flex items-start justify-between mb-2">
                    <View className="flex-1">
                      <View className="flex items-center gap-2">
                        <Text className="text-base font-medium text-gray-900">{customer.name}</Text>
                        {customer.company && (
                          <Badge variant="secondary" className="text-xs">{customer.company}</Badge>
                        )}
                      </View>
                    </View>
                    <View className="flex items-center gap-2">
                      <View
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Pencil size={16} color="#6b7280" />
                      </View>
                      <View
                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </View>
                    </View>
                  </View>
                  
                  {customer.phone && (
                    <View className="flex items-center gap-2 mt-2">
                      <Phone size={14} color="#9ca3af" />
                      <Text className="text-sm text-gray-600">{customer.phone}</Text>
                    </View>
                  )}
                  
                  {customer.address && (
                    <View className="flex items-center gap-2 mt-1">
                      <MapPin size={14} color="#9ca3af" />
                      <Text className="text-sm text-gray-600">{customer.address}</Text>
                    </View>
                  )}

                  {customer.remark && (
                    <View className="mt-2 pt-2 border-t border-gray-100">
                      <Text className="text-xs text-gray-400">{customer.remark}</Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 添加按钮 */}
      <View
        className="fixed right-4 bottom-20 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
        onClick={handleAddCustomer}
      >
        <Plus size={24} color="#ffffff" />
      </View>

      {/* 添加/编辑弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <View className="w-full bg-white rounded-t-xl">
            <View className="p-4 border-b border-gray-100 flex items-center justify-between">
              <Text className="text-base font-medium">
                {editingCustomer ? '编辑客户' : '添加客户'}
              </Text>
              <View onClick={() => setShowAddModal(false)}>
                <X size={20} color="#9ca3af" />
              </View>
            </View>
            
            <ScrollView className="p-4" style={{ maxHeight: '60vh' }}>
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">客户名称 *</Text>
                <Input
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                  placeholder="请输入客户名称"
                  className="w-full"
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">联系电话</Text>
                <Input
                  value={formData.phone}
                  onInput={(e) => setFormData({ ...formData, phone: e.detail.value })}
                  placeholder="请输入联系电话"
                  className="w-full"
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">公司名称</Text>
                <Input
                  value={formData.company}
                  onInput={(e) => setFormData({ ...formData, company: e.detail.value })}
                  placeholder="请输入公司名称"
                  className="w-full"
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">地址</Text>
                <Input
                  value={formData.address}
                  onInput={(e) => setFormData({ ...formData, address: e.detail.value })}
                  placeholder="请输入地址"
                  className="w-full"
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm text-gray-500 mb-1">备注</Text>
                <Input
                  value={formData.remark}
                  onInput={(e) => setFormData({ ...formData, remark: e.detail.value })}
                  placeholder="请输入备注"
                  className="w-full"
                />
              </View>
            </ScrollView>

            <View className="p-4 border-t border-gray-100">
              <Button
                className="w-full bg-blue-500 text-white py-3 rounded-lg"
                onClick={handleSubmit}
              >
                {editingCustomer ? '保存修改' : '添加客户'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default CustomersPage
