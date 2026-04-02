export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '报价单模板',
    })
  : { navigationBarTitleText: '报价单模板' }
