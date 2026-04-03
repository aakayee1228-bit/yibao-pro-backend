export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '商品清单',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '报价单',
      enablePullDownRefresh: true,
    }
