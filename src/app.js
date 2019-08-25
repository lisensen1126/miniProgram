require('./utils/sdk/ald-stat.js')
require('./utils/sdk/cdp.js')
const { isRegistered } = require('./utils/request')
import {
	getAccessIdApi,
} from '@/libs/modules/common'

App({
  globalData: {
    scene: undefined, // 场景值
    userInfo: null, // me接口返回来的用户信息
    systemInfo: null, // 手机系统信息
    topbarHeight: 64, // 自定义导航的高度
    phone: null,
    // isLoggingSuccess: 0, // 注册是否成功的标志 0 否 1 是
    token: null, // 登录信息
    code: null, 
    weChatUserInfo: undefined, // 授权后获得的 微信用户信息
    // 在选择时间组件里选择的时间
    appointment: {
      isChoice: false,
      time: null,
      chooseInfo: {}
    },
    // appointment success result
    appointmentSuccessInfo: {
      store_name: '',
      distance: '',
      itemList: [],
      reserveStartTime: ''
    }, // 支付成功或预约成功后的洗车订单信息 / 商城订单信息 / 预约的车检信息
    orderItem: null, // 当前下单的订单信息
    // system update promis
    is_registered: 2, // 是否注册过 (0=未注册，1=已注册,已登录, 2= 还没判断)
    // is_logging: 0, // 是否登陆 (0=未做判断，1=已登录)
    // isRegistered: 0, // 是否注册过 0=未注册，1=已注册
    photoAlbum: null,   //图册
    ep_store_name: null,   //公司名称
    official_is_open: 0,   //门店后台是否开启推荐公众号功能
    official_is_follow: 0,   //获取该用户是否关注了公众号
    is_show_open: true,
    order_source: 1,    // 门店订单来源  1：门店小程序   2：平台小程序
    top_nav_height: 0, // 分类列表 - tap栏位移高度
    data_list_height: 0, // 分类列表 - 内容区域padding-top高度
    current_customer_id: null,
    coupon_offline: {},  // 线下买单选择的优惠券信息
    // has_changed_store: false, // 用户主动切换过门店
  },

  // 小程序初始化完成时
  onLaunch (option) {
    const extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
    if (Object.keys(extConfig).length) {
      this.globalData = {
        ...this.globalData,
        ...extConfig,
      }
    } else {
      this.globalData.host = process.env.HOST
      this.globalData.apiRoot = process.env.API_ROOT
      this.globalData.shopHash = process.env.shopHash
    }
    if (option && option.scene) {
      this.globalData.scene = option.scene
    }
    this.cdp.track({
      // 事件类型(1:点击；2:查看;3:启动;4:退出)
      eventType: 3,
      // 业务属性
      biz: {
        // 上报时间(单位:ms)
        clientTime: new Date() / 1, 
        // 业务分类(首页、分类、门店等),如果启动事件，这里固定为"小程序场景值"
        sourceGroup: '小程序场景值',
        // 当前页url（来源url地址）,如果启动事件，这里固定为小程序场景值中的数值,如：10001、10002
        sourceUrl: option.scene, 
        // 事件目标属性
        target: {
          url: option.path
        },              
      }, 
      // 各事件上报的属性
      customize: {
        path: option.path,
        scene: option.scene,
        referrerInfo: option.referrerInfo,
      },
    });
    // 获取手机系统信息
    this.getSystemInfo()
  },
  onShow (e) {
    // 页面传参如果有门店id,则存储并重定向当前页面(首页、门店)，用于去除url所带参数,防止连锁店id被污染
    if (e.query.current_store_id) {
      let url = e.path
      wx.setStorageSync('current_store_id', e.query.current_store_id)
      // 存储分享出去的门店名称，用于cdp业务属性传参
      if (e.query.current_store_name) {
        this.globalData.ep_store_name = e.query.current_store_name
      }       
      if (url.indexOf('index/index') > -1 || url.indexOf('store/store') > -1) {
        this.globalData.save_share_params = e.query // 因为页面即将重定向，参数要被清理，所以在此处存储参数 
        wx.redirectTo({
          url: '/' + url,
        })
      }
    }   
    this.systemUpdateFn()        // 版本检测 更新
    this.statisticsOpeninTimes() // 统计打开次数
  },
  showMessage ({title = '', content = '', isRejectable = false, cancelText = '取消', confirmText = '确定', confirmColor = '#dd1d21', resolve, reject, complete, fail}) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: isRejectable,
      cancelText: cancelText,
      confirmText: confirmText,
      confirmColor: confirmColor,
      success (res) {
        if (res.confirm) {
          resolve && resolve()
        } else if (res.cancel) {
          reject && reject()
        }
      },
      fail () {
        fail && fail()
      },
      complete () {
        complete && complete()
      },
    })
  },
  // 版本检测 更新
  systemUpdateFn () {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        wx.showLoading({
          title: '检查更新中...',
          mask: true,
        })
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate()
                  wx.hideLoading()
                } else {
                  wx.hideLoading()
                }
              },
            })
          })
          updateManager.onUpdateFailed(() => {
            wx.hideLoading()
          })
        } else {
          wx.hideLoading()
        }
      })
    }
  },
  // 获取手机系统信息
  getSystemInfo () {
    try {
      const res = wx.getSystemInfoSync()
      this.globalData.systemInfo = res
      let titleBarHeight = res.model.indexOf('iPhone') !== -1 ? 44 : 48
      let statusBarHeight = res.statusBarHeight || 20
      this.globalData.topbarHeight = parseInt(titleBarHeight) + parseInt(statusBarHeight)
      // 以下代码用于商品列表的样式判断，请不要删
      let ratio = res.screenWidth / 750
      this.globalData.top_nav_height = ratio * 70 + this.globalData.topbarHeight - 1
      this.globalData.data_list_height = ratio * 70 + ratio * 90 + this.globalData.topbarHeight
		} catch (e) {
			// Do something when catch error
		}
  },
  // 统计打开次数
  statisticsOpeninTimes () {
    wx.request({
      url: this.globalData.host + this.globalData.apiRoot + 'common/count/open',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Accept': 'application/json',
        'Shop-Hash': this.globalData.shopHash,
      },
    })
  },
  // 解析距离
  parseDistance (distance) {
    if (distance < 1000) {
      return parseFloat(distance).toFixed(1) + 'm'
    } else {
      return distance / 1000 > 99 ? '99+km' : (distance / 1000).toFixed(1) + 'km'
    }
  },
  // 解析公里
  parseMileage (mileage) {
    return mileage > 100000 ? Math.floor(mileage / 10000) + '万公里' : mileage + 'KM'
  },
  // 解析时间
  changeDate (val, type = '-') {
    if (!val) {
      return ''
    }
    let date = new Date(val*1000)
    let Y = date.getFullYear() + type
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + type
    let D = this.judgeTime(date.getDate())   
    return Y + M + D
  },
  
  // 解析时间 2
  changeDateTime (val,type = 1) {
    if (!val) {
      return ''
    }
    let date = new Date(val*1000)
    let Y = date.getFullYear() + '-'
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
    let D = this.judgeTime(date.getDate()) + ' '
    let h = this.judgeTime(date.getHours()) + ':'
    let m = this.judgeTime(date.getMinutes())
    let s = this.judgeTime(date.getSeconds())
    if (type === 1) {
      return Y + M + D + h + m 
    } else {
      return Y + M + D + h + m + ':' + s
    }
  },
  // 解析时间 3
  changeTimeDate (val) {
    if (!val) {
      return ''
    }
    let now = new Date(val * 1000)
    let y = now.getFullYear()
    let m = now.getMonth() + 1
    let d = now.getDate()
    let h = now.getHours()
    let mm = now.getMinutes()
    let s = now.getSeconds()
    let str;
    if (h > 12) {
      h -= 12;
      str = 'PM'
    } else {
      str = 'AM'
    }
    h = h < 10 ? '0' + h : h
    d = d < 10 ? '0' + d : d
    m = m < 10 ? '0' + m : m
    mm = mm < 10 ? '0' + mm : mm
    s = s < 10 ? '0' + s : s
    // let date = y + "/" + m + "/" + d + "," + h + ":" + mm + ":" + s;
    let date = {
      year: `${y}.${m}.${d}`,
      minute: `${str} ${h}:${mm}`
    }
    return date;
  },
  judgeTime (t) {
    if (t < 10) {
        return "0" + t;
    } else {
        return t;
    }
  },
  // 倒计时
  countDown (val) {
    // 返回的值
    let limitTime = ''
    //获取当前时间  
    let date = new Date();  
    let now = date.getTime();  
    //设置截止时间
    let end =val * 1000;
    //时间差  
    let leftTime = end-now; 
    //定义变量 d,h,m,s保存倒计时的时间  
    let d,h,m,s;
    if (leftTime >= 0) {
        d = this.judgeTime(Math.floor(leftTime/1000/60/60/24));  
        h = this.judgeTime(Math.floor(leftTime/1000/60/60%24));  
        m = this.judgeTime(Math.floor(leftTime/1000/60%60));  
        s = this.judgeTime(Math.floor(leftTime/1000%60));                     
    } else {
      return
    }
    //将倒计时赋值到div中
    if (d > 0) {
      limitTime = d + '天' + h + ':' + m + ':' + s
    } else {
      limitTime = h + ':' + m + ':' + s 
    }
    return limitTime
  },
  // cdp-数据上报公共方法
  cdpReport (eventType, sourceItem, sourceItemGroup, customize, is_share, target, enter_page_date) {
    // 分享参数属性初始化
    let share_params = {}
    // 当前页面
    let currentPages = getCurrentPages()[(getCurrentPages().length)-1]
    // 页面停留时长
    let pageStayLength = 0
    // 通过分享进入小程序,分享参数属性格式化
    if (is_share) {
      // 通过分享的首页或门店进入，因为参数被清理并存储，所以参数如此取用
      if (this.globalData.save_share_params) {
        currentPages.options = {}
        currentPages.options = this.globalData.save_share_params
        this.globalData.save_share_params = ''
      }
      share_params = {
        param: JSON.stringify(currentPages.options),
        userId: currentPages.options && currentPages.options.share_from_id ? parseInt(currentPages.options.share_from_id) : '',
      }
    }
    // 计算页面停留时长
    if (enter_page_date) {
      let leave_page_date = new Date() / 1
      pageStayLength = leave_page_date - enter_page_date
    }
    try {
      this.cdp.track({
        // 事件类型(1:点击；2:查看;3:启动;4:退出)
        eventType: eventType ? eventType : 2,       
        // 业务属性
        biz: {
          // 页面停留时长(点击事件如果会跳转页面，需要传enter_page_date这个字段)
          preStopOverTime: pageStayLength > 0 ? pageStayLength : '',
          // 上报时间(单位:ms)
          clientTime: new Date() / 1,
          // 门店id
          storeId: wx.getStorageSync('current_store_id') ? wx.getStorageSync('current_store_id') : '',
          // 门店名称
          storeName: this.globalData.ep_store_name ? this.globalData.ep_store_name : '',
          // 小程序启动事件取值=小程序场景值 , 其他事件取值=页面
          sourceGroup: '页面',
          // 当前页url（来源url地址）
          sourceUrl: currentPages.route,
          // 页面表单id或name值,即data-cdp值,点击事件必传
          sourceItem: sourceItem ? sourceItem : '',
          // 来源区域分组(首页=1，引导区=2, 爆款=3, 分类=4, 未知=99)
          sourceItemGroup: sourceItemGroup ? sourceItemGroup : 99,
          // 分享参数属性,是个对象,包括分享地址请求的参数:param和分享用户id:userId
          share: share_params ? share_params : {},
          // 事件目标属性
          target: target ? target : {},
        },
        // 各事件上报的属性
        customize: customize ? customize : {},
      })
    } catch (err) {
      console.error('app.js-cdpReport:', err)
    }
  },
  // 解析二维码参数
  queryURL (url) {
    if (url.indexOf('?') === -1) {
      return
    }
    var arr1 = url.split("?");
    var params = arr1[1].split("&");
    var obj = {};//声明对象
    for(var i=0;i<params.length;i++){
      var param = params[i].split("=");
      obj[param[0]] = param[1];//为对象赋值
    }
    return obj;
  },
  /**
   * 通过fromID和fromType获取actionID
   * @url 要解析的url
   * @type 1:需要缓存 2:不缓存
  */
 async getAccessId (params) {
  try {
    const {
      statusCode,
      data,
      code,
      message,
    } = await getAccessIdApi(params)
    if (statusCode === 200 && code === 0) {
      if (data.access_id && params.is_cache) {
        wx.setStorageSync('access_id', {access_id: data.access_id, time: parseInt(new Date() / 1000)})
      }
      return data.access_id
    }
  } catch (err) {
    console.error('首页-获取actionId', err)
  }
},
  // 获取身份(判断是否有注册,如果注册过就登录返回个人信息)
  isRegistered,
})
