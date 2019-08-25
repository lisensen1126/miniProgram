import {getOrderDetail, giveCardDetailApi} from '@/libs/modules/order'
import {selfUseApi} from '@/libs/modules/mycard'

const {showMessage, changeDateTime, globalData } = getApp()
Page({
  data: {
    number: '',   //订单id
    order: {
      order_type: 3
    }, //订单信息
    creat_time: null,
    order_id: null,
    order_no: null,
    top_height: 0, // padding高度
    intervarID: null,
    clock: '00:00:00',
    show_confrim: false,
  },

  // 生命周期
  onLoad (option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    wx.hideShareMenu()
    if (option.number) {
      this.setData({
        number: option.number,
      })
    }
    if (option.order_no) {
      this.setData({
        order_no: option.order_no
      })
    }
  },

  onShow() {
    // 订单详情
    this.getOrder()
  },
  onUnload() {
    clearInterval(this.data.intervarID);
  },

  onHide() {
    clearInterval(this.data.intervarID)
  },
  // 获取订单详情
  async getOrder () {
    clearInterval(this.data.intervarID);
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {}
    if (this.data.order_no) {
      params.trade_order_no = this.data.order_no
    } else {
      params.trade_order_id = this.data.number
    }
    try {
      const {statusCode, data, code, message} = await getOrderDetail(params)
      if (statusCode === 200 && code === 0) {
        // 时间点包括秒级
        if (data.paid_at) {
          data.paid_at = changeDateTime(data.paid_at)
        }
        if (data.upkeep_give_time) {
          data.give_time = changeDateTime(data.upkeep_give_time)
        }
        if (data.receive_time > 0) {
          data.receive_time = changeDateTime(data.receive_time)
        }
        if (data.total_amount) {
          data.total_amount = (data.total_amount/100).toFixed(2)
        }
        if (data.final_amount) {
          data.final_amount = (data.final_amount/100).toFixed(2)
        }
        if (data.preferential_price) {
          data.preferential_price = (data.preferential_price/100).toFixed(2)
        }
        if (data.card.origin_price) {
          data.card.origin_price = (data.card.origin_price/100).toFixed(2)
        }
        if (data.card.price) {
          data.card.price = (data.card.price/100).toFixed(2)
        }
        if (data.give_mobile) {
          data.give_mobile = data.give_mobile.replace(data.give_mobile.substring(3,7), " **** ")
        }
        if (data.random_coupon) {
          data.random_coupon = (data.random_coupon/100).toFixed(2)
        }
        data.item.forEach(ele => {
          ele.activity_price = (ele.activity_price/100).toFixed(2)
        })
        this.setData({
          creat_time: changeDateTime(data.created_at),
          order: data,
        })
        this.data.intervarID = setInterval(this.getCountTime, 1000)
        this.setData({
          intervarID: this.data.intervarID
        })
      } else {
        showMessage({
          title: '获取订单详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('订单详情-getOrder:', err)
    }
    wx.hideLoading()
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
        order_no: this.data.order.trade_order_no,
        give_id: this.data.order.give_id,
      })
      wx.hideLoading()
      if (statusCode === 200 && code === 0) {

      } else {
        showMessage({
          title: '赠卡失败',
          content: `${message}`,
        })
      }
    } catch(err) {
      console.error('订单详情-giveCard:', err)
    }
  },
  // 页面分享设置
  onShareAppMessage(res) {
    this.giveCard()
    let url = `pages/card/giveCardShare/giveCardShare?share=1&upkeep_no_give=${this.data.order.trade_order_no}&give_id=${this.data.order.give_id}`
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
  // 付款倒计时
  getCountTime () {
    // 时间戳
    let date_time = this.data.order.upkeep_give_time - 0
    // 倒计时
    let cha_time = 0
    if ((parseInt(this.data.order.goods_type)) === 2 && (parseInt(this.data.order.upkeep_type)) === 2) {
      cha_time = (date_time + 72 * 60 * 60) - parseInt(new Date().getTime()/1000)
    } else {
      return
    }
    this.setData({
      cha_time: cha_time
    })
    let hour = '00' ,minutes = '00',seconds = '00'
    if ((parseInt(this.data.order.goods_type)) === 2 && (parseInt(this.data.order.upkeep_type)) === 2) {
      let day = parseInt(cha_time/(60*60*24))
      let cha_time_day = parseInt(cha_time) - parseInt(day * 60 * 60 * 24)
      hour = this.judgeTime(parseInt(cha_time_day / 60 / 60 % 24, 10) + parseInt(day*24)) //计算剩余的分钟
      minutes = this.judgeTime(parseInt(cha_time_day / 60 % 60, 10)) //计算剩余的分钟
      seconds = this.judgeTime(parseInt(cha_time_day % 60, 10)) //计算剩余的秒数
    }
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
      }
    }
  },
  // 自己使用
  selfUse() {
    this.setData({
      show_confrim: true
    })
  },
  // 自己使用确定回调 
  async confirm() {
    this.setData({
      show_confrim: false
    })
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
      } = await selfUseApi({
        order_no: this.data.order.trade_order_no,
      })
      wx.hideLoading()
      if (statusCode === 200 && code === 0) {
        wx.showToast({
          title: '已放入卡包~',
          icon: 'none',
          duration: 1500,
          mask: true,
          success: () => {
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/card/myCardBag/myCardBag'
              })
            }, 1500)
          }
        });
      } else {
        wx.showToast({
          title: message,
          icon: 'none',
          duration: 1500,
          mask: true,
        });
      }
    } catch(err) {
      console.error('订单详情-confirm:', err)
    }
  },
  // 自己使用取消回调
  cancel() {
    this.setData({
      show_confrim: false
    })
  }
})
