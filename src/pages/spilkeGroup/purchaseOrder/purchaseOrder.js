import {payment, spikePayment, groupPayment, groupJoinPayment} from '@/libs/modules/order'
import {groupState} from '@/libs/modules/shopGroup'
const { showMessage, globalData } = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		order_item: {},             // 订单相关所有数据
		info: {},                  // 订单详情
    card_id: null,             // 订单ID
    group_status: 1,             // 所参团的状态
    isPayment: false,          // 是否支付中
    topbarHeight: 0,          // 顶部高度
    is_loading: false,          // 顶部高度
	},
  onLoad() {
	  this.setData({
      topbarHeight: globalData.topbarHeight
    })
  },

  // 生命周期
  onShow() {
    let orderItem = JSON.parse(JSON.stringify(globalData.orderItem))
    orderItem.final_amount = (orderItem.final_amount/100).toFixed(2)
    console.log(orderItem)
    this.setData({
      info: orderItem.info,
      order_item: orderItem,
    })
    this.data.card_id = parseInt(orderItem.card_id)
    wx.hideShareMenu()
  },

  // 确认订单
  async confirmOrder() {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res){
      return
    }
	 // 秒杀
    if (parseInt(this.data.order_item.offered) === 1){
      this.createSpikeOrder()
    } else {
      // 拼团
      console.log(this.data.order_item)
      if (parseInt(this.data.order_item.group_type) === 2){
        this.isCanJoinGroup()
      }else if (parseInt(this.data.order_item.group_type) === 1){
        this.createGroupOrder()
      }
    }
  },

  // 秒杀-新增订单
  async createSpikeOrder() {
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.data.isPayment = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      item: [{
        item_id: this.data.info.id,
        quantity: 1,
        type: parseInt(this.data.info.seckill_type),
        sku_id: 0,
      }],
      activity_id: parseInt(this.data.info.seckill_id),
      purchase_type: 1,
      from_type: this.data.order_item.from_type || 0, // 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
      from_id: this.data.order_item.from_id || 0, // 来源id
    }
    try {
      const {statusCode, data, message, code} = await spikePayment(params)
      if (statusCode === 200 ) {
        if (code === 0) {
          this.getPayment(data)
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
    } catch (err) {
      console.error('拼团开团-createOrder', err)
      this.data.isPayment = false
    }
    wx.hideLoading()
  },

  // 开团-新增订单
  async createGroupOrder() {
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.data.isPayment = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      item: [{
        item_id: this.data.info.id,
        quantity: 1,
        type: parseInt(this.data.info.card_type),
        sku_id: 0,
      }],
      activity_id: parseInt(this.data.order_item.group_product_id),
      purchase_type: 1,
    }
    console.log('新增拼团传递参数',params)
    try {
      const {statusCode, data, message, code} = await groupPayment(params)
      if (statusCode === 200 ) {
        if (code === 0) {
          this.getPayment(data)
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
    } catch (err) {
      console.error('拼团开团-createOrder', err)
      this.data.isPayment = false
    }
    wx.hideLoading()
  },

  // 判断是否可团
  async isCanJoinGroup () {
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try{
      const{statusCode, data, code, message} = await groupState({
        group_log_id: this.data.order_item.group_log_id
      })

      if (statusCode === 200) {
        if (parseInt(code) === 0){
          // 当前详情展示的团的状态，1可参团，2已拼满，3拼团时间到
          this.setData({
            group_status: data.status
          })
          if(parseInt(data.status) === 1){
            // 参团确认订单
            this.joinGroupOrder(this.data.order_item.group_log_id)
          }
        } else {
          this.setData({
            err_tip: '拼团失败',
            isShowDefault: true,
          })
          showMessage({
            title: '拼团失败',
            content: message,
          })
        }
      }else{
        this.setData({
          err_tip: '拼团失败',
          isShowDefault: true,
        })
      }
    }catch(err){
      showMessage({
        title: '拼团失败',
        content: message,
      })
      if(err.error === "ERROR") {
        console.error('商品详情-isCanJoinGroup:', err)
      }

    }
    wx.hideLoading()
    this.data.is_loading = false
  },

  // 参团-新增订单
  async joinGroupOrder() {
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.data.isPayment = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      item: [{
        item_id: this.data.info.id,
        quantity: 1,
        type: parseInt(this.data.info.card_type),
        sku_id: 0,
      }],
      activity_id: parseInt(this.data.order_item.group_log_id),
      purchase_type: 1,
    }
    try {
      const {statusCode, data, message, code} = await groupJoinPayment(params)
      if (statusCode === 200 ) {
        if (code === 0) {
          this.getPayment(data)
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
    } catch (err) {
      console.error('拼团参团-joinOrder', err)
      this.data.isPayment = false
    }
    wx.hideLoading()
  },

  // 获取支付配置
  async getPayment(value) {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      trade_order_no: value.trade_order_no
    }
    try {
      const {statusCode, data, message, code} = await payment(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        wx.requestPayment({
          ...data.credential,
          success: () => {
            if (parseInt(this.data.order_item.offered) === 2) {
              // 拼团跳转
              wx.redirectTo({
                url: `/pages/spilkeGroup/groupPaySuccess/groupPaySuccess?order_id=${value.trade_order_id}&group_log_id=${parseInt(this.data.order_item.group_type) === 2?parseInt(this.data.order_item.group_log_id):value.group_log_id}&card_id=${this.data.order_item.card_id}&type=3&order_no=${value.trade_order_no}`,
              })
            } else {
              // 秒杀跳转
              wx.redirectTo({
                url: `/pages/spilkeGroup/purchasePaySuccess/purchasePaySuccess?orderNo=${value.trade_order_no}&orderId=${value.trade_order_id}`,
              })
            }
            this.setData({
              is_payment: false
            })
          },
          fail: () => {
            this.setData({
              is_payment: false
            })
            wx.navigateBack()
          }
        })
      } else {
        showMessage({
          title: '获取订单支付配置失败',
          content: `${message}`,
          resolve: function () {
          }
        })
        this.data.isPayment = false
      }
    } catch (err) {
      console.error('确认订单-getPayment', err)
      this.data.isPayment = false
    }
    wx.hideLoading()
  },

  // 判断用户是否授权
  async getUserRegister() {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return false
    }
    return true
  },
});