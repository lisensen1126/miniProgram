import {
  getOrderDetail,
  OrderpaySuccess,
  giveCardDetailApi
} from '@/libs/modules/order'
import {getCouponStateApi} from '@/libs/modules/coupon'
const {
  showMessage,
  globalData,
  cdpReport
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    info: {},
    isinitiated: false,
    orderNumber: null,
    intervarID: null,
    clock: '',
    isShowCoupon: false,      // 有礼页面展示
    recommend_coupon: [],     // 推荐的优惠券列表数据
    random_coupon: 0,         // 立减金
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
          this.data.intervarID = setInterval(this.getCountTime, 1000)
          this.setData({
            info: data,
            intervarID: this.data.intervarID
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
              trade_order_no: self.data.orderNumber,
            })
            if (statusCode === 200) {
              if (code === 0) {
                self.setData({random_coupon: data.random_coupon_price})
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
  // 倒计时
  getCountTime () {
    // 下单时间戳
    let format = this.data.info.upkeep_give_time - 0
    // 待付款订单默认时间
    let cha_time = (format + 72 * 60 * 60) - parseInt(new Date().getTime()/1000)
    // 拼团类型开团订单待付款、普通待付款订单默认30分钟支付时间
    this.setData({
      cha_time: cha_time
    })
    let day = parseInt(cha_time/(60*60*24))
    let cha_time_day = parseInt(cha_time) - parseInt(day * 60 * 60 * 24)
    let hour = this.judgeTime(parseInt(cha_time_day / 60 / 60 % 24, 10) + parseInt(day*24)) //计算剩余的分钟
    let minutes = this.judgeTime(parseInt(cha_time_day / 60 % 60, 10)) //计算剩余的分钟
    let seconds = this.judgeTime(parseInt(cha_time_day % 60, 10)) //计算剩余的秒数
    if(cha_time < 0) {
      clearInterval(this.data.intervarID)
      this.setData({
        clock: "00:00:00"
      })
    } else {
      this.setData({
        clock: hour + ":" + minutes + ":" + seconds
      })
      if (hour === '00' && minutes === '00' && seconds === '00') {
        clearInterval(this.data.intervarID)
        wx.navigateBack({
          delta: 1
        })
      }
    }
  },
  /**
   * 时 分 格式化
   * @t  时分
   */
  judgeTime (t) {
    if (t < 10) {
      return '0' + t
    } else {
      return t
    }
  },
  // 赠送卡
  async giveCard() {
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
      } = await giveCardDetailApi({
        order_no: this.data.info.trade_order_no,
        give_id: this.data.info.give_id,
      })
      wx.hideLoading()
      if (statusCode !== 200 || code !== 0) {
        showMessage({
          title: '赠卡失败',
          content: `${message}`,
        })
      }
    } catch(err) {
      console.error('支付成功-giveCard', err)
    }
  },
  onShareAppMessage() {
    this.giveCard()
    let url = `pages/card/giveCardShare/giveCardShare?share=1&upkeep_no_give=${this.data.info.trade_order_no}&give_id=${this.data.info.give_id}`
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    // 分享带上用户id,用于cdp分享参数上报
    if (globalData.current_customer_id) {
      url = url + '&share_from_id=' + globalData.current_customer_id
    }
    // 分享带上门店名称,用于cdp参数上报
    if (globalData.ep_store_name) {
      url = url + '&current_store_name=' + globalData.ep_store_name
    }
    return {
      title: '好事不忘你~送你张爱车养护卡，记得情谊永相伴！',
      imageUrl: 'https://oss1.chedianai.com/images/assets/card-share.png',
      path: url,
    };
  },
	// 我的卡包
	goMyCard(e) {
		wx.redirectTo({
      url: `/pages/card/myCardDetail/myCardDetail?order_no=${this.data.info.trade_order_no}`
    })
    // cdp-点击跳转页面事件
    let target = {
      url: '/pages/card/myCardDetail/myCardDetail',
    }
    cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)    
  },
  // 赠送记录
  goGiving(e) {
    wx.redirectTo({
      url: `/pages/card/giveRecord/giveRecord`
    })
    // cdp-点击跳转页面事件
    let target = {
      url: '/pages/card/giveRecord/giveRecord',
    }
    cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)    
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
  },
  onShow() {
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间，cdp上报用
      isShowCoupon: false
    })
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
  onUnload() {
    clearInterval(this.data.intervarID);
  },

  onHide() {
    clearInterval(this.data.intervarID)
  }, 
});