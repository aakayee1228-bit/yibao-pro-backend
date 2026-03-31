export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '报价单',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '报价单',
      enablePullDownRefresh: true,
    }
