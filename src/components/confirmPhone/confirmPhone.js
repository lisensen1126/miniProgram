const {
	globalData
} = getApp()
Component({
  properties: {

  },
  data: {
    phone: ''
  },
  methods: {
    bindKeyInput(e) {
      this.setData({
        phone: e.detail.value
      })
    },
    cancel() {
      this.triggerEvent('triggercancel')
    },
    confirm() {
      let reg = /^1(3|4|5|7|8)\d{9}$/
      if (!reg.test(this.data.phone)) {
        wx.showToast({
          icon: 'none',
          title: '手机号格式错误',
        })
      } else if (this.data.phone === globalData.phone) {
        wx.showToast({
          icon: 'none',
          title: '很抱歉，如果给自己手机号送卡请使用“立即购卡”',
        })
      } else {
        this.triggerEvent('triggerconfirm', this.data.phone)
      }
    },
  },
})