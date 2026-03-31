import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import './index.css'

const ProductsPage: FC = () => {
  return (
    <View className="flex flex-col min-h-screen bg-gray-50 p-4">
      <View className="text-center py-8">
        <Text className="block text-xl font-semibold text-gray-900">商品库</Text>
        <Text className="block text-sm text-gray-500 mt-2">管理商品信息和行业模板</Text>
      </View>
    </View>
  )
}

export default ProductsPage
