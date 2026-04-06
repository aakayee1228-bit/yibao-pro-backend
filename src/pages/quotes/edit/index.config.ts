export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '编辑表单',
    })
  : {
      navigationBarTitleText: '编辑表单',
    }
