import {
  getCardCenterDetailApi,
  makeSureOrderApi,
} from '@/libs/modules/mycard'
import {payment, myCardCouponApi, getRandomMoneyApi} from '@/libs/modules/order'
import { sendFormId } from '@/utils/formid'
const {
  showMessage,
  globalData,
  cdp
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		info: {},
		giving: null,   // 1立即下单   2赠送好友
		phone: '',
    card_id: null,
    showPhone: false,
    isPayment: false,
    isinitiated: false,
    is_show_default: false,    // 判断养护卡是否下架/删除
    cc_id: 0,                  // 优惠券id
    data_allow_count: null,    // 可以使用的优惠券金额
    myCouponList: {
      max_price: 0,
      data_allow_count:0
    },
    actual_amount: 0,          // 实付金额
    random_id: 0,              // 随机立减金额id
    random_money: 0,          // 随机立减金
    access_id: null,
  },

  onLoad(option) {
    if (option && option.access_id) {
      this.data.access_id = option.access_id
    }
		// 1 立即下单  3 赠送好友
    this.setData({
      topbarHeight: globalData.topbarHeight,
      giving: Number(option.giving),
      card_id: Number(option.card_id)
    })
    wx.hideShareMenu()
  },
  
  async onShow() {
    this.setData({
      cc_id: globalData.cc_id ? globalData.cc_id : 0,
      data_allow_count: 0
    })
    await this.getCardDetail()
    await this.getCouponList()
    this.fetchRandomMoney((this.data.actual_amount * 100).toFixed(0))
  },
  // 获取购卡详情
  async getCardDetail() {
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      let params = {
        id: this.data.card_id,
      }
      const {
        statusCode,
        data,
        code,
        message,
      } = await getCardCenterDetailApi(params)
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200) {
				if (code === 0) {
          data.price = (data.price / 100).toFixed(2)
          data.origin_price = (data.origin_price / 100).toFixed(2)
          this.setData({
            info: data
          })
				} else if (code === 10000) {
          this.setData({
            is_show_default: true,
            err_tip: '该养护卡已被删除'
          })
        } else if (code === 20000) {
          this.setData({
            is_show_default: true,
            err_tip: '该养护卡已被下架'
          })
        }
      } else {
        showMessage({
          title: '获取购卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('确认订单-getCardDetail', err)
    }
    wx.hideLoading()
  },
  // 修改手机号
  showModal() {
    this.setData({
      showPhone: true
    })
  },
  // 确定手机号
  confirmPhone(e) {
    this.setData({
      phone: e.detail,
      showPhone: false
    })
  },
  // 关闭弹框
  cancelPhone() {
    this.setData({
      showPhone: false
    })
  },
  // 确认订单
  async placeOrder() {
    let self = this
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.setData({
      isPayment: true
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let session_id = cdp.sessionId() // 获取用户sessionId
    let params = {
      session_id: session_id ? session_id : '',
      payment_channel: 1,
      item_id: this.data.card_id,
      quantity: 1,
      price: (this.data.info.price * 100).toFixed(0),
      mobile: '',
      type: this.data.giving,
      cc_id: this.data.cc_id,
      random_coupon_id: this.data.random_id,
      random_coupon_price: this.data.random_money,
    }
    // 当前时间 减去 获取access_id的时间 是否超过五分钟
    if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
      params.access_id =  wx.getStorageSync('access_id').access_id
    }
    try {
      const {statusCode, data, message, code} = await makeSureOrderApi(params)
      if (statusCode === 200 ) {
        if (code === 0) {
          this.getPayment(data.trade_order_no, data.trade_order_id)
        } else {
          showMessage({
            title: '下单失败',
            content: `${message}`,
          })
          this.setData({
            isPayment: false
          })
        }
      } else {
        showMessage({
          title: '下单失败',
          content: `${message}`,
        })
        this.setData({
          isPayment: false
        })
      }
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('确认订单-placeOrder', err)
      this.setData({
        isPayment: false
      })
    }
  },
  // 获取支付配置
  async getPayment(trade_order_no, trade_order_id) {
    let self = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      trade_order_no: trade_order_no,
    }
    try {
      const {statusCode, data, message, code} = await payment(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        wx.requestPayment({
          ...data.credential,
          success: () => {
            // php参数配置有问题待处理
            if (self.data.giving === 3) {
              // 赠送养护卡
              if (self.data.access_id) {
                wx.redirectTo({
                  url: `/pages/card/giveSuccess/giveSuccess?orderNo=${trade_order_id}&order=${trade_order_no}&access_id=${self.data.access_id}`,
                })
              } else {
                wx.redirectTo({
                  url: `/pages/card/giveSuccess/giveSuccess?orderNo=${trade_order_id}&order=${trade_order_no}`,
                })
              }
            } else {
              // 立即开单
              if (self.data.access_id) {
                wx.redirectTo({
                  url: `/pages/card/payForSuccess/payForSuccess?orderNo=${trade_order_id}&order=${trade_order_no}&access_id=${self.data.access_id}`,
                })
              } else {
                wx.redirectTo({
                  url: `/pages/card/payForSuccess/payForSuccess?orderNo=${trade_order_id}&order=${trade_order_no}`,
                })
              }
            }
          },
          fail: () => {
            // 取消支付返回上一页
            wx.navigateBack({
              delta: 1
            })
          }
        })
      } else {
        showMessage({
          title: '获取订单支付配置失败',
          content: `${message}`,
          resolve: function () {
          }
        })
        this.setData({
          isPayment: false
        })
      }
    } catch (err) {
      console.error('确认订单-getPayment', err)
      this.setData({
        isPayment: false
      })
    }
    wx.hideLoading()
  },
  // 选择优惠券
  goCouponList(e) {
    globalData.is_choose_coupon = false
    wx.navigateTo({
      url: '/pages/coupon/chooseCoupons/chooseCoupons'
    })    
  },
  // 获取优惠券
  async getCouponList() {
    let self = this
    let params = {
      total_price: ((this.data.info.price - 0) * 100).toFixed(0),
      upkeep_id: this.data.card_id,
    }
    try {
      const {statusCode, data, message, code} = await myCardCouponApi(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        if (data.length === 0) return
        // 初次进入确认订单页面
        if (!globalData.is_choose_coupon && globalData.cc_id != 0) {
          self.setData({
            data_allow_count: (data.max_price / 100).toFixed(2),
            cc_id: self.data.cc_id ? self.data.cc_id : data.cc_id,
            actual_amount: (self.data.info.price - self.data.data_allow_count).toFixed(2)
          })
        }
        // 已进入过选择优惠券页面
        if (self.data.cc_id) {
          let temp_obj =[]
          temp_obj = data.data_allow.filter(item => item.cc_id === self.data.cc_id)
          let num = ((self.data.info.price * 100)).toFixed(0) - temp_obj[0].actual_discount_amount
          self.setData({
            data_allow_count: (temp_obj[0].actual_discount_amount / 100).toFixed(2),
            actual_amount: (num / 100).toFixed(2),
          })
        } else {
          self.setData({
            data_allow_count: 0,
            actual_amount: self.data.info.price,
          })
        }

        // 更新优惠券列表数据
        globalData.myCouponList = data
        // 更新选中的优惠券ID
        globalData.cc_id = self.data.cc_id
        // 更新页面数据
        self.setData({
          myCouponList: data
        })
      } else {
        showMessage({
          title: '获取我的优惠券列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('确认订单-getCouponList:', err)
    }
    wx.hideLoading()
  },
  // formid 收集
  sendFormId,
  /**
   * 获取随机立减金额（若活动结束可以不必要请求此接口，避免浪费资源，后端暂时没有开发此功能）
   * @params money {String, Number} 金额
   */
  async fetchRandomMoney(money) {
    wx.showLoading({title: '加载中...', mask: true})
    try {
      const {statusCode, data, message, code} = await getRandomMoneyApi({total_price: money})
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        this.setData({
          random_id: data.random_coupon_id || 0,
          random_money: data.random_coupon_price || 0,
        })
      } else {
        wx.hideLoading()
        console.log(message)
      }
    } catch (err) {
      wx.hideLoading()
      console.error('获取随机立减金额-fetchRandomMoney:', err)
    }
  },
});