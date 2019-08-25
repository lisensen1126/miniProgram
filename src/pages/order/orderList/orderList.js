import {
  fetchOrderList,
  cancelReservation,
  cancelOrderApi,
  payment,
} from '@/libs/modules/order'
const {
  showMessage,
  countDown,
  globalData,
  isRegistered
} = getApp()
const levels = ['0', '1', '2', '3', '10']

Page({
  data: {
    levels,
    list: [],             //订单数据
    currentLevel: '0',    //tab切换的下标
    meta: {               // 分页参数
      last_page: 1,
      current_page: 0,
    },
    isinitiated: false,
    isLoading: false,
    isAllLoaded: false,
    pageShow: false,
    showCode: false,
    code: '',
    qrcode: '',
    showHome: false,
    isPayment: false, // 防止多次点击确认支付按钮的flag
    timer: '',			//定时器
    top_height: 0, // padding高度
  },
  // url="../"
  goDetail(e) {
    let item = e.currentTarget.dataset.item
    let info = item.item[0]
    // 海报图片
    let poster_info = {
      name: info.item_title,
      num: item.trade_order.num || 0,
      origin_price: (info.unit_price / 100).toFixed(2),
      price: info.activity_price,
      image_url: info.image_url,
    }
    // 商品
    if (info.item_type == 1) {
      let str = ''
      if (info && Array.isArray(info.sku_attribute) && info.sku_attribute.length > 0) {  
        info.sku_attribute.forEach(item => {
          str += item.attribute_item_value
        })
      }
      poster_info.name = info.item_title + str
    }
    wx.setStorageSync('poster-info', poster_info)
    if (item.trade_order.goods_type === 2 && item.trade_order.status !== 1 && item.trade_order.order_type !== 3) {
      wx.navigateTo({
        url: `/pages/card/giveRecordDetail/giveRecordDetail?number=${item.trade_order.trade_order_id}`,
      })  
    } else {
      wx.navigateTo({
        url: `/pages/order/orderDetail/orderDetail?number=${item.trade_order.trade_order_id}&group_log_id=${item.trade_order.group_log_id}`,
      })
    }
  },
  /*****
	 * 倒计时
	 * @is_open  是否开始-结束
	 */
  getTimeLimit (time, index) {
    let self = this
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('orderList') === -1){
      return false
    }
    let left_time = countDown(time)
    let date_array = []
    let date_day = 0
    if (left_time){
      date_array = left_time.split(":")
      if (date_array[0].indexOf('天') != -1){
        date_day = date_array[0].split('天')[0]
        date_array[0] = date_array[0].split('天')[1]
      }
      let new_list = self.data.list
      new_list[index].group_time_line = date_array
      new_list[index].group_time_line_day = date_day
      self.setData({
        list: new_list
      })
    } else {
      let list = self.data.list
      // 拼团状态 已结束
      // list[index].trade_order.group_status = 3
      // list[index].trade_order.status = 6
      list[index].group_time_line = ['00', '00', '00']
      list[index].group_time_line_day = 0
      self.setData({
        list: list
      })
      // clearTimeout(this.data.timer)
      return false
    }
    self.data.timer = setTimeout(function () {
      self.getTimeLimit(time, index)
    },1000)
	},
  /**
   * 获取订单列表
   * @currentLevel 切换tab
   */
  async getOrderList() {
    this.setData({
      isLoading: true,
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
        meta
      } = await fetchOrderList({
        status: this.data.currentLevel === '0' ? 9 : this.data.currentLevel,
        page: this.data.meta.current_page + 1,
      })
      if (statusCode === 200 && code === 0) {
        let self = this
        data.forEach(ele => {
          ele.trade_order.final_amount = (ele.trade_order.final_amount/100).toFixed(2)
          ele.item.forEach(element => {
            element.activity_price = (element.activity_price/100).toFixed(2)
          })
          ele.group_time_line = ['00', '00', '00']
          ele.group_time_line_day = 0
        })
        const lastData = self.data.list
        lastData.splice(lastData.length, 0, ...data)
        self.setData({
          list: lastData,
          isinitiated: true,
          isAllLoaded: meta.current_page >= meta.last_page,
          meta,
        })
        self.setData({
          isLoading: false,
        })
        let list = self.data.list
        if(self.data.list.length !== 0) {
          list.forEach(function (v, index) {
            // 正在拼团的订单，获取拼团结束倒计时
            if (parseInt(v.trade_order.group_status) === 1 && v.trade_order.is_effective === 2 && v.trade_order.group_end_time>0 && parseInt(v.trade_order.status) === 2 && v.trade_order.group_end_time > 0) {
              if (index < list.length) {
                self.getTimeLimit(v.trade_order.group_end_time, index)
              }
            }
          })
        }
      } else {
        showMessage({
          title: '获取订单列表列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('订单列表-getOrderList:', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
      pageShow: true
    })
  },

  /**
   * tab切换并获取订单列表
   * @param {*} param0 
   */
  switchLevel({
    currentTarget
  }) {
    if(this.data.currentLevel === currentTarget.dataset.level){
			return
		} else {
			this.setData({
				list: [],
				currentLevel: currentTarget.dataset.level,
				meta: {
					last_page: 1,
					current_page: 0,
				},
				isinitiated: false,
				isAllLoaded: true,
				isLoading: false
      })
      clearTimeout(this.data.timer)
			this.getOrderList()
		}
  },
  /**
   * 上拉加载
   */
  onReachBottom() {
    if (this.data.isAllLoaded) {
      return
    }
    this.getOrderList()
  },

  /**
   * 取消预约
   * @id 订单id
   */
  async cancel({
    currentTarget
  }) {
    wx.showLoading({
      title: '取消中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        code,
        message
      } = await cancelReservation({
        trade_order_id: currentTarget.dataset.id
      })
      if (statusCode === 200 && code === 0) {       
        wx.showToast({
          title: '取消预约成功',
          icon: 'none',
          mask: true,
          success: () => {
            setTimeout(() => {
              this.setData({
                list: [],
                meta: {
                  last_page: 1,
                  current_page: 0,
                },
                isinitiated: false,
                isAllLoaded: true,
                isLoading: false
              })
              this.getOrderList()
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
      console.error('订单列表-cancel:', err)
    }
  },
  // 确认取消订单弹框
  confirmCancelOrder (e) {
    let self = this
    showMessage({
      title: '提示',
      content: '确定取消该订单吗？',
      isRejectable: true,
      cancelText: '取消',
      resolve: () => {
        self.cancelOrder(e) // 调用取消订单接口
      }
    })
  },
  /**
   * 取消订单
   * @param {id} 订单id 
   */
  async cancelOrder(e) {
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
        trade_order_id: e.currentTarget.dataset.orderid
      })
      if (statusCode === 200 && code === 0) {       
        wx.showToast({
          title: '取消成功',
          icon: 'none',
          mask: true,
          success: () => {
            setTimeout(() => {
              this.setData({
                list: [],
                meta: {
                  last_page: 1,
                  current_page: 0,
                },
                isinitiated: false,
                isAllLoaded: true,
                isLoading: false
              })
              this.getOrderList()
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
      console.error('订单列表-cancelOrder:', err)
    }
  },
  /**
   * 去预约
   * @id  订单id
   */
  postReservation(e) {
    wx.navigateTo({
      url: `/pages/appointment/makeAppointment/makeAppointment?trade_order_id=${e.currentTarget.dataset.id}`,
    })   
  },

  /**
   * 支付订单
   * @orderno 订单号
   * @offerd 拼团-3
   */
  async payment(e) {
    if (parseInt(e.currentTarget.dataset.offerd) === 3) {
      var group_log_id = ''
      var spu_id = ''
      var type = ''
      this.data.list.forEach(function (v) {
        if (e.currentTarget.dataset.orderno === v.trade_order.trade_order_no) {
          group_log_id = v.trade_order.group_log_id
          v.item.forEach(function(i){
            spu_id = i.item_id
            type = i.item_type
          })
        }
      })
    }
    // 防止多次调起微信支付
    if (this.data.isPayment) {
      return false
    }
    this.data.isPayment = true
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    console.log(e.currentTarget.dataset)
    try {
      const {statusCode, data, code, message} = await payment({
        trade_order_no: e.currentTarget.dataset.orderno
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        if (!data.credential) {
          showMessage({
            title: '支付失败',
            content: '该店的微信支付存在问题，我们会通知商户进行解决！',
          })
          this.data.isPayment = false
          return false
        }
        // 跳出当前页后终止支付框调起
        let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
        if (current_route.indexOf('orderList') === -1){
          return false
        }
        wx.requestPayment({
          ...data.credential,
          success: () => {
            let customize = {
              orderId: e.currentTarget.dataset.orderid ? parseInt(e.currentTarget.dataset.orderid) : '',
            } 
            // 秒杀跳转
            if (parseInt(e.currentTarget.dataset.offerd) === 4) {
              // 商品、服务
              let url = `/pages/order/paySuccess/paySuccess?orderNo=${e.currentTarget.dataset.orderno}`
              //  养护卡
              if (parseInt(e.currentTarget.dataset.item[0].item_type) >= 3){
                url = `/pages/spilkeGroup/purchasePaySuccess/purchasePaySuccess?orderId=${e.currentTarget.dataset.orderid}&orderNo=${e.currentTarget.dataset.orderno}`
              }
              // 跳转
              wx.navigateTo({
                url: url,
              })
            } else if (parseInt(e.currentTarget.dataset.offerd) === 3) {
              let info = e.currentTarget.dataset.item[0]
              console.log(info)
              // // 海报图片
              let poster_info = {
                name: info.item_title,
                num: e.currentTarget.dataset.num,
                origin_price: (info.unit_price / 100).toFixed(2),
                price: info.activity_price,
                image_url: info.image_url,
              }
              if (info.type == 1) {
                let str = ''
                if (info && Array.isArray(info.sku_attribute) && info.sku_attribute.length > 0) {  
                  info.sku_attribute.forEach(item => {
                    str += item.attribute_item_value
                  })
                }
                info.name = info.item_title + str
              }
              wx.setStorageSync('poster-info', poster_info)
              // 拼团跳转
              wx.navigateTo({
                url: `/pages/spilkeGroup/groupPaySuccess/groupPaySuccess?order_id=${e.currentTarget.dataset.orderid}&group_log_id=${group_log_id}&spu_id=${spu_id}&type=${type}&order_no=${e.currentTarget.dataset.orderno}&from_type=order`,
              })
            } else if (parseInt(e.currentTarget.dataset.goodsid) === 2 && parseInt(e.currentTarget.dataset.upkeeptype) === 1) {
              wx.navigateTo({
                url: `/pages/card/payForSuccess/payForSuccess?orderNo=${e.currentTarget.dataset.orderid}&order=${e.currentTarget.dataset.orderno}`,
              })  
            } else if (parseInt(e.currentTarget.dataset.goodsid) === 2 && parseInt(e.currentTarget.dataset.upkeeptype) !== 1) {
              wx.navigateTo({
                url: `/pages/card/giveSuccess/giveSuccess?orderNo=${e.currentTarget.dataset.orderid}&order=${e.currentTarget.dataset.orderno}`,
              })
            } else {
              wx.navigateTo({
                url: `/pages/order/paySuccess/paySuccess?orderNo=${e.currentTarget.dataset.orderno}`,
              })         
            }
            this.data.isPayment = false
          },
          fail: () => {
            this.data.isPayment = false
          }
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '下单失败',
          content: `${message}`,
        })
        this.data.isPayment = false
      }
    } catch (err) {
      console.error('订单列表-payment:', err)
      this.data.isPayment = false
    }
  },
  verification (e) {
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
  // 页面分享设置
  onShareAppMessage(res) {
    let group_log_id = res.target.dataset.groupid
    let price = res.target.dataset.price
    let spu_id = ''
    let type = ''
    let title = ''
    let order_no = ''
    this.data.list.forEach(function (v) {
      if (res.target.dataset.groupid === v.trade_order.group_log_id) {
        v.item.forEach(function(i){
          spu_id = i.item_id
          type = i.item_type
          title = i.item_title
        })
        order_no = v.trade_order.trade_order_no
      }
    })
    console.log(`pages/spilkeGroup/groupSharePage/groupSharePage?share=1&order_no=${order_no}&spu_id=${spu_id}&group_log_id=${group_log_id}&type=${type}&from_type=order`)
    // &from_type=order 来源于订单列表、详情
    let url = `pages/spilkeGroup/groupSharePage/groupSharePage?share=1&order_no=${order_no}&spu_id=${spu_id}&group_log_id=${group_log_id}&type=${type}&from_type=order`
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    // 邀请朋友参团
    if (res.target.dataset.type === 'group_share'){
      return {
        title: `只需${price}元就能购买${title}`,
        path:  url,
      };
    } else {
      this.codeCancel()
      return {
        title: '确认过眼神，送你爱车亲密服务，到店扫码666~',
        path: 'pages/qrcodeShare/qrcodeShare?share=1&number=' + res.target.dataset.id,
        imageUrl: 'https://oss1.chedianai.com/images/assets/code-share.png',
        success: function() {
          // self.shareHasGift()
        }
      };
    }
  },
  // 生命周期
  async onLoad(option) {
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
    if (option.status) {
      this.setData({
        currentLevel: option.status,
      })
    }    
    if (globalData.is_registered === 2) {
      await isRegistered()
      if (globalData.is_registered === 0) {
        wx.navigateTo({
          url: '/pages/register/registerPhone/registerPhone',
        })
      } else {
        this.getOrderList()
      }
    }
  },
  onShow() {   
    this.setData({
      list: [],
      meta: {
        last_page: 1,
        current_page: 0,
      },
      isinitiated: false,
      isAllLoaded: false,
      isLoading: false,
      showCode: false,
      code: '',
      qrcode: '',
      isPayment: false,
    }) 
    if (globalData.is_registered === 1) {
      this.getOrderList()
    }
  },
})