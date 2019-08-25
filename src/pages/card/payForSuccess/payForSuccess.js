import {
  getOrderDetail,
  OrderpaySuccess,
} from '@/libs/modules/order'
import {getCouponStateApi} from '@/libs/modules/coupon'
const {
  showMessage,
  globalData,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    info: {},
    isinitiated: false,
    orderNumber: null,
    isShowCoupon: false,      // 有礼页面展示
    recommend_coupon: [],     // 推荐的优惠券列表数据
	},
	// 获取订单详情
	async getOrderDetails() {
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
      } = await getOrderDetail({
        trade_order_id: this.data.orderNo,
      })
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200) {
				if (code === 0) {
          this.setData({
            info: data
          })
				}
      } else {
        showMessage({
          title: '获取支付信息失败',
          content: `${message}`,
        })
        wx.hideLoading()
      }
    } catch (err) {
      console.error('支付成功-getOrderDetails', err)
      wx.hideLoading()
    }
  },
  // 获取订单支付信息
  async orderPayState() {
    let self = this
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      mask: true,
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await OrderpaySuccess({
        trade_order_no: self.data.orderNumber,
      })
      if (statusCode === 200) {
        if (code === 0) {
          if (data.is_first === 1) {
            self.fetchCouponList()
          } else {
            self.setData({
              isShowCoupon: false
            })
          }
        }
      } else {
        showMessage({
          title: '获取支付状态失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('支付成功-orderPayState', err)
    }
  },
	// 查看订单详情
	goOrderList(e) {
		wx.redirectTo({
      url: `/pages/order/orderList/orderList`
    })
	},
	// 我的卡包
	goMyCard(e) {
		wx.redirectTo({
      url: `/pages/card/myCardDetail/myCardDetail?order_no=${this.data.info.trade_order_no}`
    })
  },
  // 赠送记录
  goGiving(e) {
    wx.redirectTo({
      url: `/pages/card/giveRecord/giveRecord`
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
      console.error('支付成功-fetchCouponList', err)
    }
	},
	async onLoad(option) {
    this.setData({
      orderNo: option.orderNo,
      orderNumber: option.order,
      topbarHeight: globalData.topbarHeight
    })
    wx.hideShareMenu()
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 延时三秒
    setTimeout(()=>{
      this.getOrderDetails()
      this.orderPayState()
    },3000)
  },
  onShow() {
    this.setData({
      isShowCoupon: false
    })
    globalData.cc_id = null
  }
});