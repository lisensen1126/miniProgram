// 获取全局应用程序实例对象
const { globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'advert',
    advert_list: [],
    top_height: 0, // padding高度
	},

	// 生命周期函数--监听页面加载
	onLoad(option) {
		wx.hideShareMenu()
		let pages = getCurrentPages();
		let perpage = pages[pages.length - 2];
		this.setData({
			topbarHeight: globalData.topbarHeight,
			page_title: perpage.data.advert_title + '品牌日',
			advert_list: perpage.data.advert_list
		})
	},
});
