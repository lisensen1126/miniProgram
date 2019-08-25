// 获取全局应用程序实例对象
const {globalData,cdpReport } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'appointmentSuccess',  // 标题
    info: {},   // 详情信息
    showHome: false,    // 控制返回首页按钮显隐
    top_height: 0, // padding高度
	},

	// 生命周期函数--监听页面加载
	toIndex (e) {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  onLoad () {
    this.setData({
      top_height: globalData.topbarHeight,
      info: globalData.appointmentSuccessInfo,
      enter_page_date: new Date() / 1, // 进入页面的时间
    })
    wx.hideShareMenu()
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
  },  
});
