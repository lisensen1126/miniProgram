// 获取全局应用程序实例对象
const {changeDateTime, globalData} = getApp();
import {
	StoreCommentList
} from '@/libs/modules/evaluate'

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		topbarHeight: 64,
		title: 'itemList',
		isinitiated: false,
		isLoading: false,
		isAllLoaded: false,
		list: [],  //评价列表
		meta: {
			last_page: 1,
			current_page: 0,
		},
		openImage: false,
		showHome: false,
  },
  // 生命周期函数--监听页面加载
	onLoad() {
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				topbarHeight: globalData.topbarHeight,
				showHome: true
			})
		} else {
			this.setData({
				topbarHeight: globalData.topbarHeight
			})
		}
		
		wx.hideShareMenu()
	},
	onShow() {
		if(this.data.openImage === false){
			this.setData({
				list: [],
				isinitiated: false,
				isLoading: false,
				isAllLoaded: false,
      })
      this.data.meta.last_page = 1
      this.data.meta.current_page = 0
			this.getStoreCommentList()
		}else{
			return false
		}
	},
	/**
	 * 点击图片放大
	 * @index  图片下标
	 * @imgArr 图片集合
	 */
	previewImage(e) {
		this.data.openImage = true
		let index = e.currentTarget.dataset.index
		let imgArr = e.currentTarget.dataset.arr.map(x => x.image_url)
		wx.previewImage({
			urls: imgArr,
			current: imgArr[index],
			success: (res) => {},
			fail: (err) => {}
		})
	},
	// 获取门店评价列表
	async getStoreCommentList() {
		this.setData({
			isLoading: true,
		})
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		try {
			const {
				statusCode,
				data,
				code,
				message,
				meta
			} = await StoreCommentList({
				page: this.data.meta.current_page + 1,
			})
			if (statusCode === 200 && code === 0) {
				data.forEach(ele => {
					ele.created_at = changeDateTime(ele.created_at)
					ele.buy_time = changeDateTime(ele.buy_time)
				})
				const lastData = this.data.list
				lastData.splice(lastData.length, 0, ...data)
				this.setData({
					list: lastData,
					isinitiated: true,
					isAllLoaded: meta.current_page >= meta.last_page,
					meta,
				})
			} else {
				showMessage({
					title: '获取评论列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('门店评价-getStoreCommentList:', err)
		}
		wx.hideLoading()
		this.setData({
			isLoading: false,
		})
	},
	// 上拉加载
	onReachBottom() {
		if (this.data.isAllLoaded) {
			return
		}
		this.getStoreCommentList()
	},	
});