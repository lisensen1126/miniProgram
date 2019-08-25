import {getMyCardListApi} from '@/libs/modules/mycard'
import {extendConfig} from '@/libs/modules/user'
const {
	showMessage,
	changeDate,
	globalData,
	isRegistered,
} = getApp()
// 创建页面实例对象 getMyCardListApi
Page({
	// 页面的初始数据
	data: {
		list: [],
		state: null,
		total_num: 0,
		topbarHeight: 0,
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
			} = await getMyCardListApi()
			if (statusCode === 200 && code === 0) {
				let arr = []
				data.data.forEach(v => {
					v.deadline = changeDate(v.deadline)
					if (arr.length < 2 && (v.status === 1 || v.status === 2)) {
						arr.push(v)
					}
				})
				this.setData({
					list: arr,
					total_num: data.data.length,
				})
			} else {
				showMessage({
					title: '获取我的养护卡列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('我的卡包-fetchList', err)
		}
		wx.hideLoading()
	},
	goDetail(e) {
		let id = e.currentTarget.dataset.id
		wx.navigateTo({
			url: `/pages/card/myCardDetail/myCardDetail?id=${id}`
		})
	},
	// 会员卡
	goVip(e) {
		wx.navigateTo({
			url: '/pages/h5/autoshop?page=CustCardList&isEmpty=' + this.data.state,
		})		
	},
	// 购卡中心
	goBuyCenter(e) {
		wx.navigateTo({
			url: '/pages/card/cardCenter/cardCenter'
		})
	},
	// 查看全部
	goAllList(e) {
		wx.navigateTo({
			url: '/pages/card/myCardList/myCardList'
		})
	},
	// 养护卡二维码
	goCode(e) {
		let id = e.currentTarget.dataset.id
		wx.navigateTo({
			url: `/pages/card/myCardCode/myCardCode?id=${id}`
		})
	},	
	// 转增记录
  goRecord(e) {
    wx.navigateTo({
      url: '/pages/card/giveRecord/giveRecord'
		})
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
            state: obj.membership === undefined ? 'off' : obj.membership,
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
	async onLoad(option) {
		this.setData({
			topbarHeight: globalData.topbarHeight
		})
		wx.hideShareMenu()
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
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
		this.getExtendConfig()
		if(globalData.is_registered === 1) {
			this.fetchList()	
		}	
	},
});