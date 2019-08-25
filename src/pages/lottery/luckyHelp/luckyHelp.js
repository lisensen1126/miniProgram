// 获取全局应用程序实例对象
// const app = getApp();
import {getLotteryCoupons} from '@/libs/modules/lottery'

const {showMessage, globalData, cdpReport } = getApp()

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    title: '',
  },
  // 跳转抽奖
  goLucky () {
    wx.navigateBack()
  },
  // 获取抽奖信息
  async getCoupons () {
    let self = this
    let res = await getLotteryCoupons(self.data.activity_id)
    if (res.statusCode === 200) {
      self.setData({description: res.data.description})
      self.setData({start_time: res.data.start_time.slice(0, 10)})
      self.setData({end_time: res.data.end_time.slice(0, 10)})
    } else {
      showMessage({
        title: '你的网络好像罢工了',
        content: '我不喜欢网络罢工，快去检查下吧',
      })
    }
  },
  // 生命周期函数--监听页面加载
  onLoad (option) {
    wx.hideShareMenu()
    this.setData({
      topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
      'activity_id': option.activity_id,
      'share': option.share,
    })
  },
  onShow () {
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间，cdp上报用
    })     
    this.getCoupons()
  },
})
