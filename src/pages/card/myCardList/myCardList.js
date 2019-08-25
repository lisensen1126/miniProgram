const {
	showMessage,
	changeDate,
	globalData,
	isRegistered,
} = getApp()
import {getMyCardListApi} from '@/libs/modules/mycard'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		isinitiated: false,
		currentLevel: '1',    //tab切换的下标
		topbarHeight: 0,
		tips: 0,
	},
	/**
   * tab切换并获取订单列表
   * @param {*} param0 
   */
  switchLevel({
    currentTarget
  }) {
    if(this.data.currentLevel === currentTarget.dataset.level){
			return
		} else {
			this.setData({
				list: [],
				currentLevel: currentTarget.dataset.level,
				isinitiated: false,
      })
			this.fetchList()
		}
  },
	async fetchList() {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		try {
			const {
				statusCode,
				data,
				code,
				message
			} = await getMyCardListApi({
				status: this.data.currentLevel
			})
			this.setData({
        isinitiated: true,
      })
			if (statusCode === 200) {
				if (code === 0) {
					data.data.forEach(element => {
						element.deadline = changeDate(element.deadline)
					})
					this.setData({
						list: data.data,
						tips: data.count,
					})
				}
			} else {
				showMessage({
					title: '获取我的养护卡列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('养护卡-fetchList', err)
		}
		wx.hideLoading()
	},
	goDetail(e) {
		let id = e.currentTarget.dataset.id
		wx.navigateTo({
			url: `/pages/card/myCardDetail/myCardDetail?id=${id}`
		})
	},
	// 购卡中心
	goBuyCenter(e) {
		wx.navigateTo({
			url: '/pages/card/cardCenter/cardCenter'
		})
	},
	// 转增记录
  goRecord(e) {
    wx.navigateTo({
      url: '/pages/card/giveRecord/giveRecord'
		})
  },
	// 养护卡二维码
	goCode(e) {
		let id = e.currentTarget.dataset.id
		wx.navigateTo({
			url: `/pages/card/myCardCode/myCardCode?id=${id}`
		})
	},
	async onLoad() {
		this.setData({
			topbarHeight: globalData.topbarHeight
		})
		wx.hideShareMenu()
		// 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 2) {
			await isRegistered()
			if(globalData.is_registered === 0) {
				wx.navigateTo({
					url: '/pages/register/registerPhone/registerPhone',
				})
			} else {
				this.fetchList()
			}
    }
	},
	// 生命周期函数--监听页面加载
	onShow() {		
		if(globalData.is_registered === 1) {
			this.fetchList()
		}
	},
});