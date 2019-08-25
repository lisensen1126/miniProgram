const {cdpReport} = getApp()

Component({
  properties: {
    // 进入页面的开始时间
    enterPageDate: {
      type: Number,
      value: 0,
    },    
  },
  methods: {
    cancel() {
      this.triggerEvent('triggercancel', {str: 'cancal'})
    },
    backIndex(e) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    },
    goCard(e) {
      wx.navigateTo({
        url: '/pages/card/myCardBag/myCardBag'
      })    
    }
  },
})