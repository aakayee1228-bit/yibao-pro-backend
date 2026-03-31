export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '客户管理' })
  : { navigationBarTitleText: '客户管理' }
