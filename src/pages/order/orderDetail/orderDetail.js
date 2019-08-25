import {getOrderDetail, cancelReservation, payment, cancelOrderApi, giveCardDetailApi} from '@/libs/modules/order'
import { groupUserDetail } from '@/libs/modules/shopGroup'

const {showMessage, changeDateTime, countDown, globalData } = getApp()
Page({
  data: {
    number: '',   //订单id
    order: {
      order_type: 3
    }, //订单信息
    creat_time: null,
    intervarID: null,
    clock: '',
    showHome: false,
    isPayment: false, // 防止多次点击确认支付按钮的flag
    showCode: false,
    code: '',
    qrcode: '',
    order_id: null,
    group_detail: null,
    group_end_time_line: ['00', '00', '00'],
    group_end_time_line_day: 0,
    cha_time: 0,
    order_no: null,
    top_height: 0, // padding高度
  },

  // 生命周期
  onLoad (option) {
    console.log(option)
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
    this.setData({
      group_log_id: 1,
    })
    if (option.group_log_id) {
      this.setData({
        group_log_id: option.group_log_id,
      })
    }
  },

  onShow() {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    })
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
    clearInterval(this.data.intervarID)
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
        // 拼团类型请求拼团详情接口
        if (data.order_type === 3){
          this.getGroupDetail()
        }
        // 时间点包括秒级
        // data.created_at = changeDateTime(data.created_at)
        if (data.paid_at) {
          data.paid_at = changeDateTime(data.paid_at)
        }
        if (data.reserve && data.reserve.reserve_time) {
          data.reserve.reserve_time = changeDateTime(data.reserve.reserve_time)
        }
        if (data.write_off && data.write_off.write_off_at) {
          data.write_off.write_off_at = changeDateTime(data.write_off.write_off_at)
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
        data.item.forEach(ele => {
          ele.activity_price = (ele.activity_price/100).toFixed(2)
        })
        this.setData({
          creat_time: changeDateTime(data.created_at)
        })
        this.data.intervarID = setInterval(this.getCountTime, 1000)
        this.setData({
          order: data,
          intervarID: this.data.intervarID
        })
        console.log('详情', data)
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

  // 获取拼团详情
  async getGroupDetail () {
    let _this = this
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try{
      const{statusCode, data, code, message} = await groupUserDetail({
        group_log_id: this.data.group_log_id
      })
      if(statusCode === 200) {
        if (data.group_log_id) {
          _this.setData({
            group_detail: data,
          })
          // 正在拼团，调用倒计时方法
          if (parseInt(data.group_status) === 1){
            this.getEndTimeLine()
          }
        } else {
          showMessage({
            title: '获取拼团详情失败',
            content: code + ' - ' + message,
          })
        }
      }else{
        showMessage({
          title: '获取拼团详情失败',
          content: code+'-'+message,
        })
      }
    }catch(err){
      if(err.error === "ERROR") {
        console.error('订单详情-getGroupDetail:', err)
      }
    }
    wx.hideLoading()
  },


  // 获取结束时间段
  getEndTimeLine () {
    let _this = this
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('orderDetail') === -1){
      return false
    }
    let left_time = countDown(_this.data.group_detail.group_end_time)
    let date_array = []
    let date_day = 0
    if (left_time){
      date_array = left_time.split(":")
      if (date_array[0].indexOf('天') != -1){
        date_day = date_array[0].split('天')[0]
        date_array[0] = date_array[0].split('天')[1]
      }
    } else {
      // let group_detail = _this.data.group_detail
      // group_detail.group_status = 3
      _this.setData({
        // group_detail: group_detail,
        group_end_time_line: ['00', '00', '00'],
        group_end_time_line_day: 0
      })
      return false
    }
    _this.setData({
      group_end_time_line: date_array,
      group_end_time_line_day: date_day
    })
    setTimeout(function () {
      _this.getEndTimeLine()
    },1000)
  },

  // 取消预约
  async cancel (e) {
    wx.showLoading({
      title: '取消中...',
      mask: true,
    })
    try {
      const {statusCode, code, message} = await cancelReservation({
        trade_order_id: this.data.number
      })
      if (statusCode === 200 && code === 0) {
        wx.showToast({
          title: '取消预约成功',
          icon: 'none',
          mask: true,
          success: () => {
            setTimeout(() => {
              this.getOrder()
            }, 1500)
          }
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '取消预约失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('订单详情-cancel:', err)
    }
  },
  // 去预约
  postReservation (e) {
    wx.navigateTo({
      url: `/pages/appointment/makeAppointment/makeAppointment?trade_order_id=${this.data.number}`,
    })   
  },

  // 支付订单
  async payment() {
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.setData({
      isPayment: true
    })
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await payment({
        trade_order_no: this.data.order.trade_order_no
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        if (!data) {
          showMessage({
            title: '支付失败',
            content: '该店的微信支付存在问题，我们会通知商户进行解决！',
          })
          this.setData({
            isPayment: false
          })
          return false
        }
        // 跳出当前页后终止支付框调起
        let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
        if (current_route.indexOf('orderDetail') === -1){
          return false
        }
        wx.requestPayment({
          ...data.credential,
          success: () => {
            // 秒杀跳转
            if (parseInt(this.data.order.order_type) === 4) {
              // 商品、服务
              let url = `/pages/order/paySuccess/paySuccess?orderNo=${this.data.number}`
              //  养护卡
              if (parseInt(this.data.order.item[0].item_type) >= 3){
                url = `/pages/spilkeGroup/purchasePaySuccess/purchasePaySuccess?orderId=${this.data.number}&orderNo=${this.data.order.trade_order_no}`
              }
              // 跳转
              wx.navigateTo({
                url: url,
              })
            } else if (parseInt(this.data.order.order_type) === 3) {
              // 拼团跳转
              wx.navigateTo({
                url: `/pages/spilkeGroup/groupPaySuccess/groupPaySuccess?order_id=${this.data.number}&group_log_id=${this.data.group_log_id}&spu_id=${this.data.order.item[0].item_id}&type=${this.data.order.item[0].item_type}&order_no=${this.data.order.trade_order_no}&from_type=order`,
              })
            } else if(parseInt(this.data.order.goods_type) === 2 && parseInt(this.data.order.upkeep_type) === 1) {
              wx.navigateTo({
                url: `/pages/card/payForSuccess/payForSuccess?orderNo=${this.data.order.trade_order_id}&order=${this.data.order.trade_order_no}`,
              }) 
            } else if (parseInt(this.data.order.goods_type) === 2 && parseInt(this.data.order.upkeep_type) !== 1) {
              wx.navigateTo({
                url: `/pages/card/giveSuccess/giveSuccess?orderNo=${this.data.order.trade_order_id}&order=${this.data.order.trade_order_no}`,
              })
            } else {
              wx.navigateTo({
                url: `/pages/order/paySuccess/paySuccess?orderNo=${this.data.order.trade_order_no}`,
              })
            }
          },
          fail: () => {
            this.setData({
              isPayment: false
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 300)
          }
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '下单失败',
          content: `${message}`,
        })
        this.setData({
          isPayment: false
        })
      }
    } catch (err) {
      console.error('订单详情-payment:', err)
      this.setData({
        isPayment: false
      })
    }
  },
  // 确认取消订单弹框
  confirmCancelOrder () {
    let self = this
    showMessage({
      title: '提示',
      content: '确定取消该订单吗？',
      isRejectable: true,
      cancelText: '取消',
      resolve: () => {
        self.cancelOrder() // 调用取消订单接口
      }
    })
  },
  /**
   * 取消订单
   * @param {id} 订单id 
   */
  async cancelOrder() {
    wx.showLoading({
      title: '取消中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        code,
        message
      } = await cancelOrderApi({
        trade_order_id: this.data.order.trade_order_id
      })
      if (statusCode === 200 && code === 0) {       
        wx.showToast({
          title: '取消成功',
          icon: 'none',
          mask: true,
          success: () => {         
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        })     
      } else {
        wx.hideLoading()
        showMessage({
          title: '取消订单失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('订单详情-cancelOrder:', err)
    }
  },
  openShare (e) {
    let code = e.currentTarget.dataset.code
    let qrcode = e.currentTarget.dataset.qrcode
    let id = e.currentTarget.dataset.id
    this.setData({
      showCode: true,
      code: code,
      qrcode: qrcode,
      order_id: id
    })
  },
  // 关闭弹框
  codeCancel() {
    this.setData({
      showCode: false
    })
  },
  // 付款倒计时
  getCountTime () {
    // let format = this.data.creat_time.replace(/-/g, '/')
    // 下单时间戳
    let format = this.data.order.created_at
    let date_time = this.data.order.upkeep_give_time - 0
    // 待付款订单默认时间
    let cha_time = 0

    // 拼团订单且参团订单 默认5分钟支付时间
    if ((parseInt(this.data.order.order_type) === 3 && parseInt(this.data.group_detail.group_user_data[0].status) === 1) || (parseInt(this.data.order.order_type) === 4)){
      cha_time = (format + 5 * 60) - parseInt(new Date().getTime()/1000)
    } else if ((parseInt(this.data.order.goods_type)) === 2 && (parseInt(this.data.order.upkeep_type)) === 2) {
      cha_time = (date_time + 72 * 60 * 60) - parseInt(new Date().getTime()/1000)
      console.log(cha_time)
    } else if (parseInt(this.data.order.status) === 1) {
      // 拼团类型开团订单待付款、普通待付款订单默认30分钟支付时间
      cha_time = (format + 30 * 60) - parseInt(new Date().getTime()/1000)
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
    } else {
      minutes = this.judgeTime(parseInt(cha_time / 60 % 60, 10)) //计算剩余的分钟
      seconds = this.judgeTime(parseInt(cha_time % 60, 10)) //计算剩余的秒数
    }
    if(cha_time < 0) {
      clearInterval(this.data.intervarID)
      if (this.data.order.goods_type == 2) {
        this.setData({
          clock: "00:00:00"
        })
      } else {
        this.setData({
          clock: "00:00"
        })
      }
      if (parseInt(this.data.order.order_type) === 3) {
        if (this.data.order.status === 1) {
          this.setData({
            group_log_id: 0
          })
        }
      }
    } else {
      if (this.data.order.goods_type == 2 && parseInt(this.data.order.status) !== 1) {
        this.setData({
          clock: hour + ":" + minutes + ":" + seconds
        })
        if (hour === '00' && minutes === '00' && seconds === '00') {
          clearInterval(this.data.intervarID)
          wx.navigateBack({
            delta: 1
          })
        }
      } else {
        this.setData({
          clock: minutes + ":" + seconds
        })
        if (minutes === '00' && seconds === '00') {
          clearInterval(this.data.intervarID)
          wx.navigateBack({
            delta: 1
          })
        }
      }
    }
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
    // 邀请朋友参团
    if (res.target.dataset.type === 'group_share'){
      // &from_type=order 来源于订单
      let url = `pages/spilkeGroup/groupSharePage/groupSharePage?share=1&order_no=${this.data.order.trade_order_no}&spu_id=${this.data.order.item[0].item_id}&group_log_id=${this.data.group_log_id}&type=${this.data.order.item[0].item_type}&from_type=order`
      console.log(url)
      // 有门店id,则分享带上门店id
      let current_store_id = wx.getStorageSync('current_store_id')
      if (current_store_id) {
        url = url + '&current_store_id=' + current_store_id
      } 
      return {
        title: `只需${this.data.order.item[0].activity_price}元就能购买${this.data.order.item[0].item_title}`,
        // title: '这有一个超高性价比的好东西，就差你的一臂之力了！',
        path: url,
      };
    } else if (res.target.dataset.type === 'card_share') {
      this.giveCard()
      let url = `pages/card/giveCardShare/giveCardShare?share=1&upkeep_no_give=${this.data.order.trade_order_no}`
      // 有门店id,则分享带上门店id
      let current_store_id = wx.getStorageSync('current_store_id')
      if (current_store_id) {
        url = url + '&current_store_id=' + current_store_id
      }
      return {
        title: '好事不忘你~送你张爱车养护卡，记得情谊永相伴！',
        imageUrl: 'https://oss1.chedianai.com/images/assets/card-share.png',
        path: url,
      };
    } else {
      this.codeCancel()
      let url = 'pages/qrcodeShare/qrcodeShare?share=1&number=' + res.target.dataset.id
      // 有门店id,则分享带上门店id
      let current_store_id = wx.getStorageSync('current_store_id')
      if (current_store_id) {
        url = url + '&current_store_id=' + current_store_id
      }    
      return {
        title: '确认过眼神，送你爱车亲密服务，到店扫码666~',
        path: url,
        imageUrl: 'https://oss1.chedianai.com/images/assets/code-share.png',
        success: function() {
          // self.shareHasGift()
        }
      };
    }
  },
  // 去核销记录
  goWriteOff (e) {
    let writeoff = e.currentTarget.dataset.writeoff
    wx.setStorage({
      key: 'writeoff',
      data: writeoff
    })
    wx.navigateTo({
      url: `../writeOff/writeOff`
    })
  },
})
