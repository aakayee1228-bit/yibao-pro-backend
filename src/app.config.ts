export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/products/index',
    'pages/quotes/index',
    'pages/profile/index',
    'pages/quotes/create/index',
    'pages/quotes/edit/index',
    'pages/quotes/detail/index',
    'pages/customers/index',
    'pages/templates/index',
    'pages/merchant-settings/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '易表单Pro',
    navigationBarTextStyle: 'black',
  },
  // 全局分享配置
  // 注意：分享图片需要先添加到项目中，建议尺寸 5:4，如 400x320 像素
  // 将图片放置在 src/assets/share.jpg 后，取消下面注释并修改路径
  // shareAppMessage: {
  //   imageUrl: '/assets/share.jpg',
  // },
  tabBar: {
    color: '#6b7280',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: './assets/tabbar/house.png',
        selectedIconPath: './assets/tabbar/house-active.png',
      },
      {
        pagePath: 'pages/products/index',
        text: '商品库',
        iconPath: './assets/tabbar/package.png',
        selectedIconPath: './assets/tabbar/package-active.png',
      },
      {
        pagePath: 'pages/quotes/index',
        text: '表单',
        iconPath: './assets/tabbar/file-text.png',
        selectedIconPath: './assets/tabbar/file-text-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
