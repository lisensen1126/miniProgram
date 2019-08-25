
// 获取全局应用程序实例对象
const { cdpReport, globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		icon: '', // 缺省图标
    slogan: '', // 缺省内容
    title: '', // 缺省标题
    showHome: false,
    top_height: 0, // padding高度
	},

	// 生命周期函数--监听页面加载
	onLoad(option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }    
    this.setData({
      icon: option && option.icon ? option.icon : 'nostore',
      slogan: option && option.slogan ? option.slogan : '暂无内容',
      title: option && option.title ? option.title : '缺省页',
    })
    // 动态设置首页标题
		wx.setNavigationBarTitle({
			title: this.data.title
		})
  },
  
  onShow() {
  },

});
