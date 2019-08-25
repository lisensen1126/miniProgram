// 获取全局应用程序实例对象
const {cdpReport } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'defaultPage',
	},

	// 生命周期函数--监听页面加载
	onLoad(option) {
		wx.hideShareMenu()
		let self = this
		self.setData({
			topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
			code: option.code
		})
		if (parseInt(option.share) === 1) {
		self.setData({sharePage: true})
		}
	},
});
