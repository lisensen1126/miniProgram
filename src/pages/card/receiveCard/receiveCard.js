import {
  daughterCardDetailApi, receiveDaughterCardApi
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
    showPhone: false,
    isinitiated: false,
    show_model: false,
    is_customer_id: false,
    is_show_default: false,
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
      } = await daughterCardDetailApi({
        upkeep_no: this.data.upkeep_no_give,
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
          data.receive_effective_time = changeDateTime(data.receive_effective_time)
          data.expire_time = changeDate(data.expire_time)
          this.setData({
            info: data
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
      console.error('领取项目-getCardDetail', err)
    }
    wx.hideLoading()
  },
  // 立即领取
  async receive () {
    let _this = this
    // 判断用户身份，未注册跳转注册授权
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
      } = await receiveDaughterCardApi({
        upkeep_customer_id: this.data.info.id,
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
            title: message
          })
        }
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('领取项目-receive', err)
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
      phoneNumber: this.data.info.store.business_phone,
    })
  },
  // 去首页逛逛
  goIndex() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
	async onLoad(option) {
    wx.hideShareMenu()
    this.setData({
      upkeep_no_give: option.upkeep_no_give,
      topbarHeight: globalData.topbarHeight
    })
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    this.getCardDetail()
    if (globalData.is_registered === 2) {
      await isRegistered()
    }
	},
});