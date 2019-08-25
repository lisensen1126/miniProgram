import { addOrder, payment, myCoupon, spikePayment, groupPayment, groupJoinPayment} from '@/libs/modules/order'
import { groupState } from '@/libs/modules/shopGroup'
import { sendFormId } from '@/utils/formid'

const {showMessage, globalData, cdp } = getApp()

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
    // 订单总金额
    original_amount: 0,
    // 优惠券ID
    cc_id: 0,
    // 实际优惠金额
    couponTotal_amount: 0,
    // 来源普通1  智能保养2
    order_type: 1,
    // 是否包含未上架商品 1不包含   2包含
    is_sale: 1,
    showHome: false,
    is_payment: false, // 防止多次点击确认支付按钮的flag
    is_show_tips: false, // 提示框是否出现 人已满
    is_show_overdue: false, // 提示框是否出现 拼团过期
    // 跳转拼团成功页面需要得参数
    spu_id: '', 
    type: '',
    group_log_id: '',
  },

  // 生命周期
  onLoad() {
    let pages = getCurrentPages();
    if (pages.length === 1) {
      this.setData({
        showHome: true
      })
    }
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    })
    wx.hideShareMenu()
  },

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
      // 优惠金额格式化
      data_allow_count: 0
    })
    this.data.order_type = globalData.orderItem.order_type ? globalData.orderItem.order_type : 1
    this.data.enter_page_date = new Date() / 1 // 进入页面的时间
    this.data.cc_id = globalData.cc_id?globalData.cc_id:0 // globalData.cc_id存在时，说明已选优惠券
    // 获取优惠券列表数据
    if(!this.data.orderItem.offered){
      await this.getCouponList()
    }
    // 订单数据
    let orderItem = this.data.orderItem
    // 订单总金额
    // let total_amount = (orderItem.total_amount/100).toFixed(2)
    // 订单原价
    let original_amount = (orderItem.original_amount/100).toFixed(2)
    // 优惠总金额
    let couponTotal_amount = (orderItem.total_amount/100 - 0.01).toFixed(2)
    // 优惠券金额、实际支付金额、订单数据
    this.setData({
      data_allow_count: this.data.data_allow_count?(this.data.data_allow_count/100).toFixed(2):0,
      order_total: (orderItem.total_amount/100 - this.data.data_allow_count/100).toFixed(2),
      orderItem: orderItem,
      original_amount: original_amount,
      couponTotal_amount: couponTotal_amount,
    })
    wx.hideLoading()
  },

  // formid 收集
  sendFormId,
  //我的优惠券列表
  async getCouponList() {
    let self = this
    let params = {
      total_price: this.data.orderItem.total_amount,
      data: [],
    }
    this.data.orderItem.item.forEach(function (listItem) {
      params.data.push({
        category_ids: listItem.category_id,
        type: listItem.type,
      })
    })
    try {
      const {statusCode, data, message, code} = await myCoupon(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        // 初次进入确认订单页面
        if (!globalData.is_choose_coupon && globalData.cc_id != 0) {
          self.setData({
            data_allow_count: data.max_price,
          })
          this.data.cc_id = self.data.cc_id?self.data.cc_id:data.cc_id
        }
        // 已进入过选择优惠券页面
        if (self.data.cc_id) {
          data.data_allow.forEach(function (item) {
            if(item.cc_id === self.data.cc_id) {
              self.setData({
                data_allow_count: item.discount_amount
              })
            }
          })
        }

        let effectiveTime = data.data_allow
        let InvalidTime = data.data_prohibit
        effectiveTime.forEach(v => {
          let start = new Date(v.start_time * 1000)
          let end = new Date(v.end_time * 1000)
          v.start_time = start.getFullYear() + '/' + (start.getMonth() + 1) + '/' + start.getDate()
          v.end_time = end.getFullYear() + '/' + (end.getMonth() + 1) + '/' + end.getDate()
        })
        InvalidTime.forEach(v => {
          let start = new Date(v.start_time * 1000)
          let end = new Date(v.end_time * 1000)
          v.start_time = start.getFullYear() + '/' + (start.getMonth() + 1) + '/' + start.getDate()
          v.end_time = end.getFullYear() + '/' + (end.getMonth() + 1) + '/' + end.getDate()
        })
        data.data_allow = effectiveTime
        data.data_prohibit = InvalidTime
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

  //跳转我的优惠券列表
  goCouponList(e) {
    // 格式化数据，跳转前置为false
    globalData.is_choose_coupon = false
    wx.navigateTo({
      url: '/pages/coupon/chooseCoupons/chooseCoupons'
    })   
  },

  /****
   * 下单、支付
   * @offered 秒杀1-拼团2-无普通 
   * @group_type 开团1-参团2
   * @is_payment 防多触
   * *****/
  async confirmOrder (e) {
    // 防止多次调起微信支付
    if (this.data.is_payment) {
      return false
    }
    this.data.is_payment = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let session_id = cdp.sessionId() // 获取用户sessionId
    let params = {
      session_id: session_id ? session_id : '',
      payment_channel: 1,
      from_type: this.data.orderItem.from_type || 0, // 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
      from_id: this.data.orderItem.from_id || 0, // 来源id
      item: []
    }
    // 添加拼团秒杀的提交订单 
    if (this.data.orderItem.offered === 1) {
      params.activity_id = parseInt(this.data.orderItem.activity_id)
    } else if (this.data.orderItem.offered === 2) {
      params.activity_id = parseInt(this.data.orderItem.activity_id)
    } else {
      params.cc_id = this.data.cc_id
      params.order_type = this.data.order_type?this.data.order_type:1
      params.purchase_type = globalData.order_source
    }
    if (this.data.orderItem.offered === 1) {
      this.data.orderItem.item.forEach(function (listItem) {
        params.item.push({
          item_id: listItem.item_id,
          quantity: listItem.quantity,
          sku_id: listItem.sku_id?listItem.sku_id:0,
          type: listItem.type?listItem.type:0
        })
      })
    } else if (this.data.orderItem.offered === 2) {
      let spu_id = ''
      let type = ''
      this.data.orderItem.item.forEach(function (listItem) {
        params.item.push({
          item_id: listItem.item_id,
          quantity: listItem.quantity,
          sku_id: listItem.sku_id?listItem.sku_id:0,
          type: listItem.type?listItem.type:0
        })
        type = listItem.type
        spu_id = listItem.item_id
      })
      this.setData({
        type: type,
      })
      this.data.spu_id = spu_id
    } else {
      this.data.orderItem.item.forEach(function (listItem) {
        params.item.push({
          item_id: listItem.item_id,
          quantity: listItem.quantity,
          sku_id: listItem.sku_id,
          shop_car_id: listItem.shop_car_id?listItem.shop_car_id:0,
          type: listItem.type?listItem.type:0
        })
      })
    }
    if (this.data.orderItem.offered === 1) {
      try {
        const {statusCode, data, message, code} = await spikePayment(params)
        this.public(statusCode, data, message, code)
        wx.hideLoading()
      } catch (err) {
        wx.hideLoading()
        console.error('确认订单-confirmOrder:', err)
        this.data.is_payment = false
      }
    } else if(this.data.orderItem.offered === 2) {
      if (this.data.orderItem.group_type === 1) {
        try {
          const {statusCode, data, message, code} = await groupPayment(params)
          this.public(statusCode, data, message, code)
          wx.hideLoading()
        } catch (err) {
          wx.hideLoading()
          console.error('确认订单-confirmOrder:', err)
          this.data.is_payment = false
        }
      } else if (this.data.orderItem.group_type === 2) {
        // 验证是否可参团
        await this.joinDelegation(params)
      }
    } else {
      try {
        const {statusCode, data, message, code} = await addOrder(params)
        this.public(statusCode, data, message, code)
        wx.hideLoading()
      } catch (err) {
        wx.hideLoading()
        console.error('确认订单-confirmOrder:', err)
        this.data.is_payment = false
      }
    }
  },
  // 订单处理公共接口
  public(statusCode, data, message, code){
    if (statusCode === 200 ) {
      if (parseInt(code) === 0) {
        this.data.group_log_id =  parseInt(this.data.orderItem.group_type) === 2 ? this.data.orderItem.activity_id : parseInt(data.group_log_id)
        this.getPayment(data.trade_order_no, data.trade_order_id)
        globalData.cc_id = 0

        // cdp-点击确认支付按钮上报
        // 下单商品数据格式化,因为拼团秒杀只是一件商品或服务，所以productPrice可以同orderTotal
        let choose_products = []
        let self = this
        this.data.orderItem.item.forEach(function (listItem) {
          let itemSon = {
            spuId: listItem.item_id ? parseInt(listItem.item_id) : '',
            skuId: listItem.sku_id ? parseInt(listItem.sku_id) : '',
            productName: listItem.listItem.item_title ? listItem.listItem.item_title : '',
            productPrice: self.data.original_amount ? self.data.original_amount * 100 : '',
            productNumber: listItem.quantity ? listItem.quantity : '',
          }
          choose_products.push(itemSon)
        })
        let customize = {
          orderId: data.trade_order_id ? parseInt(data.trade_order_id) : '',
          orderTotal: this.data.original_amount ? this.data.original_amount * 100 : '',
          finalTotal: this.data.order_total > 0 ? this.data.order_total * 100 : 1,
          products: choose_products,
          coupon: {},
        }  
        
      } else if (parseInt(code) === 10011025) {
        showMessage({
          title: '下单失败',
          content: `订单中的商品/服务已被门店下架`,
        })
        this.data.is_payment = false
      } else {
        showMessage({
          title: '下单失败',
          content: `${message}`,
        })
        this.data.is_payment = false
      }
    } else {
      showMessage({
        title: '下单失败',
        content: `${message}`,
      })
      this.data.is_payment = false
    }
  },
  // 参团验证
  async joinDelegation(params) {
    try {
      const {statusCode, data, message, code} = await groupState({
        group_log_id : this.data.orderItem.activity_id
      })
      if (statusCode === 200) {
        wx.hideLoading()
        if (parseInt(code) === 0) {
          if (parseInt(data.status) === 2) {
            this.setData({
              is_show_tips: true,
            })
            this.data.is_payment = false
            return false
          } else if (parseInt(data.status) === 3) {
            this.setData({
              is_show_overdue: true,
            })
            this.data.is_payment = false
            return false
          } else if (parseInt(data.status) === 1) {
            try {
              const {statusCode, data, message, code} = await groupJoinPayment(params)
              this.public(statusCode, data, message, code)
              wx.hideLoading()
            } catch (err) {
              wx.hideLoading()
              console.error('确认订单-joinDelegation:', err)
              this.data.is_payment = false
            }
          }
        } else {
          wx.hideLoading()
          showMessage({
            title: '下单失败',
            content: message,
          })
          this.setData({
            isPayment: false
          })
        }
      } else {
        showMessage({
          title: '验证失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('确认订单-joinDelegation:', err)
    }
    wx.hideLoading()
  },
  /*****
   * 获取支付配置
   * @trade_order_no 订单号
   * @trade_order_id 订单id
   * */ 
  async getPayment(trade_order_no, trade_order_id) {
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
        // 跳出当前页后终止支付框调起
        let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
        if (current_route.indexOf('groupSpilkeConfirmOrder') === -1){
          return false
        }
        wx.requestPayment({
          ...data.credential,
          success: () => {
            // 普通订单和秒杀商品跳转1 - 拼团-2
            // php参数配置有问题待处理
            if (parseInt(this.data.orderItem.offered) === 2) {
              // 拼团跳转
              wx.redirectTo({
                url: `/pages/spilkeGroup/groupPaySuccess/groupPaySuccess?order_id=${trade_order_id}&group_log_id=${this.data.group_log_id}&spu_id=${this.data.spu_id}&type=${this.data.type}&order_no=${trade_order_no}`,
              })
            } else {
              wx.redirectTo({
                url: `/pages/order/paySuccess/paySuccess?orderNo=${trade_order_no}`,
              })
            }
            this.data.is_payment = false
          },
          fail: () => {
            this.data.is_payment = false
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
        this.data.is_payment = false
      }
    } catch (err) {
      console.error('确认订单-getPayment:', err)
      this.data.is_payment = false
    }
    wx.hideLoading()
  },
  // 关闭拼团提示 - 人满
  couponCancel() {
    this.setData({
      is_show_tips: false
    })
  },
  // 关闭拼团提示 - 失败
  couponCancelOver() {
    this.setData({
      is_show_overdue: false
    })
  },
})
