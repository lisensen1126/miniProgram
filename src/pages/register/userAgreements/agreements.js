// 获取全局应用程序实例对象
const {globalData, cdpReport } = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    // 公司名称
    ep_store_name: '',
    pageShow: false,
    top_height: 0, // padding高度
  },
  // 生命周期函数--监听页面加载
	onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
	},
	// 生命周期函数--监听页面加载
	onShow() {
		wx.hideShareMenu()
    // 获取公司名称
    this.setData({
      ep_store_name: globalData.ep_store_name,
	    pageShow: true
    })

	}
});
