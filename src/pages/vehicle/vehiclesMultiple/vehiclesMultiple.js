import {updateVehicleInfo, getCarList, settingDefault, deleteApi} from '@/libs/modules/user'

const { showMessage, cdpReport, globalData } = getApp()
// vehicleRedirect
Page({
  data: {
    license_plate: '',
    province: 9,
    provinceList: ['京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼', '川', '贵', '云', '陕', '甘', '青', '台', '蒙', '桂', '宁', '新', '藏', '澳', '军', '海', '航', '警', '使', '领'],
    licensePartial: 'E259B5',
    carpart_vehicle_id: null,
    logo: '',
    vehicleTypeName: '',
    mileage: 0,
    last_maintained_at: '',
    changed: false,
    timer: null,
    licenseInvalid: false,
    initialized: false,
    carList: [],
    tempProvinceIndex: 0,
    tempChooseIndex: 0,
    pageShow: false,
    top_height: 0, // padding高度
  },
  // 编辑页面
  goEdit (e) {
    let item = e.currentTarget.dataset.item
    wx.setStorageSync('car_info', item)
    wx.navigateTo({
      url: '../VehicleEdit/VehicleEdit',
    })
  },
  // 选择默认
  toggleChoose (e) {
    let index = e.currentTarget.dataset.index
    let temp = this.data.carList
    if (temp[index].is_default) {
      return false
    }
    temp.map(item => {
      item.is_default = false
      return item
    })
    temp[index].is_default = true
    this.setData({
      carList: temp,
    })
    this.settingDefaultCar(temp[index])
  },
  // 添加车辆信息
  goAddCar (e) {
    let url = '/pages/vehicle/vehicleAdd/vehicleAdd'
    if (this.data.carList.length === 0) {
      url += '?is_first=1'
    }
    wx.navigateTo({
      url: url,
    })
    // cdp-点击引导添加车辆
    let target = {
      url: '/pages/vehicle/vehicleAdd/vehicleAdd',
    }
    cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)
  },
  // 获取车辆信息
  async getCarListFnc () {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await getCarList()
      if (statusCode === 200 && code === 0) {
        let tempdata = data.map(item => {
          item.title = item.license_plate
          item.desTxt = ''
          if (item.product_year) {
            item.desTxt = (item.model_name ? item.brand_name + ' ' + item.model_name + '-' : '') + (item.product_year ? item.product_year + '款 ' : '') + (item.vehicle_name ? item.vehicle_name : '')
          } else if (item.model_name) {
            item.desTxt = item.brand_name + ' ' + item.model_name
          }
          if (!item.desTxt) {
            item.desTxt = item.brand_name
          }
          return item
        })
        this.setData({
          initialized: true,
          'carList': tempdata,
        })
        wx.hideLoading()
      }
    } catch (err) {
      wx.hideLoading()
      console.error('爱车档案-getCarListFnc:', err)
    }
    this.setData({
      pageShow: true,
    })
  },
  async settingDefaultCar (id) {
    wx.showLoading({
      title: '设置中...',
      mask: true,
    })
    try {
      const {statusCode, data, code} = await settingDefault(id)
      if (statusCode === 200) {
        if (code === 0) {
          wx.showToast({
            title: '保存成功',
            icon: 'none',
            duration: 700,
            mask: true,
          })
          // getCurrentUserInfo()
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none',
            duration: 700,
            mask: true,
          })
        }
        wx.hideLoading()
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 700,
          mask: true,
        })
        wx.hideLoading()
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none',
        duration: 700,
        mask: true,
      })
    }
  },
  onLoad () {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    let pages = getCurrentPages()
    if (pages.length === 1) {
      this.setData({
        showHome: true,
      })
    }
    wx.hideShareMenu()
  },
  async onShow () {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1,
    })
    this.getCarListFnc()
  },
  onUnload () {
    let data = ''
    let pages = getCurrentPages()// 当前页面
    if (pages.length !== 1) {
      let prevPage = pages[pages.length - 2]// 上一页面
      prevPage.setData({// 直接给上一页面赋值
        item: data,
        go_type: null,
      })
    }
  },
})
