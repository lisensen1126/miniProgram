// 获取全局应用程序实例对象
const {cdpReport, globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		description_cover: '',			// 图片
		brand_description: '',			// 简介
    showHome: false,
    top_height: 0, // padding高度
	},

	/***生命周期函数--监听页面加载  ***/
	onLoad(options) {
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
		}
		this.setData({
			topbarHeight: globalData.topbarHeight,
			description_cover: this.options.image+'?imageMogr2/auto-orient',  // 在传参过程中，因为img的url问号被截断，再加上是为了解决ios图片被旋转90的问题
			brand_description: this.options.describe
		})
		wx.hideShareMenu()
	},
});
