export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '新建表单' })
  : { navigationBarTitleText: '新建表单' }
