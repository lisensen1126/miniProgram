const {
	showMessage,
	globalData,
	cdpReport
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'chooseCoupons',
		currentLevel: '0',
		result: {},
	},
	// 选择优惠券
  chooseCoupon(e) {
		let id = parseInt(e.currentTarget.dataset.id)
	  let result = this.data.result
    result.data_allow.forEach(function (item) {
      if (parseInt(item.cc_id) === id && (item.checkOut === 1)) {
        item.checkOut = 2
      } else {
        item.checkOut = 1
      }
		})
    this.setData({
      result: result
    })
  },

	switchLevel({currentTarget}) {
		currentTarget.dataset.level === '0' ? this.setData({
			currentLevel: '0'
		}) : this.setData({
			currentLevel: '1'
		})
	},

	// 优惠券选择成功跳转页面
	getCouponOperation () {
    globalData.cc_id = 0
		this.data.result.data_allow.forEach(function (item) {
			if (item.checkOut === 2) {
        globalData.cc_id = item.cc_id
        globalData.coupon_offline = item
				// 判断已经选择过优惠券
				globalData.is_choose_coupon = true
			}
    })
    wx.navigateBack({
      delta: 1
    })
	},

	onLoad() {
		this.setData({
      top_height: globalData.topbarHeight,
    })
		wx.hideShareMenu()
	},
	
	onShow() {
		let result = JSON.parse(JSON.stringify(globalData.myCouponList))
		let cIndex = 0
		// 可使用
		result.data_allow.forEach(function (item, i) {
			if (parseInt(item.cc_id) === parseInt(globalData.cc_id)) {
				item.checkOut = 2
				cIndex = i
				globalData.coupon_offline = item
			} else {
				item.checkOut = 1
			}
			// 页面展示金额格式保留2位小数
			item.page_discount_amount = (item.discount_amount/100).toFixed(2)
		})
		if (cIndex) result.data_allow.unshift(result.data_allow.splice(cIndex, 1)[0])
    this.setData({
      result: result
    })
	},	
});