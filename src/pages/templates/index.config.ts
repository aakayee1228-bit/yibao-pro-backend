export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '表单模板',
    })
  : { navigationBarTitleText: '报价单模板' }
