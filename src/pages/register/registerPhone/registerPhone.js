import {
  registerUser
} from '@/libs/modules/user'
import {getCouponStateApi} from '@/libs/modules/coupon'
import { checkSession } from '@/utils/request'
import { getFormIdAndSendInfoApi } from '@/libs/modules/common'
const {
  showMessage,
  globalData,
  cdpReport,
  cdp
} = getApp()
Page({
  data: {
    // 数据是否填写完成
    fetchable: false,    // 是否注册中
    pageIsLottery: false,    // 默认不勾选协议
    isShowCoupon: false, 
    relation_id: null,// 关联技师id
    recommend_coupon: [],     // 推荐的优惠券列表数据
    top_height: 0, // padding高度
    is_reigster: false,   // 是否注册完成
    wxUserInfo: null, // 授权用户信息
    mobile: null, // 授权手机号
    isUserInfo: true,  // 是否显示获取用户信息按钮
    loading: false,
  },
  onLoad(option) {
    wx.hideShareMenu()
    if (option.from) {
      this.data.from = option.from
    }
    // 获取自定义导航栏的高度，用来修改授权弹框的高度
    this.setData({
      top_height: globalData.topbarHeight
    })   
    checkSession()
    console.log('aa')
  },
  onShow() {
    // this.setData({
    //   isUserInfo: true,
    // })
    let self = this
    // 进入页面的时间  
    this.data.enter_page_date = new Date() / 1  
    // 当前小程序历史路径
    let historyLength =  getCurrentPages().length
    // 缓存中的技师id
    let scene = wx.getStorageSync('scene')
    if (scene) {      
      this.data.scene = scene
    }
    // 可以判断是由分享二维码进入
    if ((this.data.scene >= 0)){
      // 更新技师关联id
      this.data.relation_id = this.data.scene
    }
    try {
      const value = wx.getStorageSync('fromUrl')
      const pageIsLottery = wx.getStorageSync('lottery')
      if (value) {
        this.data.fromUrl = value
      }
      if (pageIsLottery) {
        this.data.pageIsLottery = pageIsLottery
      }
    } catch (e) {
      showMessage({
        title: 'Oh,No~你的信息好像迷路了',
        content: '你可以试试重新进入小程序，咱们一起把你的信息找回来！',
      })
    }
  },  
  // 获取用户的基本信息
  userInfoHandler(e) {
    this.setData({
      isUserInfo: true
    })
    if (e.detail.errMsg === 'getUserInfo:ok') {
      // 统一授权
      this.wxUserInfo = e.detail
      globalData.weChatUserInfo = e.detail
      // 用户基本信息授权成功，关闭授权按钮
      this.setData({
        isUserInfo: false
      })
    }
  },

  // 取消选中协议
  cancel() {
    this.setData({
      isUserInfo: true
    })
  },
  // 获取用户的电话号码
  getPhoneNumber(e) {
    // 拒绝授权
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      return false
    }

    // 同意授权
    this.mobile = e.detail
    this.reigster()    // 请求接口
  },
  // 跳转用户协议页面
  goAgreements(e) {
    wx.navigateTo({
      url: "/pages/register/userAgreements/agreements"
    })
  },
  // 去协议页面
  goBook() {
    wx.navigateTo({
      url: '/pages/register/userAgreements/agreements'
    })
  },
  // 返回
  goback(e) {
    // 获取formId 并发送消息(注册成功)
    if(e.type === "callback" && e.detail.detail.formId !== 'the formId is a mock one') {
      this.getFormIdAndSendInfo(e)
    }
    wx.navigateBack({
      delta: 1,
    })
  },
  async reigster() {
    let self = this
    let session_id =  cdp.sessionId() // 获取用户sessionId
    wx.showLoading({
      title: '注册中',
      mask: true
    })
    this.setData({
      loading: true,
    })
    try {
      let params = {
        session_id: session_id ? session_id : '',
        scene: globalData.scene,
        code: globalData.code,
        ...this.wxUserInfo,
        mobile_info: {
          encryptedData: this.mobile.encryptedData,
          iv: this.mobile.iv,
        },
      }
      // 从缓存里取acceaa_id,并且判断时间是否距现在时间小于300s，则需要在params带上access_id
      let accessIdStorage = wx.getStorageSync('access_id')
      let nowTime = parseInt(new Date() / 1000)
      if (accessIdStorage && ((nowTime - accessIdStorage.time) > 300)) {
        params.access_id = accessIdStorage.access_id
      }
      // 存在关联技师id
      if (self.data.relation_id) {
        params.relation_id = parseInt(self.data.relation_id)
      }
      const {
        statusCode,
        message,
        code,
        data
      } = await registerUser(params)
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // 注册成功
        globalData.is_registered = 1
        globalData.userInfo = data
        globalData.current_customer_id = data.customer_id
        // 默认就登录成功
        if (data.token) {
          globalData.token = data.token
        }
        // 注册有礼
        data.status ? this.fetchCouponList() : this.setData({is_reigster: true})
        // 跳转返回之前页面
        globalData.isNewCustomerGiftVisible = true
      } else {
        this.setData({
          loading: false,
        })
        wx.hideLoading()
        showMessage({
          title: '注册失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      this.setData({
        loading: false,
      })
      wx.hideLoading()
      console.error('欢迎注册-reigster:', err)
    }
  },
  // 关闭注册有礼
  couponCancel(e) {
    this.setData({
      isShowCoupon:false
    })
    this.goback(e)
  },
  // 获取推送的优惠券
	async fetchCouponList () {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
		try {
      const {statusCode, data, code,} = await getCouponStateApi({
				from_type: 1
			})
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
				if (data.length > 0) {
					this.setData({
            recommend_coupon: data,
						isShowCoupon: true,
          })
				}
			} else {
        wx.hideLoading()
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      wx.hideLoading()
      console.error('欢迎注册-fetchCouponList:', err)
    }
  },
  // 获取formId, 并发送消息(注册成功)
  getFormIdAndSendInfo(e){
    console.log('send', e)
    getFormIdAndSendInfoApi({form_id: e.detail.detail.formId}).then(res => {
      console.log('formid', res)
    })
  }
})