// 获取全局应用程序实例对象
// const app = getApp();
import { getMyReserve, cancelReservation } from '@/libs/modules/order'
const {
  changeDateTime, globalData, isRegistered
} = getApp()
import { sendFormId } from '@/utils/formid'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: 'myreservation',
		list: [],   //预约列表
    pageShow: false,
    showHome: false,
    top_height: 0, // padding高度
  },
  // formid 收集
  sendFormId,
  // 获取预约列表
  async getReserve() {
    wx.showLoading({
			title: '加载中...',
			mask: true,
    })
    try {
      const {statusCode, data, code, message} = await getMyReserve()
      if (statusCode === 200 && code === 0) {
        data.forEach(element => {
          element.showall = false
          element.item.forEach(ele => {
            ele.unit_price = (ele.unit_price/100).toFixed(2)
          })
          element.reserve.reserve_time = changeDateTime(element.reserve.reserve_time)
        });
        this.setData({
          list: data
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取预约列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('我的预约-getReserve', err)
    }
    wx.hideLoading()
    this.setData({
      pageShow: true
    })
  },
  /**
   * 取消预约
   * @id  订单ID 
   */
  async cancel (e) {
    wx.showLoading({
      title: '取消中...',
      mask: true,
    })
    try {
      const {statusCode, code, message} = await cancelReservation({
        trade_order_id: e.currentTarget.dataset.id
      })
      if (statusCode === 200 && code === 0) {
        wx.showToast({
          title: '取消预约成功',
          icon: 'none',
          success: () => {
            setTimeout(() => {
              this.getReserve()
            },1500)
          }
        })      
      } else {
        wx.hideLoading()
        showMessage({
          title: '取消预约失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('我的预约-cancel', err)
    }
  },
  /**
   * 显示预约的项目
   * @id  列表ID
   */
  showList(e) {
    let id = e.currentTarget.dataset.id;
    this.data.list.forEach((ele, i) => {
      if(id == ele.trade_order.trade_order_id){
        ele.showall = !ele.showall
      }
    })
    this.setData({
      list: this.data.list
    })
  },
	// 生命周期函数--监听页面加载
	async onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    wx.hideShareMenu()
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 2) {
      await isRegistered()
      if(globalData.is_registered === 0) {
        wx.navigateTo({
          url: '/pages/register/registerPhone/registerPhone',
        })
      } else {
        this.getReserve()
      }
    }
  }, 
  onShow() {
    if (globalData.is_registered === 1) {
      this.getReserve()
    }
  } 
});
