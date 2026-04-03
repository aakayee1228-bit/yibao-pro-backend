export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/products/index',
    'pages/quotes/index',
    'pages/profile/index',
    'pages/quotes/create/index',
    'pages/customers/index',
    'pages/templates/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '易清单',
    navigationBarTextStyle: 'black',
  },
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
        text: '清单',
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
