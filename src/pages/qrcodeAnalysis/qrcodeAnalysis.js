import {statisticsInsert} from '@/libs/modules/common'

const {showMessage, globalData} = getApp()
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    scene: '', // scene参数
  },
  onLoad: function (options) {
    let self = this
    if (options && options.scene) {
      self.data.scene = options.scene
    }
  },
  onShow: function () {
    const self = this
    globalData.order_source = 2
    wx.showLoading({
      title: '跳转中',
    })
    self.goPage()
  },
  // 处理跳转路径
  goPage () {
    if (this.data.scene && this.data.scene !== 'undefined') {
      // scene生成规则 scene = '1-201-100-201-22'
      // 用-进行分割
      // 第一个为跳转页面(1：商品详情；2：服务详情；3：商城小程序首页)
      // 第二个为spu_id（有就传，没有就传0）
      // 第三个为sku_id (有就传，没有就传0)
      // 第四个为门店id
      // 第五个为聚合小程序用户id
      let infoArr = this.data.scene.split('-')
      if (infoArr[0] == '1' || infoArr[0] == '2' || infoArr[0] == '3') {
        wx.setStorageSync('current_store_id', infoArr[3]) // 存储当前门店id,请求所有接口时传参用
        this.qrcodeScanRecord(infoArr[0],infoArr[4])
      }
      if (infoArr[0] == '1') {
        wx.hideLoading()
        wx.redirectTo({
          url: `/pages/mall/goodsDetail/goodsDetail?spu_id=${infoArr[1]}&sku_id=${infoArr[2]}`
        })
      } else if (infoArr[0] == '2') {
        wx.hideLoading()
        wx.redirectTo({
          url: `/pages/mall/serviceDetail/serviceDetail?spu_id=${infoArr[1]}`
        })
      } else if (infoArr[0] == '3') {
        wx.hideLoading()
        wx.redirectTo({ url: '/pages/index/index' })
      } else {
        wx.redirectTo({ url: '/pages/index/index' })
        wx.hideLoading()
      }
    } else {
      wx.showLoading({
        title: '跳转中',
      })
      wx.redirectTo({ url: '/pages/index/index' })
      wx.hideLoading()
    }
  },
  // 调用二维码扫码记录接口，门店id这个请求参数已经写在接口请求的公共方法里
  async qrcodeScanRecord (type,hub_customer_id) {
    try {
      const {statusCode, code, message} = await statisticsInsert({
        source_type: type,
        hub_customer_id: hub_customer_id,
        operator_type: 4,
      })
      if (!statusCode === 200 || !code === 0) {
        showMessage({
          title: '记录失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('二维码中转页-qrcodeScanRecord:', err)
    }
  },
})
