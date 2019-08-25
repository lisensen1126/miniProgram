const {
	showMessage,
	changeDate,
	globalData,
} = getApp()
import {getMyCardWirteApi} from '@/libs/modules/mycard'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		tabType: 2,
		id: '',
		my_id: '',
		waiting_list: [],
		cancelled_list: [],
		info: {
			waiting_num: 0,
			cancelled_num: 0
		},
		isinitiated: false
	},
	// tab切换
	changeTab(e) {
		this.setData({
			tabType: e.currentTarget.dataset.tab - 0
		})
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
			} = await getMyCardWirteApi({
				upkeep_info_id: this.data.id,
				id: this.data.my_id,
			})
			if (statusCode === 200) {
				if (code === 0) {
					data.cancelled_list.forEach(element => {
						element.write_off_time = changeDate(element.write_off_time)
					});
					this.setData({
						info: data,
						waiting_list: data.waiting_list,
						cancelled_list: data.cancelled_list,
						isinitiated: true
					})
				} else {
					this.setData({
						isinitiated: false
					})
				}
			} else {
				showMessage({
					title: '获取我的养护卡列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('核销记录-fetchList', err)
		}
		wx.hideLoading()
	},
	goCardCenter(e) {
		wx.navigateTo({
			url: `/pages/card/relationGoods/relationGoods?id=${this.data.upkeep_no}&type=2`
		})
	},
	onLoad(option) {
		this.setData({
			id: option.id,
			my_id: option.myid,
			upkeep_no: option.upkeep_no,
			tabType: option.type - 0,
			topbarHeight: globalData.topbarHeight,
		})
		this.fetchList()
		wx.hideShareMenu()
	},
});