export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的表单',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '报价单',
      enablePullDownRefresh: true,
    }
