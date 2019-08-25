// 获取全局应用程序实例对象
const { cdpReport, globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    type: '', // 图片展示判断
    top_height: 0, // padding高度
	},

	/*** 生命周期函数--监听页面加载 ***/
	onLoad(options) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		wx.hideShareMenu()
		this.setData({
			type: parseInt(options.type)
		})
	},
});
