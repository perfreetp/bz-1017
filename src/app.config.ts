export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/orders/index',
    'pages/assistant/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/register/index',
    'pages/team/index',
    'pages/payment/index',
    'pages/refund/index',
    'pages/review/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B35',
    navigationBarTitleText: '马拉松报名',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8F9FA'
  },
  tabBar: {
    color: '#A0AEC0',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '赛事首页'
      },
      {
        pagePath: 'pages/orders/index',
        text: '我的报名'
      },
      {
        pagePath: 'pages/assistant/index',
        text: '参赛助手'
      },
      {
        pagePath: 'pages/mine/index',
        text: '个人中心'
      }
    ]
  }
})
