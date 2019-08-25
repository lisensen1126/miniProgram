import {payment, offlinePayApi, myOfflineCouponApi , quickOrderDetailApi, offlinePaySuccessApi} from '@/libs/modules/order'
const {showMessage, globalData, isRegistered, queryURL, getAccessId} = getApp()
import { sendFormId } from '@/utils/formid'
import queryScene from '@/utils/queryScene'
Page({
  data: {
    top_height: 0,
    cc_id: 0,                 // 优惠券id
    order_info: {},           // 订单信息
    pay_success: false,       // 是否支付成功
    data_allow_count: null,   // 可以使用的优惠券金额
    coupon_list: {
      max_price: 0,
      data_allow_count:0
    },
    actual_payment: 0,        // 实付金额
    page_init: false,
    resquest_num: 0,
    order_id: 0,
    is_random: false,           // 是否展示立减金弹框
    random_money: 0,            // 立减金额
    trade_order_no: '',         // 订单编号
    timer: '',                  // 定时器
  },

  async onLoad(query) {
    // 如果是扫码进入
    if(query.scene) {
      // 解码二维码的参数 
      const scene = decodeURIComponent(query.scene)
      // 如果scene值使用 ',' 拼接
      if (scene.indexOf(',') > 0) {
        globalData.cc_id = undefined
        globalData.myCouponList = null
        let obj = queryScene(scene)
        this.data.order_id = obj.scene.quick_order_id
        this.data.obj = obj
        wx.setStorageSync('current_store_id', obj.scene.store_id)
        wx.setStorageSync('quick_order_id', this.data.order_id)
      } else {
        globalData.cc_id = undefined
        globalData.myCouponList = null
        const scene = '?' + decodeURIComponent(query.scene)
        let obj = queryURL(scene)
        this.data.order_id = obj.qo
        wx.setStorageSync('current_store_id', obj.s)
        wx.setStorageSync('quick_order_id', this.data.order_id)
      }
  }
  this.setData({
    top_height: globalData.topbarHeight,
  })
  wx.hideShareMenu()
  },

  async onShow() {
    // 是否注册，没注册跳转注册页面
    if (globalData.is_registered === 2) {
      await isRegistered()
      getAccessId(this.data.obj)
      if (globalData.is_registered !== 1) {
        wx.navigateTo({
          url: '/pages/register/registerPhone/registerPhone',
        })
        return
      }
    }
    if(globalData.is_registered == 0) {
      showMessage({
        title: '温馨提示',
        content: '为保障您的支付安全，推荐您先登录',
        confirmText: '去登录',
        resolve: ()=>{
          wx.navigateTo({
            url: '/pages/register/registerPhone/registerPhone',
          })
        }
      })
      return
    }
    await this.fetchOrderDetail()
    // 扫码进来请求优惠券信息，然后存储在globalData中，从注册页面进入就不在请求
    if(globalData.cc_id == undefined) {
      await this.getCouponList()
    }
    if(globalData.cc_id != undefined) {
      let self = this
      if(globalData.cc_id == 0){
        this.setData({
          data_allow_count: 0,
          actual_payment: self.data.order_info.total_amount
        })
        return
      }
      this.data.coupon_list.data_allow.forEach(item=> {
        if(item.cc_id == globalData.cc_id) {
          self.data.cc_id = globalData.cc_id
          self.setData({
            // cc_id: globalData.cc_id,
            data_allow_count: item.actual_discount_amount,
            actual_payment: (self.data.order_info.total_amount - item.actual_discount_amount).toFixed(2)
          })
        }
      })
    }
    if(this.data.pay_success) {
      wx.showLoading({title: '加载中...'})
    }
  },

  // formid 收集
  sendFormId,

  // 获取订单详细信息
  async fetchOrderDetail() {
    wx.showLoading({title: '加载中...',mask: true})
    try {
      const {statusCode, data, message, code} = await quickOrderDetailApi({
        quick_order_id: this.data.order_id ? this.data.order_id : wx.getStorageSync('quick_order_id')
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        this.setData({
          order_info: data,
          actual_payment: data.total_amount,
          page_init: true,
        })
      }else {
        wx.hideLoading()
        showMessage({title: '错误',content: message})
      }
    } catch (err) {
      wx.hideLoading()
      console.error('订单详情-fetchDetail:', err)
    }
  },

  // 获取优惠券
  async getCouponList() {
    let self = this
    wx.showLoading({title: '加载中...', mask: true})
    try {
      const {statusCode, data, message, code} = await myOfflineCouponApi({
        total_price: this.data.order_info.total_amount,
        quick_order_id: this.data.order_id ? this.data.order_id : wx.getStorageSync('quick_order_id'),
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        if (data.length === 0) return
        // 更新优惠券列表数据
        globalData.myCouponList = data
        // 更新选中的优惠券ID
        globalData.cc_id = data.cc_id
        // 更新页面数据
        self.data.cc_id = data.cc_id
        self.setData({
          // cc_id: data.cc_id,
          coupon_list: data,
          data_allow_count: data.max_price,
          actual_payment: (this.data.order_info.total_amount - data.max_price).toFixed(2),
          page_init: true,
        })
      } else {
        wx.hideLoading()
        showMessage({ title: '获取我的优惠券列表失败',content: `${message}`})
      }
    } catch (err) {
      wx.hideLoading()
      console.error('确认订单-getCouponList:', err)
    }
  },

  // 选择优惠券
  goCouponList() {
    if(this.data.coupon_list.data_allow_count == 0) return
    wx.navigateTo({
      url: '/pages/coupon/chooseCoupons/chooseCoupons'
    })    
  },

  // 线下买单
  async confirmOrder() {
    wx.showLoading({title: '加载中...',mask: true})
    try {
      const {statusCode, data, message, code} = await offlinePayApi({
        quick_order_id: this.data.order_id,
        cc_id: globalData.cc_id ? globalData.cc_id : 0,
      })
      if (statusCode === 200 && code === 0) {
        // 将订单编号存储起来
        this.data.trade_order_no = data.trade_order_no
        // this.setData({trade_order_no: data.trade_order_no})
        // random_coupon_id = 0时，不能使用随机立减金额，直接走支付, !=0时弹出立减金弹框
        if (data.random_coupon_id == 0) {
          this.getPayment(data.trade_order_no)
        } else {
          this.setData({is_random: true, random_money: data.random_coupon_price})
        }
      } else {
        showMessage({
          title: '买单失败',
          content: message,
        })
      }
    } catch (err) {
      console.error('线下买单-confirmOrder:', err)
    }
    wx.hideLoading()
  },

  // 获取支付配置
  async getPayment() {
    let self = this
    if(this.data.is_random) this.setData({is_random: false})    // 关闭立减金弹框
    wx.showLoading({title: '加载中...'})
    try {
      const {statusCode, data, message, code} = await payment({trade_order_no: this.data.trade_order_no})
      if (statusCode === 200 && parseInt(code) === 0) {
        wx.hideLoading()
        wx.requestPayment({
          ...data.credential,
          success: () => {
            globalData.cc_id = null 
            globalData.is_choose_coupon = null
            // self.setData({pay_success: true})
            self.data.pay_success = true
            self.fetchDetail(this.data.trade_order_no)
          },
          fail: (err) => {
            if(err.errMsg == 'requestPayment:fail cancel') return
            showMessage({
              title: '支付失败',
              content: err.errMsg,
            })
          },
          complete: (info) => {
            if (info.errMsg && info.errMsg == 'requestPayment:fail cancel') {
              self.data.cc_id = 0
              // self.setData({cc_id: 0})
              self.getCouponList()
            }
          }
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取订单支付配置失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('确认订单-getPayment:', err)
    }
  },

  // 获取订单详情
  async fetchDetail(order) {
    let self = this
    try {
      const {statusCode, data, message, code} = await offlinePaySuccessApi({
        trade_order_no: order
      })
      if (statusCode === 200 && code === 0) {
        this.data.resquest_num = this.data.resquest_num + 1
        // this.setData({resquest_num: this.data.resquest_num + 1 })
        if(this.data.resquest_num == 6) {
          wx.hideLoading()
          showMessage({
            title: '订单状态异常',
            content: '请稍后在订单列表查看确认',
            resolve: ()=>{
              wx.redirectTo({
                url: `/pages/lottery/paySuccess/paySuccess?orderNo=${order}`,
              })
            }
          })
        }
        if(data.status == 3) {
          wx.hideLoading()
          wx.redirectTo({
            url: `/pages/lottery/paySuccess/paySuccess?orderNo=${order}`,
          })
        } else {
          this.data.timer = setTimeout(()=> {
            self.fetchDetail(order)
          }, 1000)
        }
      }else {
        wx.hideLoading()
        showMessage({
          title: '错误',
          content: message,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('订单详情-fetchDetail:', err)
    }
  },

  // 页面卸载时触发的生命周期
  onUnload() {
    clearTimeout(this.data.timer)
  },
})
