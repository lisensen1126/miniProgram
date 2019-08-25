const app = getApp()

Component({
  properties: {
    // 当前 第几个 高亮
    title: {
      type: String,
      value: '壳牌养护中心',
      observer: ''
    },
    // 是否显示 首页icon
    home: {
      type: Boolean,
      value: false,
      observer: ''
    }
  },
  data: {
    back: false, // 是否显示 返回按钮
    statusBarHeight: app.globalData.systemInfo.statusBarHeight || 20,
    titleBarHeight: app.globalData.systemInfo.model.indexOf('iPhone') !== -1 ? 44 : 48
  },
  methods: {
    goBack () {
      wx.navigateBack({
        delta: 1
      })
    },
    goHome () {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },
  attached() { 
    this.setData({
      back: getCurrentPages().length > 1 ? true : false,
    })
  }
})
