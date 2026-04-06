import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Network } from '@/network'
import './index.css'

interface Product {
  id: string
  industry_id: string
  name: string
  code: string | null
  unit: string
  specification: string | null
  cost_price: string | null
  retail_price: string
  wholesale_price: string | null
  is_active: boolean
  created_at: string
}

interface Industry {
  id: string
  name: string
  icon: string | null
}

const ProductsPage: FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [currentIndustry, setCurrentIndustry] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // 表单字段
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: '个',
    specification: '',
    cost_price: '',
    retail_price: '',
    wholesale_price: '',
  })

  useDidShow(() => {
    fetchIndustries()
    fetchProducts()
  })

  const fetchIndustries = async () => {
    try {
      const res = await Network.request({
        url: '/api/industries',
        method: 'GET',
      })

      console.log('获取行业列表响应:', res.statusCode, res.data)

      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Industry[] }
        setIndustries(responseData.data || [])
      }
    } catch (err) {
      console.error('获取行业列表异常:', err)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/products',
        method: 'GET',
      })

      console.log('获取商品列表响应:', res.statusCode, res.data)

      if (res.statusCode === 200 && res.data) {
        const responseData = res.data as { data?: Product[] }
        setProducts(responseData.data || [])
      }
    } catch (err) {
      console.error('获取商品列表异常:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      code: '',
      unit: '个',
      specification: '',
      cost_price: '',
      retail_price: '',
      wholesale_price: '',
    })
    setDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      code: product.code || '',
      unit: product.unit,
      specification: product.specification || '',
      cost_price: product.cost_price || '',
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price || '',
    })
    setDialogOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除商品「${product.name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const deleteRes = await Network.request({
              url: `/api/products/${product.id}`,
              method: 'DELETE',
            })

            if (deleteRes.statusCode === 200) {
              Taro.showToast({ title: '删除成功', icon: 'success' })
              fetchProducts()
            }
          } catch (err) {
            console.error('删除商品异常:', err)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入商品名称', icon: 'none' })
      return
    }
    if (!formData.retail_price.trim()) {
      Taro.showToast({ title: '请输入零售价', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const submitData = {
        industry_id: industries[0]?.id || 'industry-engineering', // 默认工程建材行业
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        unit: formData.unit.trim() || '个',
        specification: formData.specification.trim() || null,
        cost_price: formData.cost_price.trim() || null,
        retail_price: formData.retail_price.trim(),
        wholesale_price: formData.wholesale_price.trim() || null,
      }

      console.log('提交商品数据:', submitData)

      let res
      if (editingProduct) {
        // 更新
        res = await Network.request({
          url: `/api/products/${editingProduct.id}`,
          method: 'PUT',
          data: submitData,
        })
      } else {
        // 新建
        res = await Network.request({
          url: '/api/products',
          method: 'POST',
          data: submitData,
        })
      }

      console.log('提交商品响应:', res)

      if (res.statusCode === 200 || res.statusCode === 201) {
        Taro.showToast({
          title: editingProduct ? '更新成功' : '添加成功',
          icon: 'success',
        })
        setDialogOpen(false)
        fetchProducts()
      } else {
        const errorData = res.data as { msg?: string; message?: string }
        const errorMsg = errorData.msg || errorData.message || '操作失败'
        console.error('提交商品失败:', errorMsg, res)
        Taro.showToast({
          title: errorMsg,
          icon: 'none',
        })
      }
    } catch (err) {
      console.error('提交商品异常:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 过滤商品
  const filteredProducts = products.filter((product) => {
    const matchIndustry = currentIndustry === 'all' || product.industry_id === currentIndustry
    const matchSearch =
      !searchKeyword ||
      product.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (product.code && product.code.toLowerCase().includes(searchKeyword.toLowerCase()))
    return matchIndustry && matchSearch
  })

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex items-center gap-2">
          <View className="flex-1 bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <Search size={16} color="#9ca3af" />
            <Input
              className="flex-1 bg-transparent text-sm"
              placeholder="搜索商品名称/编码"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
            />
          </View>
          <View
            className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center"
            onClick={handleAddProduct}
          >
            <Plus size={20} color="#ffffff" />
          </View>
        </View>
      </View>

      {/* 行业切换 */}
      {industries.length > 0 && (
        <View className="bg-white px-4 py-2 border-b border-gray-200">
          <Tabs value={currentIndustry} onValueChange={setCurrentIndustry}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              {industries.map((industry) => (
                <TabsTrigger key={industry.id} value={industry.id}>
                  {industry.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </View>
      )}

      {/* 商品列表 */}
      <View className="flex-1 px-4 py-3 pb-20">
        {loading ? (
          <View className="text-center py-12">
            <Text className="text-sm text-gray-400">加载中...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View className="text-center py-12">
            <Text className="text-sm text-gray-400">暂无商品</Text>
            <Text className="text-xs text-gray-400 mt-1">点击右上角 + 添加商品</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <View className="flex items-start justify-between">
                    <View className="flex-1">
                      <View className="flex items-center gap-2">
                        <Text className="text-base font-medium text-gray-900">{product.name}</Text>
                        {product.code && (
                          <Badge variant="secondary" className="text-xs">
                            {product.code}
                          </Badge>
                        )}
                      </View>
                      <View className="flex items-center gap-2 mt-1">
                        <Text className="text-xs text-gray-500">
                          {product.specification || '无规格'}
                        </Text>
                        <Text className="text-xs text-gray-400">|</Text>
                        <Text className="text-xs text-gray-500">{product.unit}</Text>
                      </View>
                      <View className="flex items-center gap-3 mt-2">
                        <View>
                          <Text className="text-xs text-gray-400">零售价</Text>
                          <Text className="text-sm font-bold text-red-500">
                            ¥{product.retail_price}
                          </Text>
                        </View>
                        {product.wholesale_price && (
                          <View>
                            <Text className="text-xs text-gray-400">批发价</Text>
                            <Text className="text-sm font-medium text-gray-700">
                              ¥{product.wholesale_price}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex items-center gap-2">
                      <View
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Pencil size={16} color="#6b7280" />
                      </View>
                      <View
                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 添加/编辑商品弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑商品' : '添加商品'}</DialogTitle>
          </DialogHeader>
          <View className="flex flex-col gap-4 py-4">
            <View className="flex flex-col gap-2">
              <Label>商品名称 *</Label>
              <Input
                placeholder="请输入商品名称"
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
              />
            </View>
            <View className="flex flex-col gap-2">
              <Label>商品编码</Label>
              <Input
                placeholder="选填，用于快速检索"
                value={formData.code}
                onInput={(e) => setFormData({ ...formData, code: e.detail.value })}
              />
            </View>
            <View className="flex flex-row gap-3">
              <View className="flex-1 flex flex-col gap-2">
                <Label>单位 *</Label>
                <Input
                  placeholder="个/件/米"
                  value={formData.unit}
                  onInput={(e) => setFormData({ ...formData, unit: e.detail.value })}
                />
              </View>
              <View className="flex-1 flex flex-col gap-2">
                <Label>规格</Label>
                <Input
                  placeholder="选填"
                  value={formData.specification}
                  onInput={(e) => setFormData({ ...formData, specification: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex flex-row gap-3">
              <View className="flex-1 flex flex-col gap-2">
                <Label>零售价 *</Label>
                <Input
                  type="number"
                  placeholder="必填"
                  value={formData.retail_price}
                  onInput={(e) => setFormData({ ...formData, retail_price: e.detail.value })}
                />
              </View>
              <View className="flex-1 flex flex-col gap-2">
                <Label>批发价</Label>
                <Input
                  type="number"
                  placeholder="选填"
                  value={formData.wholesale_price}
                  onInput={(e) => setFormData({ ...formData, wholesale_price: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex flex-col gap-2">
              <Label>成本价</Label>
              <Input
                type="number"
                placeholder="选填，仅自己可见"
                value={formData.cost_price}
                onInput={(e) => setFormData({ ...formData, cost_price: e.detail.value })}
              />
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '提交中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ProductsPage
