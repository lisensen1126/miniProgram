import {fetchVehcileTypes, fetchVehcileTypeDetail} from '@/libs/modules/vehicle'

const {globalData, showMessage,cdpReport } = getApp()

Page({
  data: {
    list: [],
    model: null,
  },

  async fetchTypeList (id) {
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await fetchVehcileTypes(id)
      if (statusCode === 200 && code === 0) {
        data.forEach((item, index, list) => {
          item.isFirstOfGroup = this.isFirstOfGroup(index, list)
        })
        this.setData({
          list: data,
        })
      } else {
        showMessage({
          title: '获取列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('选择车型-fetchTypeList:', err)
    }
    wx.hideLoading()
  },

  // 确认车型选择---只选择了车型
  subModel () {
    let data = {
      brand_logo_url: this.data.model.logo, // 品牌logo
      carpart_brand_id: this.data.model.vehicle_brand_id, // 品牌id
      brand_name: this.data.model.brand_name, // 品牌名称
      carpart_model_id: this.data.model.id, // 车型id
      model_name: this.data.model.name, // 车型名称
    }
    globalData.vehicleSelection = data
    wx.navigateBack({
      delta: 2,
    })
  },

  async selectVehicleType (e) {
    const id = e.currentTarget.dataset.vehicleId
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await fetchVehcileTypeDetail(id)
      if (statusCode === 200 && code === 0) {
        globalData.vehicleSelection = data
      } else {
        showMessage({
          title: '选择车型失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('选择车型-selectVehicleType:', err)
    }
    wx.hideLoading()
    wx.navigateBack({
      delta: 2,
    })
  },

  // utils
  isFirstOfGroup (index, list) {
    return !index || list[index].product_year !== list[index - 1].product_year
  },

  onLoad (option) {
    wx.hideShareMenu()
    this.setData({
      topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
      model: globalData.modelSelection,
    })
    this.fetchTypeList(option.modelId)
  },
})
