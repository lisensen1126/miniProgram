import {
  receiveCardDetailApi, receiveCardApi, checkCardApi
} from '@/libs/modules/mycard'

const {
  showMessage,
  changeDateTime,
  changeDate,
  globalData,
  isRegistered,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    info: {},
    upkeep_no_give: null,
    isinitiated: false,
    show_model: false,
    is_customer_id: false,    // 是否是本人id
    is_show_default: false,     // 是否展示缺省
    activation_length: 0,
    card_status: false,
  },
  async onLoad(option) {
    wx.hideShareMenu()
    if (option.give_id){
      this.setData({
        upkeep_no_give: option.upkeep_no_give,
        topbarHeight: globalData.topbarHeight,
        give_id: option.give_id
      })
    } else {
      this.setData({
        upkeep_no_give: option.upkeep_no_give,
        topbarHeight: globalData.topbarHeight
      })
    }
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    if (globalData.is_registered === 2) {
      await isRegistered()
    }
	},
	// 生命周期函数--监听页面加载
	async onShow() {
    if (this.data.give_id) {
      await this.checkCardUrl()
      this.getCardDetail()
    } else {
      this.getCardDetail()
    }
	},
	/**
   * 获取卡详情
   */ 
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
        store
      } = await receiveCardDetailApi({
        order_no: this.data.upkeep_no_give,
      })
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200) {
				if (code === 0) {
          if (globalData.current_customer_id === data.customer_id) {
            this.setData({
              is_customer_id: true
            })
          } else {
            this.setData({
              is_customer_id: false
            })
          }
          data.latest_time = changeDateTime(data.latest_time)
          data.card_end_time = changeDate(data.card_end_time)
          if (data.type === 1) {
            this.setData({
              activation_length: data.list.filter(ele => ele.type === 2).length
            })
          }
          this.setData({
            info: data,
            store: store
          })
				} else if (code === 19032815) {
          this.setData({
            is_show_default: true
          })
        }
      } else {
        showMessage({
          title: '获取卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('卡详情-getCardDetail', err)
    }
    wx.hideLoading()
  },
  // 判断链接是否可用
  async checkCardUrl() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        data,
        code,
      } = await checkCardApi({
        order_no: this.data.upkeep_no_give,
        give_id: this.data.give_id
      })
      if (statusCode === 200 && code === 0) {
        if (data.status === 2) {
          this.setData({
            card_status: true
          })
        } else {
          this.setData({
            card_status: false
          })
        }
      } else {
        this.setData({
          card_status: false
        })
      }
    } catch (err) {
      console.error('卡详情-checkCardUrl', err)
    }
    wx.hideLoading()
  },
  // 立即领取
  async receive () {
    let self = this
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    // 判断卡是否被领取
    if (this.data.info.is_received !== 2) {
      return
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
      } = await receiveCardApi({
        order_no: this.data.upkeep_no_give,
        give_id: this.data.give_id,
      })
      if (statusCode === 200) {
				if (code === 0) {
          wx.hideLoading()
          this.setData({
            show_model: true
          })
				} else {
          wx.showToast({
            icon: 'none',
            title: message,
            success: () => {
              setTimeout(() => {
                self.getCardDetail()
              },1500)
            }
          })
        }
      } else {
        wx.hideLoading()
        showMessage({
          title: '领取卡失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('卡详情-receive', err)
    }
  },
  // 关闭弹框
  cancelModel() {
    this.setData({
      show_model: false
    })
    this.getCardDetail()
  },
  // 拨打电话
  makePhoneCall(e) {
    wx.makePhoneCall({
      phoneNumber: this.data.store.business_phone,
    })  
  },
  // 去首页逛逛
  goIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
});