Component({
  properties: {
    // 当前 第几个 高亮
    current: {
      type: String,
      value: '0',
      observer: ''
    },
  },
  methods: {
    // 首页
    goIndex (e) {
      if (this.data.current === '0')
        return false
      wx.reLaunch({
        url: '/pages/index/index',
      })
    },
    // 分类
    goCategory (e) {
      if (this.data.current === '1')
        return false
      wx.reLaunch({
        url: '/pages/mall/categoryList/categoryList',
      })
    },
    // 门店
    goStore (e) {
      if (this.data.current === '2')
        return false
      wx.reLaunch({
        url: '/pages/store/store',
      })
    },
    // 我的
    goMy (e) {
      if (this.data.current === '3')
        return false
      wx.reLaunch({
        url: '/pages/personal/personal',
      })
    },
  }
})
