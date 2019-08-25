const { globalData } = getApp()

Component({
  data: {
    isSharePoster: false,
    sharemodel: 'sharemodel',
  },

  methods: {
    shareToPy () {
      this.closeCouModal()
    },
    shareToPyq () {
      this.setData({
        isSharePoster: true,
      })
      this.closeCouModal()
    },
    // 关闭弹层
    closeCouModal () {
      if (this.data.isSharePoster) {
        this.triggerEvent('poster')
      } else {
        this.triggerEvent('close')
        //
      }
    },
  },

  ready () {
  },
})

