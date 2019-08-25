Component({
  properties: {
    plate: String, // 车牌 用于校验车牌是否正确 （错误点击完成不关闭）
    province: String, // 省 用于判断车牌用于那种校验
  },
  data: {
    key_one: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    key_two: ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    key_three: ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    key_four: ["Z", "X", "C", "V", "B", "N", "M", ''],
    key_five: ["学", "港", "澳", "警", "领", ''],
    animationData: {},
  },
  methods: {
    // 点击传给父级当前点击的数据
    clickKey(e) {
      this.triggerEvent('key', e.target.dataset.item)
    },
    // 点击删除
    delContent() {
      this.triggerEvent('del')
    },
    /**
     * 校验车牌号
     * @param {*} val 车牌号
     */
    checkLicense(val) {
      if (this.data.province === '使') {
        // 使 后面6位数字
        const pattern = /^[0-9]{6}$/
        return pattern.test(val)
      } if (this.data.province === '临') {
        // 临 后是随便6位
        if (val.length !== 6) {
          return false
        } else {
          return true
        }
      } else {
        const pattern = /^([a-zA-Z]{1})([A-Za-z0-9]{5}|[DdFf][A-HJ-NP-Za-hj-np-z0-9][0-9]{4}|[0-9]{5}[DdFf]|[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1})$/
        return pattern.test(val)
      }
    },
    // 点击保存
    saveData() {
      // 父组件校验 展示提示
      this.triggerEvent('checkLicense')
      // 如果车牌为空
      if (!this.data.plate) {
        this.colseAnimate()
      }
      // 如果车牌有值 且校验正确
      if (this.data.plate && this.checkLicense(this.data.plate)) {
        this.colseAnimate()
      }
    },
    // 关闭动画
    colseAnimate() {
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
        this.triggerEvent('save')
      }, 200)
    },
  },
  ready () {
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear',
      delay: 0,
    })
    animation.translateY(350).step()
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