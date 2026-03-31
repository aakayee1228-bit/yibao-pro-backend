import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import './index.css'

const ProfilePage: FC = () => {
  return (
    <View className="flex flex-col min-h-screen bg-gray-50 p-4">
      <View className="text-center py-8">
        <Text className="block text-xl font-semibold text-gray-900">我的</Text>
        <Text className="block text-sm text-gray-500 mt-2">个人信息与设置</Text>
      </View>
    </View>
  )
}

export default ProfilePage
