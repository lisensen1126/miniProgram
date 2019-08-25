// 获取全局应用程序实例对象
const { cdpReport, globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    h5_url: '',
    top_height: 0, // padding高度
	},

	// 生命周期函数--监听页面加载
	onLoad(option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		// cdp-查看车检报告
    cdpReport(2,'',99) 		
		this.setData({
			h5_url: option.h5_url + '?customer_id=' + option.customer_id
		})
		// TODO: onLoad
	},
});
