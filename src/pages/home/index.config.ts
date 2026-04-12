export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '易表单Pro',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '易表单Pro',
      enablePullDownRefresh: true,
    }
