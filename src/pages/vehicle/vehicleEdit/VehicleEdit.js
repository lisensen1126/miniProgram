import {
  deleteApi,
  updateVehicleInfo
} from '@/libs/modules/user'

const {
  globalData,
  showMessage,
} = getApp()

Page({
  data: {
    carModel: {},
    choose_type: false,
    mileage: '',
    isLoading: false,
    province: '京',
    // provinceList: ['京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼', '川', '贵', '云', '陕', '甘', '青', '台', '蒙', '桂', '宁', '新', '藏', '澳', '军', '海', '航', '警', '使', '领'],
    licensePartial: '',
    licenseInvalid: true,
    licensePlate: '',
    car_id: '', // 车辆id
    show_warn: true, // 是否展示头部提示
    is_input: false, // 是否在输入车牌号
    is_choose_province: false, // 是否选择省
    is_click_close: false, // 是否手动点击顶部提示
    has_brand_id: 2, // 是否有品牌信息
  },
  // 保存
  saveData() {
    let _this = this
    if (!_this.data.carModel || !_this.data.licenseInvalid || !this.data.has_brand_id) {
      return
    }
    if (this.data.mileage > 999999 || parseInt(this.data.mileage) === 0) {
      showMessage({
        title: '警告',
        content: '里程范围为1 至 999999km',
      })
      return
    }
    let params = {
      vehicle_id: _this.data.car_id,
      license_plate: _this.data.licensePlate,
      mileage: _this.data.mileage
    }
    if (this.data.carModel.carpart_brand_id && this.data.choose_type) {
      params.carpart_brand_id = this.data.carModel.carpart_brand_id // 品牌id
      params.brand_name = this.data.carModel.brand_name // 品牌名称
      params.logo = this.data.carModel.brand_logo_url // 车型logo
    }
    // 选择了车型
    if (this.data.carModel.carpart_model_id && this.data.choose_type) {
      params.carpart_model_id = this.data.carModel.carpart_model_id // 车型id
      params.model_name = this.data.carModel.model_name // 车型名称
    }
    // 选择了具体车型
    if (this.data.carModel.id && this.data.choose_type) {
      params.carpart_brand_id = this.data.carModel.brand.id // 品牌id
      params.brand_name = this.data.carModel.brand_name // 品牌名称
      params.logo = this.data.carModel.brand_logo_url // 车型logo
      params.carpart_model_id = this.data.carModel.model.id // 车型id
      params.model_name = this.data.carModel.model_name // 车型名称
      params.carpart_vehicle_id = this.data.carModel.id // 具体车型id
      params.series_name = this.data.carModel.series_name // 车系名称
      params.vehicle_name = this.data.carModel.sales_name // 具体车型名称
      params.product_year = this.data.carModel.product_year // 车型年份
      params.output_volume = this.data.carModel.displacement // 排量
    }
    if (!this.data.choose_type) {
        // 选择了车牌
      if (this.data.carModel.carpart_brand_id) {
        params.carpart_brand_id = this.data.carModel.carpart_brand_id // 品牌id
        params.brand_name = this.data.carModel.brand_name // 品牌名称
        params.logo = this.data.carModel.logo // 车型logo
      }
      // 选择了车型
      if (this.data.carModel.carpart_model_id) {
        params.carpart_model_id = this.data.carModel.carpart_model_id // 车型id
        params.model_name = this.data.carModel.model_name // 车型名称
      }
      // 选择了具体车型
      if (this.data.carModel.carpart_vehicle_id) {
        params.carpart_brand_id = this.data.carModel.carpart_brand_id // 品牌id
        params.brand_name = this.data.carModel.brand_name // 品牌名称
        params.logo = this.data.carModel.logo // 车型logo
        params.carpart_model_id = this.data.carModel.carpart_model_id // 车型id
        params.model_name = this.data.carModel.model_name // 车型名称
        params.carpart_vehicle_id = this.data.carModel.carpart_vehicle_id // 具体车型id
        params.series_name = this.data.carModel.series_name // 车系名称
        params.vehicle_name = this.data.carModel.vehicle_name // 具体车型名称
        params.product_year = this.data.carModel.product_year // 车型年份
        params.output_volume = this.data.carModel.output_volume // 排量
      }
    }
    this.updateVehicle(params)
  },
  delData () {
    showMessage({
      title: '提示',
      content: '确定删除该车辆吗？',
      isRejectable: true,
      cancelText: '取消',
      resolve: () => {
        this.delFnc()
      }
    })
  },
  // 删除
  async delFnc () {
    let vehicle_id = this.data.car_id
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    try {
      const {statusCode, data, code, message} = await deleteApi({
        vehicle_id: vehicle_id
      })
      wx.hideLoading()
      if (statusCode === 200) {
        if (code === 0) {
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              setTimeout(() => {
                wx.navigateBack({
                  delta: 1
                })
              }, 2000)
            }
          })
        } else {
          wx.showToast({
            title: '删除失败',
            icon: 'none',
            duration: 2000,
          })
        }
      } else {
        wx.showToast({
          title: '删除失败',
          icon: 'none',
          duration: 2000,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('修改车辆-delFnc:', err)
    }
  },

  bindMileageChange(e) {
    this.setData({
      mileage: e.detail.value,
      //  changed: this.data.mileage !== e.detail.value,
    })
  },
  // 关闭上面提示
  closeTip() {
    this.setData({
      show_warn: false,
      is_click_close: true,
    })
  },
  // 去选择车型页面 url=""
  goChooseBrand() {
    // 校验车牌是否填写正确
    this.checkPlate()
    wx.navigateTo({
      url: '../../vehicle/vehicleBrandSelector/vehicleBrandSelector'
    })
  },
  // 省简称的回调
  getProvince (e) {
    this.setData({
      province: e.detail,
      is_choose_province: false,
      licensePlate: e.detail + this.data.licensePartial
    })
    // 校验车牌是否填写正确
    this.checkPlate()
    this.getWarn()
  },
  // 展示省键盘
  provinceChange() {
    this.setData({
      is_input: false,
      is_choose_province: true
    })
  },
  // 线上车牌键盘
  showKey() {
    this.setData({
      is_input: true,
      is_choose_province: false
    })
    // 校验车牌是否填写正确
    this.checkPlate()
    this.getWarn()
  },
  // 历程获取焦点
  getFocus() {
    this.setData({
      is_input: false,
      is_choose_province: false
    })
    this.checkPlate()
  },
  // 点击保存车牌好键盘
  saveDataPlate() {
    this.setData({
      is_input: false,
    })
    this.getWarn()
  },
  // 检验车牌号
  checkPlate() {
    // 车牌校验正确
    if (this.checkLicense(this.data.licensePartial)) {
      this.setData({
        licenseInvalid: true,
      })
    } else {
      // 车牌校验失败
      this.setData({
        licenseInvalid: false,
      })
    }
  },
  // 历程输入
  getWarn() {
    if (this.data.is_click_close) return
    let show_warn = true
    // 如果上面显示 且 选到最后一项 且 输入历程 且 车牌正确
    if (this.data.carModel && this.data.carModel.id && this.data.mileage && this.data.licenseInvalid) {
      show_warn = false
    }
    this.setData({
      show_warn,
    })
  },
  // 点击添加车牌号键盘的回调
  changePlate(e) {
    let now_license = this.data.licensePartial
    this.setData({
      licensePartial: now_license + e.detail,
      licensePlate: this.data.province + now_license + e.detail,
    })
    // 校验车牌是否填写正确
    // this.checkPlate()
  },
  // 点击删除车牌号
  delPlate() {
    let now_license = this.data.licensePartial
    now_license = now_license.substr(0, now_license.length - 1)
    this.setData({
      licensePartial: now_license,
      licensePlate: this.data.province + now_license
    })
    // 校验车牌是否填写正确
    // this.checkPlate()
  },

  // validators
  checkLicense(val) {
    if (val === '') {
      return true
    } else {
      // 简称是使
      if (this.data.province === '使') {
        const pattern = /^[0-9]{6}$/
        return pattern.test(val)
      } if (this.data.province === '临') {
        // 临 后是随便6位
        if (val.length !== 6) {
          return false
        } else {
          return true
        }
      } else {
        const pattern = /^([a-zA-Z]{1})([A-Za-z0-9]{5}|[DdFf][A-HJ-NP-Za-hj-np-z0-9][0-9]{4}|[0-9]{5}[DdFf]|[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1})$/
        return pattern.test(val)
      }
    }
  },
  /**
   * 编辑车辆
   * @param {请求参数} params 
   */
  async updateVehicle (params) {
    let that = this
    wx.showLoading({
      title: '保存中...',
      mask: true,
    })
    this.setData({
      isLoading: true,
    })
    try {
      const {
        statusCode,
        data,
        message,
        code
      } = await updateVehicleInfo(params)
      if (statusCode === 200) {
        if (code === 0) {
          wx.hideLoading()
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              wx.navigateBack({
                delta: 1
              })
            }
          })
        }
        if(code !== 0){
          showMessage({
            title: '修改车辆信息失败',
            content: `${message}`,
          })
          wx.hideLoading()
          return
        }   
      } else {
        showMessage({
          title: '修改车辆信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('修改车辆-updateVehicle:', err)
    }
    this.setData({
      isLoading: false,
    })
    wx.hideLoading()
  },
    
  async onLoad() {
    let item = wx.getStorageSync('car_info')
    globalData.vehicleSelection = null
    item.province = item.license_plate ? item.license_plate.slice(0, 1) : '京'
    item.licensePartial = item.license_plate ? item.license_plate.slice(1) : ''
    item.mileage = item.mileage || 0
    item.title = item.license_plate
    item.sales_name = item.vehicle_name
    item.id = item.carpart_vehicle_id
    this.setData({
      topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
      carModel: item,
      licensePartial: item.licensePartial,
      province: item.province,
      mileage: item.mileage === 0 ? '' : item.mileage,
      car_id: item.vehicle_id,
      licensePlate: item.license_plate,
      has_brand_id: item.carpart_brand_id, // 企微添加车辆没有brand_id
    })
    // 主要为了，校验从企业微信的错误车牌
    this.checkPlate()
    this.getWarn()
  },

  async onShow() {
    const carModel = globalData.vehicleSelection
    // 如果选择了车辆
    if (carModel) {
      let show_warn = true
      // 如果上面显示 且 选到最后一项 且 输入历程 且 车牌正确
      if ((carModel.id && this.data.mileage && this.data.licenseInvalid) || this.data.is_click_close) {
        show_warn = false
      }
      this.setData({
        carModel,
        is_input: false,
        is_choose_province: false,
        show_warn,
        choose_type: true,
        has_brand_id: 2, // 从小程序添加的车型 一定会有品牌
      })
    } else {
      this.setData({
        is_input: false,
        is_choose_province: false
      })
    }
  },
  onUnload () {
    let pages = getCurrentPages();//当前页面
    if(pages.length !== 1) {
      let prevPage = pages[pages.length - 2];//上一页面
      prevPage.setData({//直接给上一页面赋值
        go_type: null,
      });
    }
	}, 
})