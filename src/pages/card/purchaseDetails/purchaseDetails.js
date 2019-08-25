import {
  getCardCenterDetailApi,
  getCardGoodsList,
} from '@/libs/modules/mycard'
import {getParamsApi} from '@/libs/modules/common'
import {getCoupon} from '@/libs/modules/coupon'
import {getUpkeepCouponList} from '@/libs/modules/shopMall'
// 解码二维码scene
import queryScene from '@/utils/queryScene'
import { sendFormId } from '@/utils/formid'

const {
  showMessage,
  isRegistered,
  globalData,
  queryURL,
  getAccessId,
} = getApp()
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    info: {},
    card_id: null,
    phone: '',
    list: [],
    showPhone: false,
    isinitiated: false,
    activation_length: 0,
    is_show_default: false,
    couponCover: false,
    isRequestCoupon: true, // 是否第一次查询过优惠列表
    received_list: [], // 已领取优惠券
    un_receive_list: [], // 未领取优惠券
    go_share: false,
    access_id: null,
  },

  async onLoad (option) {
    // 判断是否扫码计入
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      if (scene.indexOf('?') !== -1) {
        let obj = queryURL(scene)
        if (obj.s) wx.setStorageSync('current_store_id', obj.s)
        // 如果关联id存在扫海报进入
        await this.getParams(obj.o)
      }
    } else {
      if (option && option.access_id) {
        this.data.access_id = option.access_id
      }
      this.setData({
        card_id: option.card_id,
        topbarHeight: globalData.topbarHeight,
      })
      if (option.s) wx.setStorageSync('current_store_id', option.s - 0)
      let pages = getCurrentPages()
      if (pages.length === 1) {
        this.setData({
          showHome: true,
        })
      }
    }
    // 判断用户身份，未注册跳转注册授权
    if (globalData.is_registered === 2) {
      await isRegistered()
    }
    // 记录二维码追踪状态放在此处是需要判断是否注册过才可以请求api
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      if (scene.includes(',')) {
        // scene包含,通过解析方法拿到card_id,再去获取access_id,并存入缓存
        let obj = queryScene(scene)
        if (obj.scene.store_id !== '0') {
          wx.setStorageSync('current_store_id', obj.scene.store_id)
        } else {
          // 如果scene解析出来的store_id为0，则取默认的store_id
          wx.setStorageSync('current_store_id', globalData.userInfo.store_id)
          obj.scene.store_id = globalData.userInfo.store_id
        }
        if (obj.scene.card_id) {
          this.setData({
            topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
            card_id: obj.scene.card_id - 0,
            showHome: true,
          })
          await getAccessId(obj)
          this.onShow()
        }
      }
    }
  },

  onShow () {
    if (this.data.card_id) {
      globalData.cc_id = null
      globalData.is_choose_coupon = false
      this.getCardDetail()
      this.getDataInfo()
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
          card_id: option.card_id - 0,
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
    wx.setStorageSync('poster', self.data.info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=5',
    })
  },
  /**
   * 获取购卡详情
   */
  async getCardDetail () {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      let params = {
        id: this.data.card_id,
      }
      if (this.data.access_id) {
        // 如果路由里带了access_id则用路由里的access_id,否则不传access_id
        params.access_id = this.data.access_id
      }
      const {
        statusCode,
        data,
        code,
        message,
      } = await getCardCenterDetailApi(params)
      this.setData({
        isinitiated: true,
      })
      if (statusCode === 200) {
        if (code === 0) {
          data.price = (data.price / 100).toFixed(2)
          data.origin_price = (data.origin_price / 100).toFixed(2)
          let activation = 0
          if (data.type === 1) {
            activation = data.list.filter(element => element.type === 2).length
          }
          this.setData({
            info: data,
            activation_length: activation,
          })
        } else if (code === 10000) {
          this.setData({
            is_show_default: true,
            err_tip: '该养护卡已被删除',
          })
        } else if (code === 20000) {
          this.setData({
            is_show_default: true,
            err_tip: '该养护卡已被下架',
          })
        }
      } else {
        showMessage({
          title: '获取购卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购卡详情-getCardDetail', err)
    }
    wx.hideLoading()
  },

  // 获取卡详情数据
  async getDataInfo () {
    let params = {
      upkeep_info_id: this.data.card_id,
    }

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
      } = await getCardGoodsList(params)
      if (statusCode === 200) {
        if (code === 0) {
          this.setData({
            list: data,
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

  // 立即下单
  async placeOrder (e) {
    // 判断用户身份，未注册跳转注册授权
    // let res = await registerRedirect({path: `/pages/card/purchaseDetails/purchaseDetails?card_id=${this.data.card_id}`})
    // if (!res) {
    //   return
    // }
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    if (this.data.access_id) {
      wx.navigateTo({
        url: `/pages/card/makeSureOrder/makeSureOrder?card_id=${this.data.card_id}&giving=1&access_id=${this.data.access_id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/card/makeSureOrder/makeSureOrder?card_id=${this.data.card_id}&giving=1`,
      })
    }
  },

  // 赠送好友
  async givingFriend () {
    // 判断用户身份，未注册跳转注册授权
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    // let res = await registerRedirect({path: `/pages/card/purchaseDetails/purchaseDetails?card_id=${this.data.card_id}`})
    // if (!res) {
    //   return
    // }
    if (this.data.access_id) {
      wx.navigateTo({
        url: `/pages/card/makeSureOrder/makeSureOrder?card_id=${this.data.card_id}&giving=3&access_id=${this.data.access_id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/card/makeSureOrder/makeSureOrder?card_id=${this.data.card_id}&giving=3`,
      })
    }
  },

  // 确定手机号
  confirmPhone (e) {
    this.setData({
      phone: e.detail,
      showPhone: false,
    })
    wx.navigateTo({
      url: `/pages/card/makeSureOrder/makeSureOrder?card_id=${this.data.card_id}&phone=${e.detail}&giving=2`,
    })
  },

  // 关闭弹框
  cancelPhone () {
    this.setData({
      showPhone: false,
    })
  },

  // 对应商品
  productMore (e) {
    wx.navigateTo({
      url: `/pages/card/relationGoods/relationGoods?id=${this.data.card_id}&type=1`,
    })
  },

  // 页面分享设置
  onShareAppMessage () {
    let url = `pages/card/purchaseDetails/purchaseDetails?share=1&card_id=${this.data.card_id}`
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
      title: `${this.data.info.list.length}种优惠仅需${this.data.info.price}元，“${this.data.info.name}”等你来抢！`,
      path: url,
    }
  },

  // 显示优惠券弹框
  showCouponCover () {
    this.setData({ couponCover: !this.data.couponCover })
    if (this.data.isRequestCoupon && this.data.couponCover) {
      this.fetchCouponList()
      // 现在每次打开优惠券弹框都重新请求接口
      // this.setData({ isRequestCoupon: false })
    }
  },

  // 优惠券列表
  async fetchCouponList () {
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      const { statusCode, data, code, message } = await getUpkeepCouponList({
        upkeep_id: this.data.card_id,
      })
      if (statusCode === 200 && code === 0) {
        this.setData({ un_receive_list: data.couponList })
        this.setData({ received_list: data.couponCustomerList })
      } else {
        showMessage({
          title: '获取优惠券列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('商品详情-fetchCouponList', err)
    }
    wx.hideLoading()
  },

  /**
   * 领取优惠券
   * @param {Object} item 优惠券对象
   */
  async receiveCoupon (item) {
    if (globalData.is_registered === 0) {
      wx.navigateTo({url: '/pages/register/registerPhone/registerPhone'})
      return false
    }
    let self = this
    wx.showLoading({title: '加载中...', mask: true})
    let params = {
      coupon_id: item.detail.coupon.coupon_id,
      obtain_type: 6, // 1：定向推送，2：活动中心，4：优惠来袭，5：商品详情，6：养护卡
      relation_id: self.data.relation_id ? self.data.relation_id : null,
    }
    // 当前时间 减去 获取access_id的时间 是否超过五分钟
    if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
      params.access_id =  wx.getStorageSync('access_id').access_id
    }
    try {
      const { statusCode, data, code, message } = await getCoupon(params)
      if (statusCode === 200 && code === 0) {
        let id = item.detail.coupon.coupon_id
        this.data.un_receive_list.forEach(v => {
          if (v.coupon_id == id) {
            v.receive_status = v.user_limit === 1 ? 3 : 2
          }
        })
        this.data.received_list.unshift(...data)
        this.setData({
          un_receive_list: this.data.un_receive_list,
          received_list: this.data.received_list,
        })
        wx.hideLoading()
        wx.showToast({
          title: '领取成功',
          icon: 'success',
          duration: 2000,
        })
      } else {
        showMessage({
          title: '领取优惠券失败',
          content: `${message}`,
        })
        wx.hideLoading()
      }
    } catch (err) {
      console.error('商品详情-receiveCoupon', err)
      wx.hideLoading()
    }
  },
  // formid 收集
  sendFormId,
})
