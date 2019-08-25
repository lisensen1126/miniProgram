// 导入数据接口
import {
	getCouponsLists,
	getCoupon
} from '@/libs/modules/coupon'
import {
	// VisitorCreate,
	getStoreByRelation
} from '@/libs/modules/common'
import queryScene from '@/utils/queryScene'

// 获取全局应用程序实例对象
const {
	showMessage,
	globalData,
	isRegistered,
  getAccessId
} = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'voucher',
		// 页面初始化数据
		list: [],
		relation_id: null, // 技师id
		showHome: false,
		need_get_id: false, // 是否需要通过relation_id获取门店id
		topbarHeight: 0, // 头部padding-top高度
		// 分页参数
		meta: {
			last_page: 1,
			current_page: 0,
		},
		isLoading: true,
		isAllLoaded: false,
	},
	// 生命周期函数--监听页面加载
	async onLoad(query) {
		// 分享二维码进入场景接收参数  scene: 传值xxx，不传：0
    let self = this
    let obj = {}
		// 当前小程序历史路径
		let historyLength = getCurrentPages().length
		// 由分享二维码进入 历史路径只有一条
		if (historyLength <= 1) {
			self.setData({
				showHome: true,
			})
    }
    self.setData({
      topbarHeight: globalData.topbarHeight
    })
    // 如果是扫码进入
    if(query.scene) {
      // 解码二维码的参数
      const scene = decodeURIComponent(query.scene)
      // 如果scene值使用 ',' 拼接
      if (scene.indexOf(',') > 0) {
        obj = queryScene(scene)
        this.data.relation_id = parseInt(obj.from_id)
        this.data.need_get_id = false
        wx.setStorageSync('scene', obj.from_id)
        wx.setStorageSync('current_store_id', obj.scene.store_id)
      } else {
        this.data.relation_id = parseInt(scene)
        this.data.need_get_id = true
        wx.setStorageSync('scene', scene)
        this.getStoreId(scene)
        // this.remindUserHistory()
      }
    } else {
      this.data.need_get_id = false
    }
		// 判断是否判断过注册
    if (globalData.is_registered === 2) {
      await isRegistered()
      getAccessId(obj) // 获取access_id
      this.getCouponList() // 获取优惠券列表
		}
    wx.hideShareMenu()
	},

	async onShow() {
		// 正在调用接口，通过relation_id获取门店id
		if (this.data.need_get_id === true) {
			return false
		}
		this.data.meta.last_page = 1
		this.data.meta.current_page = 0
		this.setData({
			list: [],
			isLoading: true,
			isAllLoaded: false,
    })
    if (globalData.is_registered !== 2) {
      this.getCouponList() // 获取优惠券列表
    }
  },
	// 获取优惠券列表
	async getCouponList() {
		this.setData({ isLoading: true })
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
				meta
			} = await getCouponsLists({
				page: this.data.meta.current_page + 1,
				per_page: 10,
        is_show: 1,
			})
			if (statusCode === 200 && code === 0) {
				let _list = this.data.list
				_list.splice(_list.length, 0, ...data)
				this.setData({
					list: _list,
					isAllLoaded: meta.current_page >= meta.last_page,
				})
				this.data.meta = meta
			} else {
				showMessage({
					title: '获取优惠券列表失败',
					content: message,
				})
			}
		} catch (err) {
			console.error('领券中心-getCouponList', err)
		}
		this.setData({ isLoading: false })
		wx.hideLoading()
	},

  /**
   * 上拉加载
   */
	onReachBottom() {
		if (this.data.isAllLoaded) {
			return
		}
		this.getCouponList()
	},

	// 领取优惠券数据请求
	async getCouponOperation(item) {
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
			return
		}

		let self = this
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		let params = {
			coupon_id: item.detail.coupon.coupon_id,
			obtain_type: 4, // 1：定向推送，2：活动中心，4：优惠来袭，5：商品详情
		}
		// 存在技师id
		if (self.data.relation_id) {
			params.relation_id = parseInt(self.data.relation_id)
    }
    // 当前时间 减去 获取access_id的时间 是否超过五分钟
    if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
      params.access_id =  wx.getStorageSync('access_id').access_id
    }
    
		try {
			const {
				statusCode,
				data,
				code,
				message
			} = await getCoupon(params)
			if (statusCode === 200 && code === 0) {
				let id = item.detail.coupon.coupon_id
				self.data.list.forEach(v => {
					if (v.coupon_id == id) {
						// v.receive_status = v.user_limit === 1 ? 3 : 2
						v.receive_status = 2
						v.cc_id = data[0].cc_id
					}
				})
				this.setData({
					list: self.data.list,
				})
				wx.hideLoading()
				wx.showToast({
					title: '领取成功',
					icon: 'succes',
					duration: 1500,
					mask: true
				})
				// showMessage({
				// 	title: '领取成功',
				// 	content: `${message}`,
				// })
			} else {
				wx.hideLoading()
				showMessage({
					title: '领取优惠券失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('领券中心-getCouponOperation', err)
		}
	},
	useCoupon(event) {
		const coupon = event.detail.coupon
		if (coupon.coupon_use_type == 2) {
			wx.navigateTo({ url: `/pages/mall/categories/categories?category_id=0&type=2` })
		} else {
			wx.navigateTo({ url: '/pages/applicable/applicable?ccId=' + coupon.cc_id + '&type=' + coupon.coupon_use_type })
		}
	},
	// 记录用户访问记录
	// async remindUserHistory() {
	// 	// form_type 来源页面类型：1首页，2领券中心，3门店详情，4门店评价
	// 	let params = {
	// 		relation_id: parseInt(this.data.relation_id),
	// 		from_type: 2
	// 	}
	// 	await VisitorCreate(params)
	// 	wx.hideLoading()
	// },

	// 获取门店id并存储当前门店id,请求接口公共方法传入该参数
	async getStoreId(id) {
		try {
			const { statusCode, message, data, code, } = await getStoreByRelation({
				relation_id: id,
			})
			if (statusCode === 200 && code === 0) {
				wx.setStorageSync('current_store_id', data.store_id) // 存储当前门店id,请求接口公共方法传入该参数
				// 继续调用页面其他接口
				this.data.need_get_id = false
				this.onShow()
			} else {
				showMessage({
					title: '获取门店信息失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('领券中心-getStoreId', err)
		}
	},
});