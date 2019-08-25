// 获取全局应用程序实例对象
import {OrderpaySuccess} from '@/libs/modules/order'
import {getCouponStateApi} from '@/libs/modules/coupon'
const {showMessage, globalData } = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		orderNo: '',  //订单号
		isShowCoupon: false,    //是否显示优惠券
		detail_load: false,
		showHome: false,
		is_disabled: true,
		recommend_coupon: [],     // 推荐的优惠券列表数据
	},
	// 获取订单详情
	async getOrderDetail() {
		let self = this
		// self.setData({
		// 	detail_load: true
    // })
    self.data.detail_load = true
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    try {
      const {statusCode,code, message, data} = await OrderpaySuccess({
        trade_order_no: self.data.orderNo
      })
      if (statusCode === 200 && code === 0) {
        // self.setData({
        //   detail_load: false
        // })
        self.data.detail_load = false
        data.item.forEach(ele => {
          ele.unit_price = (ele.unit_price/100).toFixed(2)
        })
        if (data.total_amount) {
          data.total_amount = (data.total_amount/100).toFixed(2)
        }
        if (data.final_amount) {
          data.final_amount = (data.final_amount/100).toFixed(2)
        }
        if (data.preferential_price) {
          data.preferential_price = (data.preferential_price/100).toFixed(2)
        }
        if (data.maintenance_fee) {
          data.maintenance_fee = (data.maintenance_fee/100).toFixed(2)
        }
        if (data.random_coupon_price) {
          data.random_coupon_price = (data.random_coupon_price/100).toFixed(2)
        }
        self.setData({
          order: data,
        })
        wx.hideLoading()
        setTimeout(() => {
          if (data.is_first === 1){
            self.fetchCouponList()
          }
          self.data.is_disabled = false
        }, 3000)
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取订单支付信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('支付成功-getOrderDetail:', err)
    }
	},
	// 去预约
	goAppointment(e) {
		if(this.data.detail_load){
			return
		}
		wx.redirectTo({
      url: `/pages/appointment/makeAppointment/makeAppointment?trade_order_id=${this.data.order.trade_order_id}`
		})
	},

	// 查看订单详情
	goOrderDetail(e) {
    // 延时三秒跳转
    if(this.data.detail_load || this.data.is_disabled){
			return
		}
		wx.redirectTo({
      url: `/pages/order/orderDetail/orderDetail?number=${this.data.order.trade_order_id}`
		})
	},
	// 关闭分享有礼
	couponCancel() {
		this.setData({
			isShowCoupon: false
		})
	},

	// 下单有礼数据
	async fetchCouponList () {
    this.setData({
      isShowCoupon: false,
      recommend_coupon: [],
    })
		try {
      const {statusCode, data, code,} = await getCouponStateApi({
				from_type: 4
			})
      if (statusCode === 200 && code === 0) {
				if (data.length > 0) {
					this.setData({
						isShowCoupon: true,
						recommend_coupon: data,
					})
				}
			} else {
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      console.error('支付成功-fetchCouponList:', err)
    }
	},

  // 生命周期函数--监听页面加载
  onLoad(option) {
    wx.hideShareMenu()
    this.setData({
			orderNo: option.orderNo,
			topbarHeight: globalData.topbarHeight
    })
  },
  async onShow() {
	  this.getOrderDetail()
  },
});
