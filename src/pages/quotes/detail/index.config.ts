export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '报价单详情 v3-PDF',
      enableShareAppMessage: true,
      enableShareTimeline: true,
    })
  : { navigationBarTitleText: '报价单详情 v3-PDF', enableShareAppMessage: true, enableShareTimeline: true }
