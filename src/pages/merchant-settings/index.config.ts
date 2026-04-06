export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '商家设置',
    })
  : {
      navigationBarTitleText: '商家设置',
    }
