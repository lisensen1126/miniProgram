const {
	globalData
} = getApp()
Component({
  properties: {
    list: Array
  },
  data: {
    show_button: false
  },
  methods: {
    // 赠送空项目
    giveProject() {
      wx.showToast({
        icon: 'none',
        title: '赠送项目不能为空'
      })
    },
    // inputchange事件
    bindKeyInput(e) {
      this.setData({
        phone: e.detail.value
      })
    },
    // 关闭弹框
    cancel() {
      this.triggerEvent('triggercancel')
    },
    // 判断是否有项目大于0
    judgeNum(arr) {
      return arr.some(ele => ele.give_num > 0)
    },
    // 加加
    add(e) {
      let item = e.currentTarget.dataset.item
      if (item.num - item.used_num - item.give_num === 0) {
        return
      }
      let arr = JSON.parse(JSON.stringify(this.data.list))
      arr.forEach(v => {
        if (v.id === item.id) {
          v.give_num ++ 
        }
      });
      this.setData({
        list: arr,
        show_button: this.judgeNum(arr)
      })
    },
    // 减减
    reduc(e) {
      let item = e.currentTarget.dataset.item
      if (item.give_num === 0) {
        return
      }
      let arr = JSON.parse(JSON.stringify(this.data.list))
      arr.forEach(v => {
        if (v.id === item.id) {
          v.give_num --
        }
      });
      this.setData({
        list: arr,
        show_button: this.judgeNum(arr)
      })
    }
  },
})