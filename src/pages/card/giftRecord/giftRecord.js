// 获取全局应用程序实例对象

const {showMessage, changeDateTime, globalData} = getApp()
import {getMyRecordApi} from '@/libs/modules/mycard'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		list: [], // 赠送列表
		meta: {    // 分页参数
      last_page: 1,
      current_page: 0,
    },
    topbarHeight: 0,
    isinitiated: false,
    is_loading: false,
    is_all_loaded: false,
		pageShow: false,
    showHome: false,
    id: null, // 养护卡id
	},
	// 获取赠送列表
	async getGiftList () {
		wx.showLoading({
			title: '加载中',
			mask: true,
    })
    try {
			const {
				statusCode,
				data,
				meta,
				code,
				message
			} = await getMyRecordApi({
        upkeep_customer_id: this.data.id,
				page: this.data.meta.current_page + 1,
				per_page: 15
			})
			this.setData({
				is_loading: false,
				pageShow: true
			})
			if (statusCode === 200) {
				if(code === 0){
					let self = this
					wx.hideLoading()
          data.forEach(item=> {
            item.received_at = changeDateTime(item.received_at, 2)
          })
					// 拼接列表
					const lastData = self.data.list
					lastData.splice(lastData.length, 0, ...data)
					self.setData({
						list: lastData,
						isinitiated: true,
						is_loading: false,
						is_all_loaded: lastData.length >= parseInt(meta.total),
						meta,
					})
				}
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取赠送记录列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('赠送记录-getGiftList', err)
		}
    wx.hideLoading()
	},
	// 上拉加载
  onReachBottom() {
    if (this.data.is_all_loaded) {
      return
    }
    this.getGiftList()
  },
  onLoad(option) {
    this.setData({
			topbarHeight: globalData.topbarHeight
		})
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    if (option.id) {
      this.data.id = option.id
    }
  },
	// 生命周期
	onShow() {
		this.setData({
			list: [],
			meta: {
        last_page: 1,
        current_page: 0,
      },
      isinitiated: false,
      is_all_loaded: false,
			is_loading: false,
			pageShow: false,
    })
		this.getGiftList()
	}
});
