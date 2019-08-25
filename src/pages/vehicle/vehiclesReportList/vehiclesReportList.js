import {
  inspectListApi
} from '@/libs/modules/user'


// 获取全局应用程序实例对象
const {
	showMessage,
  globalData,
  changeDateTime,
	isRegistered,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    title: '我的车检报告',
    show_home: false, // 是否有返回按钮
    top_height: '',
    list: [],
	},
	// 生命周期函数--监听页面加载
	async onLoad() {
    wx.hideShareMenu()
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      top_height: globalData.topbarHeight,
    })
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 2) {
			await isRegistered()
			if(globalData.is_registered === 0) {
				wx.navigateTo({
					url: '/pages/register/registerPhone/registerPhone',
				})
			} else {
				this.getReportList()
			}
    }
	},
	onShow() {
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				show_home: true
			})
		}
    if(globalData.is_registered === 1) {
			this.getReportList()
		}
  },
  // 去详情
  goDetail(e) {
    let item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: '/pages/vehicle/vehicleReportDetail/vehicleReportDetail?id=' + item.id
    })
  },
  //   /**
  //  * 上拉加载
  //  */
  // onReachBottom () {
  //   if (this.data.is_all_loaded) {
  //     return
  //   }
  //   this.getReportList()
	// },
  async getReportList () {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		try {
			const {
				statusCode,
				data,
				code,
				message,
			} = await inspectListApi()
			if (statusCode === 200 && code === 0) {
				let _list = data
        _list.forEach(item => {
          item.inspect_time = changeDateTime(item.inspect_time, 2)
				})
				console.log(data, '列表数据')
        this.setData({
          list: _list,
        })
			} else {
				showMessage({
					title: '获取我的车检记录列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('获取我的车检记录列表失败-getReportList', err)
		}
		wx.hideLoading()
  },
});