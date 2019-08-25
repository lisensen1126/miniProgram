import {
  getCardCenterListApi,
} from '@/libs/modules/mycard'

const {
  showMessage,
  globalData
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		meta: {    // 分页参数
      last_page: 1,
      current_page: 0,
		},
		list: [],    //订单数据
    isinitiated: false,
    isLoading: false,
    isAllLoaded: true,
    showHome: false,
	},
	/**
   * 获取购卡列表
   */ 
  async getCardList() {
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
      } = await getCardCenterListApi({
        page: this.data.meta.current_page + 1,
      })
      this.setData({
        isinitiated: true,
      })
      if (statusCode === 200) {
				if (code === 0) {
          data.forEach(element => {
            element.price = (element.price / 100).toFixed(2)
            element.origin_price = (element.origin_price / 100).toFixed(2)
          })
          const lastData = this.data.list
					lastData.splice(lastData.length, 0, ...data)
					this.setData({
						list: lastData,
						isAllLoaded: meta.current_page === meta.last_page,
            meta,
            isLoading: false,
					})
				}
      } else {
        showMessage({
          title: '获取购卡列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购卡中心-getCardList', err)
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
    this.getCardList()
  },
  /**
   * 跳转卡详情
   */
  goDetail(e) {
    let id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/card/purchaseDetails/purchaseDetails?card_id=${id}`
    })
  },
  // 页面分享设置
  onShareAppMessage() {
    let url = 'pages/card/cardCenter/cardCenter?share=1'
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
      title: '一张平凡养护卡，一起陪伴爱车走过的不平凡之路！',
      path: url
    };
  },
	onLoad() {
    this.setData({
			topbarHeight: globalData.topbarHeight
		})
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    this.getCardList()
  },
});