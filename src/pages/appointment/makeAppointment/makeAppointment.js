import {
  fetchInfoOfAppointment
} from '@/libs/modules/appointment'
import { getOrderDetail } from '@/libs/modules/order'
import {
	scaleImage,
} from '@/libs/utils'
// 获取全局应用程序实例对象
const {
  globalData, showMessage
} = getApp()

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    initial: false,
    store: {},  //门店信息
    tradeOrderItems: [],    //订单项目
    need_refresh_info: false, // 切换门店后，需要刷新门店数据
    top_height: 0, // padding高度
  },
  // 去切换门店页面
	changeStore (e) {
    this.setData({
      need_refresh_info: true
    })
		wx.navigateTo({
			url: '/pages/storeList/storeList?from_page=makeAppointment'
    })   
	},
  // 去选择时间页面
  toChooseTime(e) {
    wx.redirectTo({
      url: `/pages/appointment/chooseTime/chooseTime?trade_order_id=` + this.data.trade_order_id + '&order_created_at=' + this.data.created_at,
    })	    
  },
  /**
   * 获取门店信息
   */
  async getReservationInfo() {
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const {statusCode, code, data ,message} = await fetchInfoOfAppointment({
        longitude: this.data.lng || undefined,
        latitude: this.data.lat || undefined,
        reserve_store_id: globalData.reserve_store_id || undefined, // 预约门店id,切换预约门店后会有此字段
      })
      if (statusCode === 200 && code === 0) {
        // 门店封面图片
        if (data.store.banner === '') {
					data.store.banner = 'https://oss1.chedianai.com/images/assets/category-default.png'
				}
        data.store.banner = scaleImage(data.store.banner,3,198,158)
        // 门店评分
        let min = parseInt(data.store.avg_ratings) // 字符串转整数
        let max = parseFloat(data.store.avg_ratings)  // 字符串转浮点
        let points = min
        let half = max - min
        let inActive = Math.floor(5 - max) // 向下取整
        this.setData({
          points: points,
          half: half,
          inActive:inActive
        })
        // 门店信息
        const changed = {}
        changed['store'] = data.store  
        changed['initial'] = true
        globalData.appointmentSuccessInfo['store_name'] = data.store.store_name
        this.setData(changed)
        wx.hideLoading()
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取预约结算失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('预约-getReservationInfo', err)
    }
  },
  // 打开地图
  openMap(e) {
    const lng = +e.currentTarget.dataset.lng
    const lat = +e.currentTarget.dataset.lat
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userLocation']) {
          wx.openLocation({
            latitude: lat,
            longitude: lng,
          })
        } else {
          wx.openSetting({
            success(res) {
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
		// cdp-点击查看门店地址信息
		let customize = {
			storeAddress: this.data.store.address,
		}
		cdpReport(1,e.currentTarget.dataset.cdp,99,customize)	    
  },
  /**
   * 获取订单详情用来展示下面的服务项目列表
   * @param {*} trade_order_id  订单ID
   */
  async getOrderDetail(trade_order_id) {
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const res = await getOrderDetail({
        trade_order_id: this.data.trade_order_id
      })
      if (res.statusCode === 200 && res.code === 0) {
        res.data.item.forEach(ele => {
					ele.unit_price = (ele.unit_price/100).toFixed(2)
				})
        globalData.appointmentSuccessInfo.itemList = res.data.item
        this.setData({
          tradeOrderItems: res.data.item,
          orderNo: res.data.trade_order_no,
          created_at: res.data.created_at,
        })
        wx.hideLoading()
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取预约内容失败',
          content: `${res.message}（${res.statusCode}${res.code ? ' ' + res.code : ''} ）`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('预约-getOrderDetail', err)
    }
  },
  // 生命周期函数--监听页面加载
  onLoad(option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    wx.hideShareMenu()
    this.setData({
      trade_order_id: option.trade_order_id
    })  
    globalData.reserve_store_id = '' // 首次进来应是当前门店，所以要清除上次存的预约id全局变量，切换预约门店后会有此字段 
    globalData.reserve_store_name = '' // 首次进来应是当前门店，所以要清除上次存的预约门店全局变量，切换预约门店后会有此字段
    this.getOrderDetail(option.trade_order_id)
    this.getReservationInfo()
    wx.getLocation()
  },
  onShow() {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    })    
    // 切换门店后，需要刷新门店数据
    if (this.data.need_refresh_info) {
      this.getReservationInfo()
      this.setData({
        need_refresh_info: false
      })
    }
  },  
});