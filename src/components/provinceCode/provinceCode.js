Component({
  properties: {
    province: String,
  },
  data: {
    key_one: ["京", "沪", "粤", "浙", "津", "渝", "川", "苏"],
    key_two: ["鄂", "皖", "湘", "闽", "黑", "吉", "辽", "鲁"],
    key_three: ["冀", "甘", "陕", "宁", "豫", "晋", "赣", "琼"],
    key_four: ["贵", "黔", "云", "桂", "青", "新", "蒙", "藏"],
    key_five: ["使", "临"],
    animationData: {},
  },
  methods: {
    // 点击传给父级当前选中的省
    chooseProvince(e) {
      this.setData({
        province: e.target.dataset.item
      })
      var animation = wx.createAnimation({
        duration: 200,
        timingFunction: 'linear',
        delay: 0,
      })
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
      })
      animation.translateY(273).step()
      this.setData({
        animationData: animation.export()
      })
      setTimeout(() => {
        this.triggerEvent('province', e.target.dataset.item)
      }, 200)
    },
  },
  ready () {
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear',
      delay: 0,
    })
    animation.translateY(273).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(
      function () {
        animation.translateY(0).step()
        this.setData({
          animationData: animation.export(),
        })
      }.bind(this),
      0
    )
  },
})