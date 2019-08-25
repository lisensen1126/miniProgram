import {getRecordListApi} from '@/libs/modules/mycard'

const {
  showMessage,
	changeDateTime,
	globalData,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    list: [],    //核销记录
    upkeep: '',
		isinitiated: false,
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
			} = await getRecordListApi({
        card_no: this.data.upkeep
      })
			this.setData({
        isinitiated: true,
      })
			if (statusCode === 200) {
				if (code === 0) {
          data.forEach(element => {
            element.item.forEach(cell => {
              cell.write_off_time = changeDateTime(cell.write_off_time, 2)
            });
          })
					this.setData({
						list: data,
					})
				}
			} else {
				showMessage({
					title: '获取使用记录列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('使用记录-fetchList', err)
		}
		wx.hideLoading()
	},
	onLoad(option) {
		this.setData({
			topbarHeight: globalData.topbarHeight
		})
    this.data.upkeep = option.upkeep_no
    this.fetchList()
	},
});