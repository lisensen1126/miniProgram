// 获取全局应用程序实例对象
const { globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    showHome: false,    // 控制返回首页按钮显隐
    top_height: 0, // padding高度
	},

	// 生命周期函数--监听页面加载
	onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		let pages = getCurrentPages();
		// 判断当前页面在history栈里是否是第一个
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
		wx.hideShareMenu()
	},
});
