// 获取全局应用程序实例对象
import {
	getStoreList,
} from '@/libs/modules/store'
const {
	showMessage,
	globalData,
	parseDistance
} = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    store_list: [], // 门店列表
		from_page: '', // 记录是从哪个页面进来的
		showHome: false,		
	},
  // 选择门店后，返回上个页面
	goBack(e) {
    // globalData.has_changed_store = true
    // 刷新后globalData.has_changed_stor重置, 存入Storage
    wx.setStorageSync('has_changed_store', true) 
		if (this.data.from_page === 'makeAppointment') {
			// 存储选择的预约门店id,供预约接口使用
			globalData.reserve_store_id = e.currentTarget.dataset.value.store_id
			globalData.reserve_store_name = e.currentTarget.dataset.value.store_name
			wx.navigateBack()
		} else {
			// 存储当前门店id,请求接口公共方法传入该参数
			wx.setStorageSync('current_store_id', e.currentTarget.dataset.value.store_id) 
			globalData.ep_store_name = e.currentTarget.dataset.value.store_name
			wx.navigateBack()
		}	
	},
  // 获取定理定位
	getPosition() {
		let self = this
		wx.getLocation({
			type: 'gcj02', // 返回可以用于wx.openLocation的经纬度
			success(res) {
				const latitude = res.latitude.toFixed(6)
				const longitude = res.longitude.toFixed(6)
				self.getStore(longitude, latitude) // 获取门店列表
			},
			fail(res) {
				self.getStore() // 获取门店列表
			}
		})
	},
	// 获取门店列表
	async getStore(lng, lat) {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
    try {
      const {statusCode, data, code} = await getStoreList({
				local_lng: lng ? lng : '',
				local_lat: lat ? lat : '',
			})
      if (statusCode === 200 && code === 0) {
				wx.hideLoading()
				let tempArr = []
				data.forEach(v => {
					// 数据格式化 星星处理方案
					v.half = 0
					v.inActive = 0
					v.distance = parseDistance(v.distance*1000)
					v.avg_ratings = (v.avg_ratings / 100).toFixed(1) + ''
					let arr = v.avg_ratings.split('.')
					v.points = arr[0] - 0
					if (arr.length === 2) {
						v.half = arr[1] - 0
						v.inActive = 4 - v.points
					} else {
						v.inActive = 5 - v.points
					}
					tempArr.push(v)
					// 如果全局变量有预约id，则拿预约id去匹配选中门店，否则用缓存中的当前门店id去匹配
					let current_store_id = wx.getStorageSync('current_store_id')  // 当前门店id
					if (this.data.from_page === 'makeAppointment') {
						if (globalData.reserve_store_id && v.store_id === parseInt(globalData.reserve_store_id)) {
							v.is_check = 1
						} else if (!globalData.reserve_store_id && current_store_id && v.store_id === parseInt(current_store_id)) {
							v.is_check = 1
						} else {
							v.is_check = 0
						}
					} else {
						if (current_store_id && v.store_id === parseInt(current_store_id)) {
							v.is_check = 1
						} else {
							v.is_check = 0
						}
					}
				});
				this.setData({
          store_list: tempArr,
				})
			} else {
        showMessage({
          title: '获取门店列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
			wx.hideLoading()
			console.error('门店列表-getStore:', err)
    }
	},	
	// 生命周期函数--监听页面加载
	onLoad(option) {
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    }) 		
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }		
		wx.hideShareMenu()
		// 标识是从哪个页面进来的
		if (option.from_page) {
      this.data.from_page = option.from_page
		}
	},
	onShow() {
		this.getPosition() // 获取定理定位
	},
});
