import { groupServiceDetail, groupState, groupJoinData} from '@/libs/modules/shopGroup'

// 获取全局应用程序实例对象
const {showMessage, isRegistered, getIdentity, globalData, queryURL } = getApp()
import {getParamsApi} from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    goodsInfo: {}, // 服务详情
    group_join_data: {},// 可参团信息
    quantity: 1,// 购买数量
    pageShow: false, // 是否渲染页面
    showHome: false, // 展示回首页
    isShowDefault: false,// 是否展示缺省页面
    err_tip: '获取服务详情失败', // 缺省文案
    err_icon: 'nosearch', // 缺省icon
    num_array: ['两', '三', '四', '五'],
    group_log_id: 0, // 所参团的ID
    group_status: 1, // 所参团初始状态 拼团中：1
    cartCover: false, // sku浮层
    go_share: false,
  },
  // formid 收集
  sendFormId,
  // 生命周期函数--监听页面加载
  async onLoad(option) {
    // 判断是否扫码计入
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      let obj = queryURL(scene)
      if (obj.s) wx.setStorageSync('current_store_id', obj.s)
      await this.getParams(obj.o)
    } else {
      let pages = getCurrentPages();
      this.setData({
        topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
        spu_id: option.spu_id,
        // 拼团商品主键ID
        group_product_id: option.group_product_id,
        showHome: parseInt(option.share) === 1 ? true : false,
      })
      if (pages.length === 1) {
        this.setData({
          showHome: true
        })
      }
    }
    // 判断是否判断过注册
    if (globalData.is_registered === 2){
      await isRegistered()
    }
  },

  async onShow() {
    if (this.data.group_product_id) {
      // 进入页面的时间
      this.setData({
        enter_page_date: new Date() / 1
      })
      // 先获取身份，在请求服务详情
      if(parseInt(globalData.isRegistered) === 0) {
        wx.showLoading({
          title: '加载中...',
          mask: true,
        })
        await getIdentity()
        this.getServiceDetail()
        this.getGroupDetail()
      } else {
        this.getServiceDetail()
        this.getGroupDetail()
      }
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
          spu_id: option.spu_id - 0,
          group_product_id: option.group_product_id - 0,
          showHome: true,
        })
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
      num: self.data.goodsInfo.num,
      spu_id: self.data.spu_id,
      group_product_id: self.data.group_product_id,
      name: self.data.goodsInfo.goods_name,
      origin_price: self.data.goodsInfo.goods_price,
      price: self.data.goodsInfo.group_price,
      image_url: self.data.goodsInfo.goods_imgs[0],
    }
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=1&group=1',
    })
  },
  // 服务详情
  async getServiceDetail () {
    let self = this
    this.setData({
      is_loading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
    }
    try {
      const {statusCode, data, message, code} = await groupServiceDetail(params)
      wx.hideLoading()
      let err_code_arr = [30306, 10011021, 10011022, 10011023]
      self.setData({
        pageShow: true
      })
      if (statusCode === 200) {
        if(parseInt(code) === 0) {
          // 已下架商品不展示页面，确定返回上一页
          if (parseInt(data.is_sale) === 2) {
            showMessage({
              title: '查看未成功',
              content: `很抱歉，当前服务门店已下架`,
            })
            self.setData({
              err_tip: '服务已下架',
              err_icon: 'goodsdown',
              isShowDefault: true,
            })
            return false
          }
          // 格式化服务金额(接口返回的数据单位：分)
          data.goods_price = (data.goods_price/100).toFixed(2)
          data.group_price = (data.group_price/100).toFixed(2)
          // 展示页面数据
          self.setData({
            is_loading: false,
            goodsInfo: data,
            pageShow: true
          })        
        } else if (parseInt(code) === 10011025) {
          showMessage({
            title: '获取服务详情失败',
            content: `服务已下架`,
          })
          self.setData({
            err_tip: '服务已下架',
            err_icon: 'goodsdown',
            isShowDefault: true,
          })
        } else if (parseInt(code) === 10011022) {
          showMessage({
            title: '获取服务详情失败',
            content: `服务已下架`,
          })
          self.setData({
            err_tip: '服务已下架',
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        } else if (parseInt(code) === 10013001) {
          this.setData({
            err_tip: message,
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }else {
          showMessage({
            title: '获取服务详情失败',
            content: `${message}`,
          })
          self.setData({
            err_tip: '获取服务详情失败',
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }
      } else {
        if (err_code_arr.indexOf(code) != -1) {
          self.setData({
            isShowDefault: true,
          })
        }
        showMessage({
          title: '获取服务详情失败',
          content: `${message}`,
        })
        self.setData({
          err_tip: '获取服务详情失败',
          err_icon: 'nogoods',
          isShowDefault: true,
        })
      }
    } catch (err) {
      console.error('服务详情-getServiceDetail:', err)
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

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

  /**
   * 修改商品、服务数量
   * @param {Object} e->event对象
   * **/
  changeItemNum(e) {
    if (e.currentTarget.dataset.number<0 && this.data.quantity<=1) {
      this.setData({
        quantity: 1,
      })
      return false
    }
    this.setData({
      quantity: this.data.quantity+parseInt(e.currentTarget.dataset.number),
    })
  },

  // 关闭弹层
  closeCartCover() {
    this.setData({
      cartCover: !this.data.cartCover
    })
  },

  // 判断是否可团
  async isCanJoinGroup (e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res || this.data.show_sku_err){
      return
    }
    this.setData({
      is_loading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    this.data.group_log_id = this.data.group_join_data.group_log_id
    try{
      const{statusCode, data, code, message} = await groupState({
        group_log_id: this.data.group_join_data.group_log_id
      })
      if(statusCode === 200) {
        if (code === 0){
          // 当前详情展示的团的状态，1可参团，2已拼满，3拼团时间到
          this.setData({
            group_status: data.status
          })
          if(parseInt(data.status) === 1){
            // 参团确认订单
            this.createGroupOrder(this.data.group_join_data.group_log_id)
          }
        } else {
          showMessage({
            title: '拼团失败',
            content: message,
          })
        }
      }else{
        showMessage({
          title: '拼团失败',
          content: message,
        })
      }
    }catch(err){
      this.setData({
        err_tip: '拼团失败',
        isShowDefault: true,
      })
      console.error('服务详情-isCanJoinGroup:', err)
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  // 立即下单
  async createOrder(e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res){
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let listItem = {
      image_url: this.data.goodsInfo.goods_imgs[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.goodsInfo.goods_price*100,
      category_id: this.data.goodsInfo.category_id,       // 获取可使用优惠券所需参数
      biz_product_id: this.data.goodsInfo.product_id,     // 获取可使用优惠券所需参数
    }
    let params = {
      payment_channel: 1,
      total_amount: this.data.goodsInfo.goods_price*100*this.data.quantity,
      final_amount: this.data.goodsInfo.goods_price*100*this.data.quantity,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        quantity: this.data.quantity,
        unit_price: this.data.goodsInfo.goods_price*100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 2
      }]
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    // 确认订单
    wx.navigateTo({
      url: `/pages/order/confirmOrder/confirmOrder`,
    })
  },

  /**
   * 立即开团、参团下单
   * @param group_log_id 参团状态group_log_id存在值类型number，开团group_log_id值为event对象：不使用
   * @returns {Promise<void>}
   */
  async createGroupOrder(group_log_id) {
    let activity_id = 0
    let group_type  = 1
    if (typeof(group_log_id) == 'number'){
      activity_id = group_log_id
      group_type = 2
    } else {
      activity_id = this.data.group_product_id      
    }
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res){
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let listItem = {
      image_url: this.data.goodsInfo.goods_imgs[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.goodsInfo.group_price*100,
      group_num: this.data.goodsInfo.num,
      origin_price: this.data.goodsInfo.origin_price,
      name: this.data.goodsInfo.goods_name,
    }
    let params = {
      payment_channel: 1,
      total_amount: this.data.goodsInfo.group_price*100*this.data.quantity,
      final_amount: this.data.goodsInfo.group_price*100*this.data.quantity,
      offered: 2,
      // 拼团类型：开团group_type=1、参团group_type=2
      group_type: group_type,
      // 拼团类型：开团 activity_id：拼团商品主键ID、参团 activity_id所参团的group_log_id
      activity_id: activity_id,
      original_amount: this.data.goodsInfo.goods_price * 100 * this.data.quantity,
      type: 2,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        quantity: this.data.quantity,
        unit_price: this.data.goodsInfo.group_price*100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 2
      }]
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    // 海报图片
    let poster_info = {
      name: this.data.goodsInfo.goods_name,
      num: this.data.goodsInfo.num,
      origin_price: this.data.goodsInfo.goods_price,
      price: this.data.goodsInfo.group_price,
      image_url: this.data.goodsInfo.goods_imgs[0],
    }
    wx.setStorageSync('poster-info', poster_info)
    // 确认订单
    wx.navigateTo({
      url: `/pages/spilkeGroup/groupSpilkeConfirmOrder/groupSpilkeConfirmOrder`,
    })
  },

  // 拼团结束、已满，刷新数据
  refreshDetail(){
    this.setData({
      group_status: 1,
      cartCover: false
    })
    this.getGroupDetail()
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

  // 页面分享设置
  onShareAppMessage() {
    let url = 'pages/spilkeGroup/groupServiceDetail/groupServiceDetail?spu_id='+this.data.spu_id+'&group_product_id='+this.data.group_product_id+'&share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    return {
      title: `${this.data.goodsInfo.num}人拼仅需${this.data.goodsInfo.group_price}元，${this.data.goodsInfo.goods_name}`,
      path: url,
      success: function() {
        // self.shareHasGift()
      }
    };
  },
});
