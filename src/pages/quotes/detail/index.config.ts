export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '报价单详情 - v2',
      enableShareAppMessage: true,
      enableShareTimeline: true,
    })
  : { navigationBarTitleText: '报价单详情 - v2', enableShareAppMessage: true, enableShareTimeline: true }
