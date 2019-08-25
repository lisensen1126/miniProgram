import {
  getCardGoodsList
} from '@/libs/modules/mycard'
import {
  groupCardDetail,
  groupJoinData,
  groupState
} from '@/libs/modules/shopGroup'
import {getParamsApi} from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
const {
  showMessage,
  isRegistered,
  globalData,
  queryURL,
} = getApp()
// 创建页面实例对象
Page({
  data: {
    info: null,                         // 养护卡详情
    group_join_data: [],              // 可参团列表
    card_id: null,                      // 养护卡ID
    list: [],                           // 指定商品
    page_show: false,                   // 控制渲染页面
    activation_length: 0,               // 免激活项目数量
    is_show_default: false,             // 展示缺省
    showHome: false,                    // 展示首页
    err_tip: '获取卡详情失败',            // 缺省文案
    num_array: ['两', '三', '四', '五'],  // 拼团人数
    scene: true,
    go_share: false,
  },

  // 生命周期函数--监听页面加载
  async onLoad(option) {// 判断是否扫码计入
    console.log(option)
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      let obj = queryURL(scene)
      if (obj.s) wx.setStorageSync('current_store_id', obj.s)
      await this.getParams(obj.o)
    } else {
      this.setData({
        topbarHeight: globalData.topbarHeight,
      })
      this.data.group_product_id = option.group_product_id
      this.data.card_id = option.card_id
      this.data.scene = false
      let pages = getCurrentPages();
      if (pages.length === 1) {
        this.setData({
          showHome: true
        })
      }
    }
    if (this.data.scene) {
      // 请求数据
      this.getCardDetail()
      this.getDataInfo()
      this.getGroupDetail()
    }
    // 判断是否判断过注册
    if (globalData.is_registered === 2){
      await isRegistered()
    }
  },

  onShow() {
    if (this.data.group_product_id) {
      // 请求数据
      this.getCardDetail()
      this.getDataInfo()
      this.getGroupDetail()
    }
  },
  async getParams (id) {
    try {
      const {statusCode, data, message, code} = await getParamsApi({
        relation_id: id,
      })
      wx.hideLoading()
      if (statusCode === 200) {
        let option = JSON.parse(data.scene)
        this.setData({
          topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
          showHome: true,
        })
        this.data.group_product_id = option.group_product_id - 0
        this.data.card_id = option.card_id - 0
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
  },
  // 显示分享弹框
  goShare () {
    console.log(1111)
    this.setData({
      go_share: true,
    })
  },
  closeShare () {
    this.setData({
      go_share: false,
    })
  },
  // 去海报分享
  goPoster () {
    this.closeShare()
    let self = this
    let info = {
      card_id: self.data.card_id,
      name: self.data.info.name,
      price: self.data.info.group_price,
      origin_price: self.data.info.origin_price,
      image_url: self.data.info.image_url,
      group_product_id: self.data.group_product_id,
      num: self.data.info.group_num,
    }
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=5&group=1',
    })
  },
  // 判断用户是否注册
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
  // formid 收集
  sendFormId,
  // 获取参团数据
  async getGroupDetail () {
    this.setData({
      is_loading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 拼团商品ID
    let params = {
      group_product_id: this.data.group_product_id
    }
    try{
      const{statusCode, data, code, message} = await groupJoinData(params)
      if(statusCode === 200) {
        this.setData({
          group_join_data: data
        })
      }else{
        showMessage({
          title: '获取拼团数据失败',
          content: message,
        })
      }
    }catch(err){
      if(err.error === "ERROR") {
        console.error('服务详情-getGroupDetail:', err)
      }
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  // 获取购卡详情
  async getCardDetail() {
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
      } = await groupCardDetail({
        id: this.data.card_id,
      })
      if (statusCode === 200) {
        if (code === 0) {
          // 拼团价
          data.group_price = (data.group_price / 100).toFixed(2)
          // 售价
          data.price = (data.price / 100).toFixed(2)
          // 门市价
          data.origin_price = (data.origin_price / 100).toFixed(2)
          // 倒计时的状态
          let activation = 0
          // 卡类型 1养护卡 2次卡
          if (data.type === 1) {
            activation = data.list.filter(element => element.type === 2).length
          }
          this.setData({
            page_show: true,
            info: data,
            activation_length: activation
          })
        } else {
          // 缺省
          this.setData({
            page_show: true,
            is_show_default: true,
            err_tip: message
          })
        }
      } else {
        // 缺省
        this.setData({
          page_show: true,
          is_show_default: true,
          err_tip: message
        })
        showMessage({
          title: '获取购卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      this.setData({
        page_show: true
      })
      console.error('购卡详情-getCardDetail', err)
    }
    wx.hideLoading()
  },

  // 获取卡指定商品列表
  async getDataInfo() {
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
      } = await getCardGoodsList({
        upkeep_info_id: this.data.card_id
      })
      if (statusCode === 200) {
        if (code === 0){
          this.setData({
            list: data
          })
        }
      } else {
        showMessage({
          title: '获取养护卡关联商品失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购卡详情-getDataInfo', err)
    }
    wx.hideLoading()
  },

  // 跳转指定商品列表
  productMore() {
    wx.navigateTo({
      url: `/pages/card/relationGoods/relationGoods?id=${this.data.card_id}&type=1`
    })
  },

  // 单人购买
  async createOrder() {
    // 判断用户身份，未注册跳转注册授权
    if (globalData.is_registered === 1){
      wx.navigateTo({
        url: `/pages/card/makeSureOrder/makeSureOrder?card_id=${this.data.card_id}&giving=1`
      })
    } else {
      await this.getUserRegister()
    }
  },

  // 判断是否可团
  async isCanJoinGroup () {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res || this.data.show_sku_err){
      return
    }

    this.setData({
      is_loading: true,
      is_join: false, // 是否已经参与该团
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    this.setData({
      group_log_id: this.data.group_join_data.group_log_id
    })
    try{
      const{statusCode, data, code, message} = await groupState({
        group_log_id: this.data.group_join_data.group_log_id
      })

      if (statusCode === 200) {
        if (parseInt(code) === 0){
          // 当前详情展示的团的状态，1可参团，2已拼满，3拼团时间到
          this.setData({
            group_status: data.status
          })
          if(parseInt(data.status) === 1){
            // 参团确认订单
            this.createGroupOrder(this.data.group_join_data.group_log_id)
          }
        } else if (parseInt(code) === 600769){
          this.setData({
            is_join: true
          })
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
    this.setData({
      is_loading: false,
    })
  },

  /**
   * 立即开团、参团下单
   * @param group_log_id 参团状态group_log_id存在值类型number，开团group_log_id值为event对象：不使用
   * @returns {Promise<void>}
   */
  async createGroupOrder(group_log_id) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res){
      return
    }
    // 0未注册   1已注册
    if (await this.getUserRegister() === false){
      return
    }
    let activity_id = 0
    let group_type  = 1
    if (typeof(group_log_id) == 'number'){
      activity_id = parseInt(group_log_id)
      group_type = 2
    } else {
      activity_id = parseInt(this.data.group_product_id)
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      final_amount: this.data.info.group_price*100,   // 订单总价
      active_price: this.data.info.group_price,   // 订单总价
      card_id: this.data.card_id,                     // 卡ID
      offered: 2,                                     // 类型：秒杀1 拼团2
      group_type: group_type,                         // 拼团类型：开团group_type=1、参团group_type=2
      info: this.data.info                            // 订单详情
    }
    if (group_type === 1) {
      params.group_product_id = activity_id
    } else if(group_type === 2){
      params.group_log_id = activity_id
    }
    globalData.orderItem = null
    globalData.orderItem = params
    // 海报图片
    let poster_info = {
      name: this.data.info.name,
      num: this.data.info.group_num,
      origin_price: this.data.info.origin_price,
      price: this.data.info.group_price,
      image_url: this.data.info.image_url,
    }
    wx.setStorageSync('poster-info', poster_info)
    // 确认订单
    wx.navigateTo({
      url: `/pages/spilkeGroup/purchaseOrder/purchaseOrder`,
    })
  },

  // 页面分享设置
  onShareAppMessage() {
    let url = 'pages/spilkeGroup/groupPurchaseDetail/groupPurchaseDetail?card_id='+this.data.card_id+'&group_product_id='+this.data.group_product_id
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    return {
      title: `${this.data.info.group_num}人拼仅需${this.data.info.group_price}元，${this.data.info.name}`,
      path: url,
    };
  },
});