export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '商品库',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '商品库',
      enablePullDownRefresh: true,
    }
