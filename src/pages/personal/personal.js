import {
  myCouponsNumber,
  extendConfig,
  getVipCard,
  storeInfo,
  getCouponTotalApi
} from '@/libs/modules/user'
import {
  myBasic,
  myTodayReserve,
  myOther,
  myOrderCount
} from '@/libs/modules/personal'
import { sendFormId } from '@/utils/formid'
const {
  globalData,
  showMessage,
  isRegistered
} = getApp()
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    swiper: { // 预约列表初始化
      imgUrls: [],
      indicatorDots: false,
      autoplay: false,
      interval: 5000,
      duration: 1000,
      current: 0,
    },
    enxtendData: {},
    islogin: false, // 是否登录flag
    userInfo: undefined, // 用户信息
    desTxt: '', // 车辆品牌信息
    storePhone: '暂无联系方式', //个人中心手机号
    customer_id: null,
    h5_url: null,
    province: '', // 省份
    plate_num: '', // 车牌号
    top_height: 0, // 顶部位移距离
    is_top_bar_show: false, // 是否显示top_bar
    personal_body_mini: 'height: 318rpx; background-image: url("https://oss1.chedianai.com/images/assets/personal-body-mini.png")',
    personal_body_big: 'height: 400rpx; background-image: url("https://oss1.chedianai.com/images/assets/personal-body-big.png")',
    personal_girl_mini: 'height: 318rpx; background-image: url("https://oss1.chedianai.com/images/assets/personal-girl-mini.png")',
    personal_girl_big: 'height: 400rpx; background-image: url("https://oss1.chedianai.com/images/assets/personal-girl-big.png")',
    request_count: 0, // 完成请求的接口数, 为关闭 loading
    is_clicked: false, // 防多触
    total: 0, // 优惠券金额（添加车辆）
    first_vehicle: 1, // 是否为第一次添加车辆 0 是 1不是
    status: 2, // 是否开启完善车辆 1开启 2没开启
  },
  async onLoad() {
    this.setData({
      top_height: globalData.topbarHeight
    })
    // 判断是否判断过注册
    if (globalData.is_registered === 2) {
      await isRegistered()
      if (globalData.is_registered == 1) {
        this.onShow()
      } else {
        this.getCarCouponTotal()
      }
    } else {
      this.getCarCouponTotal()
    }
    this.getExtendConfig() // 获取门店扩展配置
  },
  async onShow() {
    let enxtendData = wx.getStorageSync('PER_EXTEND') || null
    this.setData({
      enxtendData,
    })
    // 没有注册 请出去 is_registered 0 未注册 1 注册、登录 2 未判断
    if(globalData.is_registered !== 1) {
      return
    }
    this.getCarCouponTotal()
    let userInfo = wx.getStorageSync('PER_INFO') || null
    let carInfo = wx.getStorageSync('CAR_NAME') || null
    // 进入页面的时间
    this.setData({
      islogin: true,
      desTxt: carInfo ? carInfo.desTxt : '',
      province: carInfo ? carInfo.province : '',
      plate_num: carInfo ? carInfo.plate_num : '',
      userInfo
    })

    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    this.getStoreInfo()
    this.getUserInfo() // 获取用户信息简介
    this.getOtherInfo() // 获取其他信息(购物车数量、爱车数量、默认车辆信息、施工录像的flag字段)
    this.getOrderInfo() // 获取订单数量
    this.getReserveInfo() // 获取预约数据
    this.getCouponsNumber() // 获取可用优惠券数量
    this.getVipCardNumber() // 获取会员卡数量
  },
  // formid 收集
  sendFormId,
  // 添加车辆有礼金额
  async getCarCouponTotal() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      let {statusCode, data, code, message} = await getCouponTotalApi()
      if (statusCode === 200 && parseInt(code) === 0) {
        // if (data.total > 0) {
        //   data.total = (data.total / 100).toFixed(2)
        // }
        this.setData({
          first_vehicle: data.first_vehicle,
          status: data.status,
          total: data.total,
        })
      } else {
        showMessage({
          title: '获取完善车辆获取金额失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      console.error('获取完善车辆获取金额失败', err)
    }
    wx.hideLoading()
  },
  // 获取用户信息简介
  async getUserInfo() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await myBasic()
      if (statusCode === 200 && parseInt(code) === 0) {
        let phone = data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        this.setData({
          'userInfo.name': data.name,
          'userInfo.avatar': data.avatar,
          'userInfo.phone': phone,
          'userInfo.sex': data.sex
        })
        globalData.phone = data.phone
        wx.setStorage({
          key: 'PER_INFO',
          data: data
        })
      } else {
        showMessage({
          title: '获取会员卡数量失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getUserInfo:', err)
    }
    this.hideLoading()
  },
  // 获取其他信息(购物车数量、爱车数量、默认车辆信息、施工录像的flag字段)
  async getOtherInfo() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await myOther()
      if (statusCode === 200 && parseInt(code) === 0) {
        this.setData({
          'userInfo.cart_num': data.cart_num,
          'userInfo.customer_id': data.customer_id,
          'userInfo.carInfo': data.carInfo,
          'userInfo.myCarCount': data.myCarCount,
          'userInfo.videoStatus': data.videoStatus,
          'userInfo.inspect_count': data.inspect_count,
          'userInfo.inspect_total': data.inspect_total,                   
          province: data.carInfo.license_plate ? data.carInfo.license_plate.substr(0, 1) : '',
          plate_num: data.carInfo.license_plate ? data.carInfo.license_plate.substr(1) : '',
        })
        this.data.h5_url = data.workend_host
        this.data.customer_id = data.customer_id
        wx.setStorage({
          key: 'PER_INFO',
          data: Object.assign(wx.getStorageSync('PER_INFO'), data)
        })
        let desTxt = ''
        // 默认页面展示车辆信息
        if (this.data.userInfo.carInfo) {
          let carInfo = this.data.userInfo.carInfo
          if (carInfo.product_year) {
            desTxt = (carInfo.model_name ? carInfo.brand_name + ' ' + carInfo.model_name + '-' : '') + (carInfo.product_year ? carInfo.product_year + '款 ' : '') + (carInfo.vehicle_name ? carInfo.vehicle_name : '')
          } else if (carInfo.model_name) {
            desTxt = carInfo.brand_name + ' ' + carInfo.model_name
          } else {
            desTxt = carInfo.brand_name
          }
          if (!carInfo.brand_name) {
            desTxt = '未知车型'
          }
          this.setData({
            desTxt: desTxt,
          })
        }
        wx.setStorage({
          key: 'CAR_NAME',
          data: {
            desTxt: desTxt,
            province: data.carInfo.license_plate ? data.carInfo.license_plate.substr(0, 1) : '',
            plate_num: data.carInfo.license_plate ? data.carInfo.license_plate.substr(1) : '',
          },
        })
      } else {
        showMessage({
          title: '获取其他信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getOtherInfo:', err)
    }
    this.hideLoading()
  },
  // 获取订单数量
  async getOrderInfo() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await myOrderCount()
      if (statusCode === 200 && parseInt(code) === 0) {
        this.setData({
          'userInfo.waitPayCount': data.waitPayCount,
          'userInfo.waitCheckCount': data.waitCheckCount,
          'userInfo.myReserveCount': data.myReserveCount,
        })
        wx.setStorage({
          key: 'PER_INFO',
          data: Object.assign(wx.getStorageSync('PER_INFO'), data)
        })
      } else {
        showMessage({
          title: '获取订单信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getOrderInfo:', err)
    }
    this.hideLoading()
  },
  // 获取预约数据
  async getReserveInfo() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await myTodayReserve()
      if (statusCode === 200 && parseInt(code) === 0) {
        // 今日预约数据时间格式化
        this.setData({
          'userInfo.todayReserveCount': data.todayReserveCount,
          'userInfo.todayReserveList': data.todayReserveList,
        })
        wx.setStorage({
          key: 'PER_INFO',
          data: Object.assign(wx.getStorageSync('PER_INFO'), data)
        })
      } else {
        showMessage({
          title: '获取预约信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getReserveInfo:', err)
    }
    this.hideLoading()
  },
  // 获取卡包数量
  async getVipCardNumber() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await getVipCard()
      if (statusCode === 200 && parseInt(code) === 0) {
        this.setData({
          'userInfo.CardNum': data.CardNum,
        })
        wx.setStorage({
          key: 'PER_INFO',
          data: Object.assign(wx.getStorageSync('PER_INFO'), data)
        })
      } else {
        showMessage({
          title: '获取会员卡数量失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getVipCardNumber:', err)
    }
    this.hideLoading()
  },
  // 获取可用优惠券数量
  async getCouponsNumber() {
    let params = {
      status: 1,
    }
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await myCouponsNumber(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        this.setData({
          'userInfo.count': data.count,
        })
        wx.setStorage({
          key: 'PER_INFO',
          data: Object.assign(wx.getStorageSync('PER_INFO'), data)
        })
      } else {
        showMessage({
          title: '获取可用优惠券数量失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getCouponsNumber:', err)
    }
    this.hideLoading()
  },
  // 获取门店扩展配置
  async getExtendConfig() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await extendConfig()
      if (statusCode === 200 && code === 0) {
        let obj = {}
        if (data.length > 0) {
          data.forEach(v => {
            obj[v.key] = v.value
          });
          this.setData({
            enxtendData: obj,
            // 'userInfo.enxtendData': obj
          })
          wx.setStorage({
            key: 'PER_EXTEND',
            data: obj,
          })
          wx.setStorage({
            key: 'PER_INFO',
            data: Object.assign(wx.getStorageSync('PER_INFO'), data)
          })
        }
      } else {
        showMessage({
          title: '获取门店扩展配置失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getExtendConfig:', err)
    }
    this.hideLoading()
  },
  // 跳转编辑个人信息页面
  goEdit(e) {
    // 没有登录 请走
    if (!this.isLogging()){
      return false
    }
    wx.navigateTo({
      url: '/pages/personalEdit/personalEdit',
    })
  },
  // 获取门店手机号
  async getStoreInfo() {
    try {
      const {
        statusCode,
        code,
        data,
        message
      } = await storeInfo({})
      if (statusCode === 200 && code === 0) {
        this.data.storePhone = data.business_phone ? data.business_phone : ''
      } else {
        showMessage({
          title: '获取门店信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('我的-getStoreInfo:', err)
    }
  },
  // 拨打电话
  makePhoneCall(e) {
    wx.makePhoneCall({
      phoneNumber: this.data.storePhone,
      success() {
      },
      fail() {
      },
    })
  },
  // 去订单列表
  goOrder(e) {
    let status = e.currentTarget.dataset.status
    if (this.isLogging()) {
      wx.navigateTo({
        url: '/pages/order/orderList/orderList?status=' + status,
      })
    }
  },
  // 去预约列表
  goreservation(e) {
    if (this.isLogging()) {
      wx.navigateTo({
        url: '/pages/myreservation/myreservation',
      })
    }
  },
  // 待评价
  goComment(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }

    wx.navigateTo({
      url: '/pages/perevaluate/storeEvaluate/storeEvaluate',
    })
  },
  // 管理爱车
  gomycar(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }
  
    wx.navigateTo({
      url: '/pages/vehicle/vehiclesMultiple/vehiclesMultiple',
    })
  },
  // 添加车辆信息
  goAddCar(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }

    wx.navigateTo({
      url: '/pages/vehicle/vehicleAdd/vehicleAdd?is_first=1',
    })
  },
  // 去施工录像列表
  govedio(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }

    let state = ''
    this.data.enxtendData.videotape === undefined ? state = 'off' : state = this.data.enxtendData.videotape
    // 有直播去直播页面，没有直播去录播列表
    if (e.currentTarget.dataset.value === 'OPEN' && this.data.enxtendData.videotape && this.data.enxtendData.videotape === 'on') {
      wx.navigateTo({
        url: '/pages/videos/constructionLive/constructionLive',
      })
    } else {
      wx.navigateTo({
        url: '/pages/videos/videoList/videoList?page=Videotape&isEmpty=' + state,
      })
    }
  },
  // 去领券中心
  async gowelfare(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }

    wx.navigateTo({
      url: '/pages/coupon/voucher/voucher',
    })
  },
  // 去购物车页面
  goShopping(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }

    wx.navigateTo({
      url: '/pages/shopCart/shopCart',
    })
  },
  // 跳转会员卡H5页面
  goVip(e) {
    if (this.isLogging()) {
      let state = ''
      this.data.enxtendData.membership === undefined ? state = 'off' : state = this.data.enxtendData.membership
      wx.navigateTo({
        url: '/pages/card/myCardBag/myCardBag',
      })
    }
  },
  // 跳转消费记录H5页面
  goConsumings(e) {
    if (this.isLogging()) {
      let state = ''
      this.data.enxtendData.consumption === undefined ? state = 'off' : state = this.data.enxtendData.consumption
      wx.navigateTo({
        url: '/pages/h5/autoshop?page=PageRecord&isEmpty=' + state,
      })
    }
  },
  // 跳转车检报告列表H5页面，待修改
  goInspection(e) {
    // 判断是否登录
    if (!this.isLogging()) {
      return
    }

    wx.navigateTo({
      url: '/pages/vehicle/vehiclesReportList/vehiclesReportList',
    })
  },
  // 跳转我的优惠券页面
  goMyCoupon(e) {
    if (this.isLogging()) {
      wx.navigateTo({
        url: '/pages/coupon/my/myCoupon',
      })
    }
  },
  // 跳转关于我们
  goAboutUs(e) {
    wx.navigateTo({
      url: '../aboutUs/aboutUs'
    })
  },
  // 监听页面滚动
  onPageScroll(e) {
    if (e.scrollTop > 60) {
      if(!this.data.is_top_bar_show){
        this.setData({
          is_top_bar_show: true
        })
      }
    } else {
      if(this.data.is_top_bar_show){
        this.setData({
          is_top_bar_show: false
        })
      }
    }
  },
  // 页面分享设置
  onShareAppMessage() {
    let url = 'pages/personal/personal?share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    return {
      title: '我发现了一家汽车养护店，价美活好，快来看一看！',
      path: url,
      success: (res) => {}
    }
  },
  /**
	 * 隐藏加载弹窗
	 */
	hideLoading () {
    this.data.request_count = this.data.request_count-1
		if (this.data.request_count <= 0) wx.hideLoading()
  },
  isLogging () {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if (globalData.is_registered === 0) {
      if(!this.data.is_clicked) {
        this.setData({
          is_clicked: true
        })
        setTimeout( () => {
          this.setData({
            is_clicked: false
          })
        }, 1000)
        wx.navigateTo({
          url: '/pages/register/registerPhone/registerPhone',
        })
      }
      return false
    }
    return true
  },
  // 打开地图
  openMap (e) {
    const lng = parseFloat(e.currentTarget.dataset.value.lng)
    const lat = parseFloat(e.currentTarget.dataset.value.lat)
    wx.getSetting({
      success (res) {
        if (res.authSetting['scope.userLocation']) {
          wx.openLocation({
            latitude: lat,
            longitude: lng,
          })
        } else {
          wx.openSetting({
            success (res) {
              if (res.authSetting['scope.userLocation']) {
                wx.openLocation({
                  latitude: lat,
                  longitude: lng,
                })
              }
            },
          })
        }
      },
    })
  },
})