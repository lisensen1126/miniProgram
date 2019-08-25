import {
  addCarInfo,
  attrProvince
} from '@/libs/modules/user'
// import {redirectUrl} from '@/libs/utils'
// 优惠券
import {getCouponStateApi} from '@/libs/modules/coupon'

const {
  globalData,
  showMessage,
  isRegistered,
  cdpReport
} = getApp()

Page({
  data: {
    carModel: null,
    mileage: '',
    isLoading: false,
    province: '京',
    // provinceList: ['京', '沪', '粤', '浙', '津', '渝', '川', '苏', '鄂', '皖', '湘', '闽', '黑', '吉', '辽', '鲁', '冀', '甘', '陕', '宁', '豫', '晋', '赣', '琼', '贵', '黔', '云', '桂', '青', '新', '蒙', '藏', '使', '临'],
    licensePartial: '',
    licenseInvalid: true,
    licensePlate: '',
    isIndex: false,
    isShowCoupon: false, // 控制分享有礼弹框变量
    is_default: false,
    is_first: false,
    recommend_coupon: [],
    show_home: false,
    show_warn: true, // 是否展示头部提示
    is_input: true, // 是否在输入车牌号
    is_choose_province: false, // 是否选择省
    is_click_close: false, // 是否手动点击顶部提示
  },
  toggleChoose() {
    if (this.data.is_first) return
    let val = !this.data.is_default
    this.setData({
      is_default: val
    })
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
  // 展示车牌键盘
  provinceChange() {
    this.setData({
      is_input: false,
      is_choose_province: true
    })
  },
  // 历程获取焦点
  getFocus() {
    this.setData({
      is_input: false,
      is_choose_province: false
    })
    // 校验车牌是否填写正确
    this.checkPlate()
  },
  // 线上车牌键盘
  showKey() {
    this.setData({
      is_input: true,
      is_choose_province: false
    })
  },
  // 点击保存车牌好键盘
  saveData() {
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
  // 校验警告是否展示
  getWarn() {
    // 如果手动点击关闭提示
    if (this.data.is_click_close) return
    let show_warn = true
    // 选到最后一项 且 输入历程 且 车牌正确
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
  // 去选择车型页面 url=""
  goChooseBrand() {
    // 校验车牌是否填写正确
    this.checkPlate()
    wx.navigateTo({
      url: '../../vehicle/vehicleBrandSelector/vehicleBrandSelector'
    })
  },
  // 车牌检验
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

  async updateVehicle() {
    let that = this
    if (!this.data.carModel || !this.data.licenseInvalid) {
      return
    }

    if (this.data.mileage > 999999 || parseInt(this.data.mileage) === 0) {
      showMessage({
        title: '警告',
        content: '里程范围为1 至 999999km',
      })
      return
    }
    const params = {
      mileage: this.data.mileage || 0,
      license_plate: this.data.licensePlate,
    }
    // 选择了车牌
    if (this.data.carModel.carpart_brand_id) {
      params.carpart_brand_id = this.data.carModel.carpart_brand_id // 品牌id
      params.brand_name = this.data.carModel.brand_name // 品牌名称
      params.logo = this.data.carModel.brand_logo_url // 车型logo
    }
    // 选择了车型
    if (this.data.carModel.carpart_model_id) {
      params.carpart_model_id = this.data.carModel.carpart_model_id // 车型id
      params.model_name = this.data.carModel.model_name // 车型名称
    }
    // 选择了具体车型
    if (this.data.carModel.id) {
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
    params.is_default = this.data.is_default ? 1 : 0 // 排量
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
      } = await addCarInfo(params)
      if (statusCode === 200) {
        if (code === 700) {
          showMessage({
            title: '添加车辆失败',
            content: `${message}`,
          })
          wx.hideLoading()
          return
        }
        if(code === 20009){
          showMessage({
            title: '添加车辆失败',
            content: `${message}`,
          })
          wx.hideLoading()
          return
        }
        if(code !== 0){
          showMessage({
            title: '修改车辆信息失败',
            content: `${message}`,
          })
          wx.hideLoading()
          return
        }
        globalData.vehicleSelection = null
        if (data.is_first) {
          this.fetchCouponList()
        } else {
          if (this.data.is_server - 0 === 1) {
            wx.redirectTo({
              url: '/pages/vehicle/vehiclesMultiple/vehiclesMultiple',
            })
          } else {
            wx.navigateBack({
              delta: 1,
            })
          }
        }  
      } else {
        showMessage({
          title: '修改车辆信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('新增车辆-updateVehicle:', err)
    }
    this.setData({
      isLoading: false,
    })
    wx.hideLoading()
  },

  // h获取默认车牌区
  async getAttrProvince() {
    try {
      const {
        statusCode,
        data,
        message,
        code
      } = await attrProvince()
      if (statusCode === 200) {
        this.setData({
          province: data.province,
        })
      } else {
        showMessage({
          title: '获取默认省失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('新增车辆-getAttrProvince:', err)
    }
  },

  // 获取推送的优惠券
	async fetchCouponList () {
		try {
      const {statusCode, data, code,} = await getCouponStateApi({
				from_type: 3
			})
      if (statusCode === 200 && code === 0) {
				if (data.length > 0) {
					this.setData({
            recommend_coupon: data,
						isShowCoupon: true,
					})
				}
			} else {
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      console.error('新增车辆-fetchCouponList:', err)
    }
  },

  // 关闭分享有礼
  couponCancel() {
   this.setData({
     isShowCoupon:false
   })
   wx.navigateBack({
    delta: 1,
  })
  },
  async onLoad(option) {
    let pages = getCurrentPages();
    wx.hideShareMenu()
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
      show_home: pages.length === 1 ? true : false,
      is_server: option.is_server || 0
    })     
    globalData.vehicleSelection = null
    this.getAttrProvince()
    if (option.index) {
      this.setData({
        isIndex: option.index
      })
    }
    if (option.is_first) {
      this.setData({
        is_first: true,
        is_default: true,
      })
    }
    if(globalData.is_registered === 2) {
      await isRegistered()
    }
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
  },

  async onShow() {
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
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