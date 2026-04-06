export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '表单详情',
    })
  : { navigationBarTitleText: '表单详情' }
