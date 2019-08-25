import {getOrderDetail} from '@/libs/modules/order'

// 获取全局应用程序实例对象
const { globalData } = getApp();
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		order: {},
		number: null,
		showHome: false,
    top_height: 0, // padding高度
	},
	 // 获取订单详情
	async getOrder () {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		try {
			const {statusCode, data, code, message} = await getOrderDetail({
				trade_order_id: this.data.number
			})
			if (statusCode === 200 && code === 0) {
				data.item.forEach(ele => {
					ele.unit_price = (ele.unit_price/100).toFixed(2)
				})
				this.setData({
					order: data,
				})
			} else {
				showMessage({
					title: '获取订单详情失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('好友分享礼-getOrder:', err)
		}
		wx.hideLoading()
	},
	goDeatil (e) {
		let sku_id = e.currentTarget.dataset.skuid
		let spu_id = e.currentTarget.dataset.spuid
		let type = e.currentTarget.dataset.type
		if (type === 1) {
			wx.navigateTo({
				url: `/pages/mall/goodsDetail/goodsDetail?spu_id=${spu_id}&sku_id=${sku_id}`
			})
		} else if (type === 2) {
			wx.navigateTo({
				url: `/pages/mall/serviceDetail/serviceDetail?spu_id=${spu_id}`
			})
		}
	},
	// 生命周期函数--监听页面加载
	onLoad(option) {
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }		
		this.setData({
      top_height: globalData.topbarHeight,
			number: option.number
		})
	},
	onShow () {
		this.getOrder()
	}
});
