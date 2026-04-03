export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '易清单',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '智能报价助手',
      enablePullDownRefresh: true,
    }
