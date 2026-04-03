export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '新建清单' })
  : { navigationBarTitleText: '新建清单' }
