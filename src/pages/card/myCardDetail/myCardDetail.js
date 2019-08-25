import {
  deleteMyCardApi,getMyCardDetailApi,getMyCardGoodsList,createDaughterCardApi,cardNoCreateApi
} from '@/libs/modules/mycard'

const {
  showMessage,
  changeDate,
  globalData,
  isRegistered,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    info: {},
    goods_list: [],
    id: '',
    isinitiated: false,
    order_no: null,
    upkeep_no_give: null,
    give_list: [],
    topbarHeight: 0,
    judge_click: 1,    // 1代表更多商品可以购买   2 代表不能购买
    activation_length: 0,      // 免激活项目的length
    is_can_give: true,
    go_share: false,
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
      id: self.data.info.card_id,
      name: self.data.info.name,
      price: (self.data.info.price / 100).toFixed(2),
      origin_price: (self.data.info.origin_price / 100).toFixed(2),
      image_url: self.data.info.image_url,
    }
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=5',
    })
  },
	/**
   * 获取卡详情
   */ 
  async getCardDetail() {
    let params = {}
    if (this.data.id) {
      params.id = this.data.id
    }
    if (this.data.order_no) {
      params.order_no = this.data.order_no
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
        message
      } = await getMyCardDetailApi(params)
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200 && code === 0) {
        let is_judge_click = 1
        if (data.status === 3 || data.status === 4) {
          is_judge_click = 2
        } else if (data.status === 1) {
          if (new Date().getTime() / 1000 > data.card_end_time || data.num == '0') {
            is_judge_click = 2
          }
        }
        data.card_begin_time = changeDate(data.card_begin_time)
        data.card_end_time = changeDate(data.card_end_time)
        let arr = []   // 可赠送的项目
        let activation = 0   // 可赠送的项目
        if (data.type === 2) {
          data.list.forEach(element => {
            element.give_num = 0
            if (element.num != 0 || (element.num != 0 && (element.num - element.used_num != 0))) {
              arr.push(element)
            }
          });
        } else if (data.type === 1) {
          data.list.forEach(element => {
            element.deadline = changeDate(element.deadline)
          });
          activation = data.list.filter(element => element.type === 2).length;
        }
        this.setData({
          judge_click: is_judge_click,
          give_list: arr,
          info: data,
          activation_length: activation
        })
        if (this.data.give_list.length === 0 || this.data.give_list.every(ele => (ele.num - ele.used_num) === 0)) {
          this.setData({
            is_can_give: false
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
  // 获取我的卡详情数据
  async getMyDataInfo() {

    let params = {
      upkeep_no: this.data.info.upkeep_no
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
      } = await getMyCardGoodsList(params)
      if (statusCode === 200) {
        if (code === 0){
          this.setData({
            goods_list: data
          })
        }
      } else {
        showMessage({
          title: '获取养护卡关联商品失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('卡详情-getMyDataInfo', err)
    }
    wx.hideLoading()

  },
  // 删除二次确认
  deleteCardConfirm() {
    showMessage({
      title: '提示',
      content: '确定删除该养护卡吗？',
      isRejectable: true,
      cancelText: '取消',
      mask: true,
      resolve: () => {
        this.deleteCard()
      }
    })
  },
  // 删除养护卡
  async deleteCard() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        code,
        message
      } = await deleteMyCardApi({
        card_no: this.data.info.upkeep_no
      })
      if (statusCode === 200) {
        if (code === 0) {
          wx.showToast({
            title: '删除成功',
            icon: 'none',
            success: () => {
              setTimeout(() => {
                wx.navigateBack()
              },1500)
            }
          })
        } else {
          wx.showToast({
            title: message,
            icon: 'none'
          })
        }
      } else {
        wx.showToast({
          title: message,
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('卡详情-deleteCard', err)
    }
  },
  // 去核销列表
  goWirte(e) {
    let id = e.currentTarget.dataset.id
    let myid = e.currentTarget.dataset.myid
    let status = e.currentTarget.dataset.status
    let upkeep_no = e.currentTarget.dataset.upkeepno
		wx.navigateTo({
			url: `/pages/card/myCardWirte/myCardWirte?id=${id}&type=${status}&myid=${myid}&upkeep_no=${upkeep_no}`
    })
  },
  // 使用记录
  goRecord(e) {
    let upkeep_no = e.currentTarget.dataset.upkeepno
    wx.navigateTo({
			url: `/pages/card/cardWriteOff/CardWriteOff?upkeep_no=${upkeep_no}`
    })
  },
  // 赠送记录
  goGiveRecord(e) {
    wx.navigateTo({
			url: `/pages/card/giftRecord/giftRecord?id=${this.data.info.id}`
    })
  },
  // 去养护卡二维码页面
  goCode(e) {
    let id = e.currentTarget.dataset.id
		wx.navigateTo({
			url: `/pages/card/myCardCode/myCardCode?id=${id}`
    })
  },
  // 立即使用
  goShopList(e) {
    wx.navigateTo({
      url: `/pages/card/relationGoods/relationGoods?id=${this.data.info.upkeep_no}&type=2&judge_click=${this.data.judge_click}`
    })
  },
  // 打开分享
  async giveFriend() {
    if (this.data.give_list.length === 0 || this.data.give_list.every(ele => (ele.num - ele.used_num) === 0)) {
      wx.showToast({
        title: '当前无可赠送项目',
        icon: 'none'
      })
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
        message
      } = await cardNoCreateApi()
      if (statusCode === 200) {
        if (code === 0) {
          this.setData({
            show_give_project: true,
            upkeep_no_give: data.upkeep_no
          })
        }
      } else {
        showMessage({
          title: '拉取项目失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('卡详情-giveFriend', err)
    }
    wx.hideLoading()
  },
  // 关闭分享
  cancelShare() {
    this.setData({
      show_give_project: false
    })
  },
  // 确认分享事件
  async createCard (params) {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await createDaughterCardApi(params)
      if (statusCode === 200) {
        if (code === 0) {
          this.setData({
            upkeep_customer_id: data.upkeep_customer_id
          })
        }
      } else {
        showMessage({
          title: '赠送好友失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('卡详情-createCard', err)
    }
  },
  // 确定分享
  onShareAppMessage(e) {
    let url = ''
    let title = ''
    if (e.target.dataset.type === 'sharemodel') {
      title = "一张养护卡，养护无难事！"
      console.log('sharemodel')
      url = `pages/card/purchaseDetails/purchaseDetails?share=1&card_id=${this.data.info.card_id}`
      // 有门店id,则分享带上门店id
      let current_store_id = wx.getStorageSync('current_store_id')
      if (current_store_id) {
        url = url + '&current_store_id=' + current_store_id
      }
    } else {
      title = '送你一张养护卡，让你的爱车更棒哦！'
      this.setData({
        show_give_project: false
      })
      let give_list = e.target.dataset.items
      let params = {
        upkeep_no: this.data.upkeep_no_give,
        upkeep_customer_id: this.data.info.id,
        item : []
      }
      give_list.forEach(v => {
        if (v.give_num > 0) {
          params.item.push({
            id: v.id,
            name: v.name,
            description: v.description,
            num: v.give_num
          })
        }
      })
      this.createCard(params)
      url = `pages/card/receiveCard/receiveCard?share=1&upkeep_no_give=${this.data.upkeep_no_give}`
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
    }
    return {
      title: title,
      imageUrl: 'https://oss1.chedianai.com/wechat/share-card.png',
      path: url,
    };
  },
	async onLoad(option) {
    if (option.id) {
      this.setData({id: option.id})
    }
    if (option.order_no) {
      this.setData({order_no: option.order_no})
    }
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
        await this.getCardDetail()
        this.getMyDataInfo()
      }
    }
  },
  async onShow () {
    if(globalData.is_registered === 1) {
      await this.getCardDetail()
      this.getMyDataInfo()
    }
  }
});