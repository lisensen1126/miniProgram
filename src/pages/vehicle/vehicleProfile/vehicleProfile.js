import {updateVehicleInfo} from '@/libs/modules/user'

const {globalData, showMessage, vehicleRedirect} = getApp()

Page({
  data: {
    license_plate: '',
    province: 9,
    provinceList: ['京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼', '川', '贵', '云', '陕', '甘',  '青', '台', '蒙', '桂', '宁', '新', '藏', '澳', '军', '海', '航', '警', '使', '领'],
    licensePartial: 'E259B5',
    carpart_vehicle_id: null,
    logo: '',
    vehicleTypeName: '',
    choosingType: false,
    start_time: '',
    mileage: 0,
    last_maintained_at: '',
    updated_at: '',
    changed: false,
    timer: null,
    licenseInvalid: false,
    initialized: false,
  },
  onLoad() {
    wx.hideShareMenu()
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    })     
  },
  provinceChange (e) {
    this.setData({
      province: e.detail.value,
      license_plate: this.licenseFormat(e.detail.value, this.data.licensePartial),
    })
    if (this.checkLicense(this.data.licensePartial)) {
      this.setData({
        licenseInvalid: false,
      })
      this.save()
    } else {
      this.setData({
        licenseInvalid: true,
      })
    }
  },
  licenseChange (e) {
    this.setData({
      licensePartial: e.detail.value.toUpperCase().replace(/\s+/g, ''),
      license_plate: this.licenseFormat(this.data.province, e.detail.value.toUpperCase().replace(/\s+/g, '')),
    })
    if (this.checkLicense(this.data.licensePartial)) {
      this.setData({
        licenseInvalid: false,
      })
      this.save()
    } else {
      this.setData({
        licenseInvalid: true,
      })
    }
  },
  changeVehicleType (e) {
    this.setData({
      choosingType: true,
    })
    wx.navigateTo({
      url: '../vehicleBrandSelector/vehicleBrandSelector',
    })
    // cdp-点击跳转页面事件
    let target = {
      url: 'pages/vehicle/vehicleTypeSelector/vehicleTypeSelector',
    }
    cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)     
  },
  registerDateChange (e) {
    this.setData({
      start_time: this.dateTransfer(e.detail.value),
    })
    this.save()
  },
  mileageChange (e) {
    this.setData({
      mileage: e.detail.value,
    })
    clearTimeout(this.data.timer)
    var cache = setTimeout(() => {
      this.save()
    }, 400)
    this.setData({
      timer: cache,
    })
  },
  maintainDateChange (e) {
    this.setData({
      last_maintained_at: this.dateTransfer(e.detail.value),
    })
    this.save()
  },
  async save () {
    if (this.data.changed) {
      return
    }
    wx.showLoading({
      title: '保存中',
      mask: true,
    })
    this.setData({
      changed: true,
    })
    try {
      const {statusCode, data, message, code} = await updateVehicleInfo({
        customer_id: globalData.userInfo.id,
        vehicle_id: globalData.userInfo.carInfo.vehicle_id,
        license_plate: this.data.licenseInvalid ? undefined : this.data.license_plate,
        carpart_vehicle_id: this.data.carpart_vehicle_id,
        start_time: this.dateTransfer(this.data.start_time) || undefined,
        mileage: this.data.mileage,
        last_maintained_at: this.dateTransfer(this.data.last_maintained_at) || undefined,
      })
      if (statusCode === 200 && code === 0) {
        globalData.userInfo.carInfo = data
        this.setData({
          updated_at: this.datetimeFormat(data.updated_at),
          licensePartial: data.license_plate ? data.license_plate.slice(1) : '',
          province: data.license_plate ? this.provinceTransfer(data.license_plate) : 9,
          licenseInvalid: !data.license_plate,
          vehicle_info: {...data},
        })
        wx.showToast({
          title: '保存成功',
          icon: 'none',
          duration: 700,
          mask: true,
        })
      } else {
        showMessage({
          title: '修改车辆信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('爱车档案-save:', err)
    }
    this.setData({
      changed: false,
    })
    wx.hideLoading()
  },

  // validators
  checkLicense (val) {
    const pattern = /^([a-zA-Z]{1})([A-Za-z0-9]{5}|[DdFf][A-HJ-NP-Za-hj-np-z0-9][0-9]{4}|[0-9]{5}[DdFf])$/
    return pattern.test(val)
  },

  // utils
  dateTransfer (val) {
    const pickerPattern = /^(\d{4})-(\d{2})-(\d{2})/
    const pickerPattern2 = /^(\d{4})\/(\d{2})\/(\d{2})/
    if (!val) {
      return ''
    }
    if (pickerPattern.test(val)) {
      return `${val.match(pickerPattern)[1]}/${val.match(pickerPattern)[2]}/${val.match(pickerPattern)[3]}`
    } else if (pickerPattern2.test(val)) {
      return `${val.match(pickerPattern2)[1]}-${val.match(pickerPattern2)[2]}-${val.match(pickerPattern2)[3]}`
    }
  },
  datetimeFormat (val) {
    return val.replace(/-/g, '/')
  },
  licenseFormat (province, partial) {
    return this.data.provinceList[province] + partial
  },
  provinceTransfer (val) {
    const p = val.slice(0, 1)
    if (p) {
      return this.data.provinceList.indexOf(p)
    } else {
      return 0
    }
  },

  // life cycle hooks
  async onShow () {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    })     
    if (this.data.choosingType) {
      if (globalData.vehicleSelection) {
        const vehicleInfo = {...globalData.vehicleSelection}
        globalData.vehicleSelection = null
        this.setData({
          carpart_vehicle_id: vehicleInfo.id,
          logo: vehicleInfo.brand.logo_url,
          vehicleTypeName: `${vehicleInfo.model_name} ${vehicleInfo.sales_name} ${vehicleInfo.product_year}`,
          choosingType: false,
        })
        this.save()
      } else {
        this.setData({
          choosingType: false,
        })
      }
    } else {
      wx.showLoading({
        title: '加载中...',
        mask: true,
      })
      await vehicleRedirect()
      const data = globalData.userInfo.carInfo
      this.setData({
        initialized: true,
        license_plate: data.license_plate,
        province: data.license_plate ? this.provinceTransfer(data.license_plate) : 9,
        licensePartial: data.license_plate ? data.license_plate.slice(1) : '',
        carpart_vehicle_id: data.carpart_vehicle_id,
        vehicleTypeName: `${data.model_name} ${data.vehicle_name} ${data.vehicle_params?data.vehicle_params.product_year:''}`,
        start_time: this.dateTransfer(data.start_time),
        mileage: data.mileage,
        last_maintained_at: this.dateTransfer(data.last_maintained_at),
        updated_at: this.datetimeFormat(data.updated_at),
        licenseInvalid: !data.license_plate,
        vehicle_info: {...data},
      })
      wx.hideLoading()
    }
  },
})
