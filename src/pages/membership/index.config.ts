export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '会员中心',
    })
  : {
      navigationBarTitleText: '会员中心',
    }
