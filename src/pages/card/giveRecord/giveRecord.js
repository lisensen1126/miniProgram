const {
  showMessage,
  changeDateTime,
  globalData,
  isRegistered,
} = getApp()
import {getGiveListApi, selfUseApi} from '@/libs/modules/mycard'
import {giveCardDetailApi} from '@/libs/modules/order'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    isinitiated: false,
    list: [],
    isAllLoaded: true,
    meta: {    // 分页参数
      last_page: 1,
      current_page: 0,
    },
    show_confrim: false,
    check_item: null,   // 按钮点击id
  },
  async onLoad() {
    this.setData({
			topbarHeight: globalData.topbarHeight
		})
    wx.hideShareMenu()
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 2) {
      await isRegistered()
      if(globalData.is_registered === 0) {
        wx.navigateTo({
          url: '/pages/register/registerPhone/registerPhone',
        })
      } else {
        this.fetchList()  
      }  
    }
  },
  onShow () {
    this.setData({
      list: [],
      meta: {    // 分页参数
        last_page: 1,
        current_page: 0,
      },
      isinitiated:false,
    }) 
    if(globalData.is_registered === 1) {
      this.fetchList()  
    }  
  },
  	/**
   * 获取购卡列表
   */ 
  async fetchList() {
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
      } = await getGiveListApi({
        page: this.data.meta.current_page + 1,
      })
      this.setData({
        isinitiated: true,
      })
      if (statusCode === 200) {
				if (code === 0) {
          data.forEach(element => {
            element.give_mobile = element.give_mobile.replace(element.give_mobile.substring(3,7), " **** ")
            element.give_time = changeDateTime(element.give_time)
            element.receive_time = changeDateTime(element.receive_time)
          })
          const lastData = this.data.list
					lastData.splice(lastData.length, 0, ...data)
					this.setData({
						list: lastData,
						isAllLoaded: meta.current_page === meta.last_page,
						meta,
					})
					this.setData({
						isLoading: false,
					})
				}
      } else {
        showMessage({
          title: '获取列表列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('转增记录-fetchList', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },
	/**
   * 上拉加载
   */
  onReachBottom() {
    if (this.data.isAllLoaded) {
      return
    }
    this.fetchList()
  },
  // 去核销详情（订单详情）
	goDetail(e) {
		let id = e.currentTarget.dataset.id
		wx.navigateTo({
			url: `/pages/card/giveRecordDetail/giveRecordDetail?order_no=${id}`
    })
  },
  /**
   * @e 核销id
   * 自己使用
   */
  selfUse(e) {
    this.data.check_item = e.currentTarget.dataset.item
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
        order_no: this.data.check_item.order_no,
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
              wx.navigateTo({
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
  },
  // 赠送卡
  async giveCard(orderNo, giveId) {
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
        order_no: orderNo,
        give_id: giveId
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
    console.log(res)
    let share_item = res.target.dataset.item
    this.giveCard(share_item.order_no, share_item.give_id)
    let url = `pages/card/giveCardShare/giveCardShare?share=1&upkeep_no_give=${share_item.order_no}&give_id=${share_item.give_id}`
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
});