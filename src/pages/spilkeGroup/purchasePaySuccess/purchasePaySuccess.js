import {
  getOrderDetail,
  OrderpaySuccess,
} from '@/libs/modules/order'
import {getCouponStateApi} from '@/libs/modules/coupon'
const {
  showMessage,
  globalData,
  changeDateTime
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    info: {},
    isinitiated: false,
    order_id: 0,              // 订单ID
    order_no: 0,              // 订单编号
    isShowCoupon: false,      // 有礼页面展示
    recommend_coupon: [],     // 推荐的优惠券列表数据
	},
  async onLoad(option) {
    this.setData({
      order_no: parseInt(option.orderNo),
      topbarHeight: globalData.topbarHeight
    })
    this.data.order_id = parseInt(option.orderId)
    wx.hideShareMenu()
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 延时三秒请求
    setTimeout(()=>{
      this.getOrderDetails()
      this.orderPayState()
    },3000)
  },
  onShow() {
    this.setData({
      isShowCoupon: false
    })
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
        trade_order_id: this.data.order_id,
        trade_order_no: this.data.order_no,
      })
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200) {
				if (code === 0) {
				  // 格式化时间格式
				  data.created_at=changeDateTime(data.created_at)
				  data.paid_at=changeDateTime(data.paid_at)
          data.item[0].activity_price = (data.item[0].activity_price/100).toFixed(2)
          this.setData({
            info: data
          })
				}
      } else {
        showMessage({
          title: '获取支付信息失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      console.error('支付成功-getOrderDetails', err)
      wx.hideLoading()
    }
  },
  // 获取订单支付信息
  orderPayState() {
    let self = this
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      mask: true,
      success: () => {
        setTimeout(async () => {
          try {
            const {
              statusCode,
              data,
              code,
              message,
            } = await OrderpaySuccess({
              trade_order_no: self.data.order_no,
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
        }, 3000)
      }
    })
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
      url: `/pages/card/myCardDetail/myCardDetail?order_no=${this.data.order_no}`
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
	}
});