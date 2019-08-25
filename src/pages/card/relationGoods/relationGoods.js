
import { getCardGoodsList, getMyCardGoodsList } from '@/libs/modules/mycard'

const {
  showMessage,
  globalData,
} = getApp()

Page({
	// 页面的初始数据
	data: {
    list: [],
    isinitiated: false
  },
  // 获取卡详情数据
  async getDataInfo() {

    let params = {
      upkeep_info_id: this.data.choosed_item_id
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
      } = await getCardGoodsList(params)
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200) {
        if (code === 0){
          this.setData({
            list: data
          })
        }
      } else {
        showMessage({
          title: '获取养护卡列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('养护卡关联商品-getDataInfo', err)
    }
    wx.hideLoading()

  },
  // 获取我的卡详情数据
  async getMyDataInfo() {

    let params = {
      upkeep_no: this.data.choosed_item_id
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
      this.setData({
        isinitiated: true
      })
      if (statusCode === 200) {
        if (code === 0){
          this.setData({
            list: data
          })
        }
      } else {
        showMessage({
          title: '获取养护卡列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('养护卡关联商品-getMyDataInfo', err)
    }
    wx.hideLoading()

  },
  /**
   * 去详情
   * @param {*} e 选中商品
   */
  goDetail(e) {
    if (this.data.type === 1 || this.data.judge_click == 2) {
      return
    }
    let type = parseInt(e.currentTarget.dataset.item.type)
    let customize = {
      spuId: e.currentTarget.dataset.item.basic_spu_id ? parseInt(e.currentTarget.dataset.item.basic_spu_id) : '',
      skuId: e.currentTarget.dataset.item.basic_sku_id ? parseInt(e.currentTarget.dataset.item.basic_sku_id) : '',
    }
    if (type === 1) {
      wx.navigateTo({
        url: '/pages/mall/goodsDetail/goodsDetail?spu_id='+e.currentTarget.dataset.item.basic_spu_id+'&sku_id='+e.currentTarget.dataset.item.basic_sku_id
      })
    }
    if (type === 2) {
      wx.navigateTo({
        url: '/pages/mall/serviceDetail/serviceDetail?spu_id='+e.currentTarget.dataset.item.basic_spu_id
      })
    }
  },
	onLoad(options) {
    wx.hideShareMenu()
    if (options.judge_click) {
      this.data.judge_click = options.judge_click
    }
    this.setData({
      choosed_item_id: options.id,
      topbarHeight: globalData.topbarHeight,
      type: Number(options.type)      // 1.从购卡详情跳转 2.我的卡详情跳转
    })
    if (this.data.type === 1) {
      this.getDataInfo()
    } else if (this.data.type === 2) {
      this.getMyDataInfo()
    } 
	},
	onShow() {
    if (this.data.type === 1) {
      this.getDataInfo()
    } else if (this.data.type === 2) {
      this.getMyDataInfo()
    } 
  }
})