
import {autioshopRedirect} from '@/libs/modules/h5'

const {showMessage, globalData } = getApp()
Page({
  data: {
    h5_url: '',
    top_height: 0, // padding高度
  },
  // 获取跳转url
  async getItemDetail () {
    try {
      const {statusCode, data, code, message} = await autioshopRedirect({
        page: this.data.page,
      })
      if (statusCode === 200) {
        this.setData({
          h5_url: 'https://apidzchangyi.eshop1001.com/WeChatH5/Auth?CompanyId=' + data.CompanyId + '&ShopId=' + data.ShopId + '&LicensePlate=' + data.LicensePlate + '&noncestr=' + data.noncestr + '&timestamp=' + data.timestamp + '&page=' + data.page  + '&signature=' + data.signature,
        })
        console.log('h5页面url,别删',this.data.h5_url)
      } else {
        showMessage({
          title: '接口调用失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('个人中心-getItemDetail', err)
    }
  },
  onLoad (option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    wx.hideShareMenu()
    this.setData({
      page: option.page,
      isEmpty: option.isEmpty
    })
    let title = '个人中心'
    switch (option.page) {
      case 'CustCardList':
        title = '会员卡'
        break;
      case 'PageRecord':
        title = '消费记录'
        break;
      case 'PageConsumerCheckCars':
        title = '车检报告'
        break;
      case 'GetCheckOrder':
        title = '车检报告'
        break;
      case 'PageDetail':
        title = '消费记录'
        break;
      case 'CustCardDetail':
        title = '会员卡'
        break;
    }
    this.setData({
      page_title: title,
    })
    wx.setNavigationBarTitle({
      title: title
    })
  },
  async onShow () {
    if (this.data.isEmpty != 'off') this.getItemDetail()
  },  
})
