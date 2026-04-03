export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '清单模板',
    })
  : { navigationBarTitleText: '报价单模板' }
