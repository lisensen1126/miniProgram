// 获取全局应用程序实例对象
import {
	getMyCouponLIst,
} from '@/libs/modules/coupon'
const {
	showMessage,
  globalData
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'myCoupon',
		list: [],
    showHome: false,
		top_height: 0, // padding高度
		taber_list: [ '未使用', '已使用', '已过期' ], // 1:待使用;2:已使用;3:已过期
		coupon_status: 1,
		// 分页参数
		meta: {
			last_page: 1,
			current_page: 0,
		},
		isLoading: true,
    isAllLoaded: false,
	},
	/**
	 * 去使用
	 * @param {Object} event 子组件的传递
	 */
	toUse (event) {
		const coupon = event.detail.coupon				
		if (coupon.coupon_use_type == 2) {
			wx.navigateTo({ url:`/pages/mall/categories/categories?category_id=0&type=2` })
		} else {
			wx.navigateTo({ url:'/pages/applicable/applicable?ccId=' + coupon.cc_id + '&type=' + coupon.coupon_use_type})
		}
	},
	// 选择导航栏
	chooseTaber (event) {
		const _index = event.currentTarget.dataset.index + 1
		if (_index !== this.data.coupon_status) {
			this.data.meta.last_page = 1
			this.data.meta.current_page = 0
			this.setData({
				coupon_status: _index,
				list: [],
				isAllLoaded: true,
				isLoading: false
			})
			this.getCouponList()
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
			let page_index = this.data.meta.current_page + 1
			const {
				statusCode,
				data,
				code,
				message,
				meta
			} = await getMyCouponLIst({
				page: page_index,
				per_page: 10,
				status: this.data.coupon_status
			})
			if (statusCode === 200 && code === 0) {
				let _list = this.data.list
				_list.splice(_list.length, 0, ...data)
				this.data.meta = meta
        this.setData({
          list: _list,
          isAllLoaded: meta.current_page >= meta.last_page
        })
			} else {
				showMessage({
					title: '获取我的优惠券列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('我的优惠券-getCouponList', err)
		}
		this.setData({ isLoading: false })
		wx.hideLoading()
	},

  /**
   * 上拉加载
   */
  onReachBottom () {
    if (this.data.isAllLoaded) {
      return
    }
    this.getCouponList()
	},

	// 去领券中心
	goVoucher(e) {
		wx.navigateTo({
			url: '/pages/coupon/voucher/voucher',
		})			
	},
	// 生命周期函数--监听页面加载
	onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    wx.hideShareMenu()
	},
	onShow() {
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
		}
		this.data.meta.last_page = 1
		this.data.meta.current_page = 0
		this.setData({
			list: [],
			isLoading: true,
			isAllLoaded: false,
		})
		this.getCouponList()
	},	
});