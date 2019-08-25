import { addOrder, payment, myCoupon} from '@/libs/modules/order'


const {showMessage, globalData, cdp } = getApp()
import { getRandomMoneyApi } from '../../../libs/modules/order';
Page({
  data: {
    // 订单数据
    orderItem: {},
    // 优惠券数据
    myCouponList: {
      max_price: 0,
      data_allow_count:0
    },
    // 可以使用的优惠券金额
    data_allow_count:null,
    // 实际支付金额
    order_total: 0,
    // 优惠券ID
    cc_id: 0,
    // 实际优惠金额
    couponTotal_amount: 0,
    // 来源普通1  智能保养2
    order_type: 1,
    // 是否包含未上架商品 1不包含   2包含
    is_sale: 1,
    showHome: false,
    isPayment: false, // 防止多次点击确认支付按钮的flag
    top_height: 0, // padding高度
    random_id: '',         // 随机立减金额的id
    random_money: 0,       // 随机立减金额
  },
  /****我的优惠券列表*****/
  async getCouponList() {
    let self = this
    let params = {
      total_price: this.data.orderItem.total_amount,
      data: [],
    }
    this.data.orderItem.item.forEach(function (v) {
      params.data.push({
        product_id: v.listItem.biz_product_id,
        category_id: v.listItem.category_id
      })
    })
    try {
      const {statusCode, data, message, code} = await myCoupon(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        if (data.length === 0) return
        // 初次进入确认订单页面
        if (!globalData.is_choose_coupon && globalData.cc_id != 0) {
          self.setData({
            data_allow_count: data.max_price,
            cc_id: self.data.cc_id?self.data.cc_id:data.cc_id
          })
        }
        // 已进入过选择优惠券页面
        if (self.data.cc_id) {
          data.data_allow.forEach(function (item) {
            if(item.cc_id === self.data.cc_id) {
              self.setData({
                data_allow_count: item.actual_discount_amount
              })
            }
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

  /****跳转选择优惠券列表*****/
  goCouponList(e) {
    // 格式化数据，跳转前置为false
    globalData.is_choose_coupon = false
    wx.navigateTo({
      url: '/pages/coupon/chooseCoupons/chooseCoupons'
    }) 
  },

  /****下单、支付*****/
  async confirmOrder (e) {
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.data.isPayment = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })

    let upkeep_no = ''
    let upkeep_info_id = ''
    let upkeep_item_id = ''
    if (this.data.choosed_card) {
      upkeep_no = this.data.choosed_card.upkeep_no
      upkeep_info_id = this.data.choosed_card.upkeep_info_id
    }
    if (this.data.choosed_item) {
      upkeep_item_id = this.data.choosed_item.id
    }
    let session_id = cdp.sessionId() // 获取用户sessionId
    let params = {
      session_id: session_id ? session_id : '',
      payment_channel: 1,
      cc_id: this.data.cc_id,
      order_type: this.data.order_type?this.data.order_type:1,
      purchase_type: globalData.order_source,
      item: [],
      random_coupon_id: this.data.random_id,
      random_coupon_price: this.data.random_money,
      maintenance_fee: (this.data.working_time * 100).toFixed(0)
    }
    this.data.orderItem.item.forEach(function (listItem) {
      params.item.push({
        item_id: listItem.item_id,
        quantity: listItem.quantity,
        sku_id: listItem.sku_id,
        shop_car_id: listItem.shop_car_id?listItem.shop_car_id:0,
        type: listItem.type?listItem.type:0
      })
    })
    try {
      const {statusCode, data, message, code} = await addOrder(params)
      if (statusCode === 200 ) {
        if (parseInt(code) === 0) {
          //10011025
          this.getPayment(data.trade_order_no)
          globalData.cc_id = 0
        } else if (parseInt(code) === 10011025) {
          showMessage({
            title: '下单失败',
            content: `订单中的商品/服务已被门店下架`,
          })
          this.data.isPayment = false
        } else {
          showMessage({
            title: '下单失败',
            content: `${message}`,
          })
          this.data.isPayment = false
        }
      } else {
        showMessage({
          title: '下单失败',
          content: `${message}`,
        })
        this.data.isPayment = false
      }
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('确认订单-confirmOrder:', err)
      this.data.isPayment = false
    }
  },

  // 获取支付配置
  async getPayment(trade_order_no) {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      trade_order_no: trade_order_no
    }
    try {
      const {statusCode, data, message, code} = await payment(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        wx.requestPayment({
          ...data.credential,
          success: () => {
            // php参数配置有问题待处理
            wx.redirectTo({
              url: `/pages/order/paySuccess/paySuccess?orderNo=${trade_order_no}`,
            })
          },
          fail: () => {
            this.data.isPayment = false
            wx.navigateBack()
          }
        })
      } else {
        showMessage({
          title: '获取订单支付配置失败',
          content: `${message}`,
          resolve: function () {
            // 刷新页面数据
            this.getGoodsDetail()
          }
        })
        this.data.isPayment = false
      }
    } catch (err) {
      console.error('确认订单-getPayment:', err)
      this.data.isPayment = false
    }
    wx.hideLoading()
  },

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

  async onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    wx.hideShareMenu()
  },
  /****生命周期*****/
  async onShow() {   
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let items = JSON.parse(JSON.stringify(globalData.orderItem))
    items.item.forEach(function(e){
      e.listItem.unit_price = (e.listItem.unit_price / 100).toFixed(2)
    })
    this.setData({
      orderItem: items,
      order_type: globalData.orderItem.order_type ? globalData.orderItem.order_type : 1,
    })
    this.setData({
      // globalData.cc_id存在时，说明已选优惠券
      cc_id: globalData.cc_id?globalData.cc_id:0,
      // 优惠金额格式化
      data_allow_count: 0
    })
    // 获取优惠券列表数据
    await this.getCouponList()
    // 订单数据
    let orderItem = this.data.orderItem
    // 处理工时费用
    orderItem.working_time = orderItem.working_time ? (orderItem.working_time / 100).toFixed(2) : 0
    // 订单总金额
    let total_amount = (orderItem.total_amount/100).toFixed(2)
    // 优惠总金额 
    let couponTotal_amount = (orderItem.total_amount/100 - 0.01).toFixed(2)
    // 合计
    let _order_total = (orderItem.total_amount/100 - this.data.data_allow_count/100).toFixed(2)
    // 展示 - 合计
    let _total_money = (((_order_total)>0?(_order_total):'0.01')*1 + orderItem.working_time*1).toFixed(2)

    // 优惠券金额、实际支付金额、订单数据
    this.setData({
      data_allow_count: this.data.data_allow_count?(this.data.data_allow_count/100).toFixed(2):0,
      order_total: _order_total,
      working_time: orderItem.working_time,
      orderItem: orderItem,
      total_amount: total_amount,
      couponTotal_amount: couponTotal_amount,
      total_money: _total_money,
    })
    wx.hideLoading()
    // 获取随机金额
    this.fetchRandomMoney((this.data.total_money * 100).toFixed(0))
  },
})
