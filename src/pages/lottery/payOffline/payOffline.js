const {showMessage, globalData, isRegistered, getAccessId } = getApp()
import {payment, offlinePayApi, myOfflineCouponApi, judgePayCouponApi, offlinePaySuccessApi, randomUserListApi} from '@/libs/modules/order'
import { sendFormId } from '@/utils/formid'
import queryScene from '@/utils/queryScene'
Page({
  data: {
    input_value: '',
    is_show: false,
    cc_id: 0,                  // 优惠券id
    data_allow_count: null,    // 可以使用的优惠券金额
    mycoupon_list: {
      max_price: 0,
      data_allow_count: 0
    },
    actual_amount: 0,          // 实付金额
    top_height: 64,
    use_coupon: false,         // 是否可以使用优惠券
    page_init: false,
    allow_coupon: false,       // 是否有可用的优惠券
    limit_coupon: false,       // 今日优惠是否上限
    set_inter: '',
    resquest_num: 0,   
    page_show: true, 
    pay_success: false,  
    is_hide: false,            // 是否进入后台     
    wx_name: [],               // 滚动消息列表
    indicator_dots: false,
    autoplay: true,
    interval: 3000,
    circular: true,
    is_random: false,           // 是否展示立减金弹框
    random_money: 0,           // 立减金额
    trade_order_no: '',        // 订单编号
    timer: '',                 // 定时器
  },

  onLoad(query) {
    // 如果是扫码进入
    if(query.scene) {
      const scene = decodeURIComponent(query.scene)
      // 如果scene值使用 ',' 拼接
      if (scene.indexOf(',') > 0) {
        let obj = queryScene(scene)
        this.data.obj = obj
        wx.setStorageSync('current_store_id', obj.scene.store_id)
      } else {
        const store = scene.split('=')
        wx.setStorageSync('current_store_id', store[1])
      }
    }
    this.setData({
      top_height: globalData.topbarHeight,
      showHome: false,
    })
  },

  async onShow() {
    // is_registered   1： 注册， 2.未判断  0.未注册，   is_registered=2时，调用isRegistered接口判断身份
    // 用户有可能在小程序商城逛，然后扫码支付，is_registered可能已经判断过不等于2
    if (globalData.is_registered === 2) {
      wx.showLoading({title: '加载中...'})
      let status = await isRegistered()
      getAccessId(this.data.obj)
      wx.hideLoading()
      // 网络异常情况
      if (!status) {
        showMessage({
          title: '温馨提示',
          content: '系统异常，请重试！',
          confirmText: '确定'
        })
      }
    }

    // 赋值门店名称
    this.setData({title: globalData.userInfo.store_name})
    
    // 用户若是没有注册则去注册页面
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
      return false
    }

    

    // 获取随机立减金额88元的人
    this.fetchUserList()
    // 判断是否可以使用优惠券
    await this.judgeCoupon()

    // 从选择优惠券页面返回来
    if(this.data.input_value != '' && this.data.is_show && globalData.cc_id && globalData.coupon_offline.actual_discount_amount) {
      this.setData({
        actual_amount: (this.data.input_value - globalData.coupon_offline.actual_discount_amount / 100).toFixed(2),
        data_allow_count: (globalData.coupon_offline.actual_discount_amount / 100).toFixed(2)
      })
    }
    if(!globalData.cc_id && this.data.input_value != '' && !this.data.pay_success) {
      this.setData({
        actual_amount: (this.data.input_value - 0).toFixed(2),
        data_allow_count: '0.00'
      })
    }
    if(this.data.pay_success) {
      wx.showLoading({title: '加载中...'})
    }
  },

  // formid 收集
  sendFormId,

  // inputChange
  moneyChange(event) {
    let str = event.detail.value.replace(/￥/, '')
    let regStrs = [
      ['[^\\d\\.]+$', ''],
      ['\\.(\\d?)\\.+', '.$1'],
      ['^(\\d+\\.\\d{2}).+', '$1']
    ];
    for(let i=0; i < regStrs.length; i++){
      let reg = new RegExp(regStrs[i][0]);
      str = str.replace(reg, regStrs[i][1]);
    }
    if(str[0] == '.') str = '0.'
    if(str[0] == 0 && str[1] >= 0) str = 0
    this.setData({
      input_value: str,
      actual_amount: str
    })
  },

  // 输入框失去焦点
  getCoupon() {
    if(globalData.is_registered == 0) return     // 没有注册，不需要请求优惠券信息，不执行以下代码
    if(this.data.input_value - 0 > 200000) {
      showMessage({
        title: '温馨提示',
        content: '单日最高支付金额为200000.00元',
        confirmText: '确定',
      })
      return
    }
    this.data.cc_id = 0
    this.setData({data_allow_count: 0})
    globalData.cc_id = null
    globalData.is_choose_coupon = null
    // 金额大于0时，请求优惠券列表，获取最大优惠金额
    if(this.data.input_value > 0) {
      // 这家门店是否配置了you
      if(this.data.use_coupon) this.getCouponList()
      this.setData({
        is_show: true
      })
    }
  },

  // 获取优惠券
  async getCouponList() {
    wx.showLoading({title: '加载中...', mask: true})
    let self = this
    this.setData({
      limit_coupon: false
    })
    try {
      const {statusCode, data, message, code} = await myOfflineCouponApi({
        total_price: ((this.data.input_value - 0) * 100).toFixed(0),
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        if (data.length === 0) {
          self.setData({
            actual_amount: this.data.input_value,
            allow_coupon: true,
          })
          return
        }
        // 初次进入确认订单页面
        if (!globalData.is_choose_coupon && globalData.cc_id != 0) {
          self.setData({
            data_allow_count: (data.max_price / 100).toFixed(2),
            cc_id: self.data.cc_id ? self.data.cc_id : data.cc_id,
            actual_amount: (self.data.input_value - data.max_price / 100).toFixed(2),
            mycoupon_list: data,
            allow_coupon: false,
          })
        }
        // 已进入过选择优惠券页面
        if (self.data.cc_id) {
          let temp_obj = []
          temp_obj = data.data_allow.filter(item => item.cc_id === self.data.cc_id)
          self.setData({
            data_allow_count: (temp_obj[0].actual_discount_amount / 100).toFixed(2),
            actual_amount: (self.data.input_value - self.data.data_allow_count).toFixed(2),
            mycoupon_list: data,
            allow_coupon: false,
          })
        }
        globalData.myCouponList = data
        globalData.cc_id = self.data.cc_id
      } else if(statusCode === 200 && code === 668800) {
        wx.hideLoading()
        this.setData({
          limit_coupon: true,
          mycoupon_list: {
            data_allow_count: 0
          }
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取我的优惠券列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('确认订单-getCouponList:', err)
    }
  },

  // 选择优惠券
  goCouponList(e) {
    if(!this.data.cc_id) return
    globalData.is_choose_coupon = false
    this.data.is_hide = false
    // this.setData({is_hide: false})
    wx.navigateTo({
      url: '/pages/coupon/chooseCoupons/chooseCoupons'
    })    
  },

  // 线下买单
  async confirmOrder() {
    wx.showLoading({title: '加载中...',mask: true})
    try {
      const {statusCode, data, message, code} = await offlinePayApi({
        total_price: ((this.data.input_value - 0) * 100).toFixed(0),
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
      const {statusCode, data, message, code} = await payment({
        trade_order_no: this.data.trade_order_no,
      })
      if (statusCode === 200 && parseInt(code) === 0) {
        wx.hideLoading()
        wx.requestPayment({
          ...data.credential,
          success: () => {
            globalData.cc_id = null 
            globalData.is_choose_coupon = null
            self.data.pay_success = true
            // self.setData({pay_success: true})
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
            if (self.data.use_coupon && info.errMsg && info.errMsg == 'requestPayment:fail cancel') {
              globalData.cc_id = null 
              globalData.is_choose_coupon = null
              // self.setData({cc_id: 0})
              self.data.cc_id = 0
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

  // 线下买单是否可以使用优惠券
  async judgeCoupon() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await judgePayCouponApi()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        this.data.page_init = true
        this.setData({
          use_coupon: data.is_open_coupon == 1 ? true : false,
          title: data.store_name
        })
      } else {
        wx.hideLoading()
        this.setData({
          use_coupon: false,
        })
        this.data.page_init = true
      }
    } catch (err) {
      wx.hideLoading()
      console.error('线下买单是否可以使用优惠券-judgeCoupon:', err)
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
        // this.setData({resquest_num: this.data.resquest_num + 1 })
        this.data.resquest_num = this.data.resquest_num + 1
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

  // 获取88元中奖人员列表
  async fetchUserList() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await randomUserListApi()
      if (statusCode === 200 && code === 0) {
        this.data.page_init = true
        wx.hideLoading()
        this.setData({
          wx_name: data,
        })
      } else {
        wx.hideLoading()
        console.log(message)
      }
    } catch (err) {
      wx.hideLoading()
      console.error('获取88元中奖人员列表-fetchUserList:', err)
    }
  },

  // 阻止滑动
  forbidMove() {
    return false
  },

  // 页面卸载时触发的生命周期
  onUnload() {
    clearTimeout(this.data.timer)
  },
});
