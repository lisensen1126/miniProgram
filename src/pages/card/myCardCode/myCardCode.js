const {
	showMessage,
	registerRedirect,
	globalData,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		info: '',
		id:'',
		qrcode_url: '',
	},
	onLoad(option) {
		this.setData({
			id: option.id,
			qrcode_url: globalData.host + globalData.apiRoot + 'order/qrcode?write_off_code=' + option.id.replace('VIP', ''),
			topbarHeight: globalData.topbarHeight,
		})
		wx.hideShareMenu()
	},
});