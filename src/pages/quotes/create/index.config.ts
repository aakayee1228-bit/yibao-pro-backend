export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '新建报价单' })
  : { navigationBarTitleText: '新建报价单' }
