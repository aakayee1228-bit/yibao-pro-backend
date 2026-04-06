export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '表单详情',
      enableShareAppMessage: true,
    })
  : { navigationBarTitleText: '表单详情', enableShareAppMessage: true }
