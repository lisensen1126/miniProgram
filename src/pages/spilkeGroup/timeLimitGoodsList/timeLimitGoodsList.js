// 获取全局应用程序实例对象
import {
	getSpikeSkuListApi
} from '@/libs/modules/spike'
const {showMessage, countDown, globalData } = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		spike_list: [], // 秒杀列表
		meta: {    // 分页参数
      last_page: 1,
      current_page: 0,
    },
    isinitiated: false,
    is_loading: false,
    is_all_loaded: false,
		pageShow: false,
		seckill_time_line: ['00','00','00'], // 倒计时初始化数据
		seckill_time_line_day: 0, // 倒计时天数
		sale_number: '', // 进度条长度
		time_limit:'',	// 倒计时时间
		timer: '',			//定时器
    showHome: false
	},
	/*****
	 * 倒计时
	 * @is_open  是否开始-结束
	 */
  getTimeLimit () {
		// 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('timeLimitGoodsList') === -1){
			return false
		}
		let self = this
		let spike_list = self.data.spike_list
		let goCown = true
		spike_list.forEach(function(e){
			if(e.isOpen === 3) {
				goCown = false
			} else {
				goCown = true
			}
		})
		if(goCown){
			spike_list.forEach(function(e){
				let nowDate = new Date() / 1000
				if (e.start_time > nowDate) {
					e.isOpen = 1
				} else if (e.start_time < nowDate && e.end_time > nowDate) {
					e.isOpen = 2
				} else if (e.end_time < nowDate) {
					e.isOpen = 3
				}
				if(e.isOpen === 1){
					e.different_time = e.start_time
				} else if(e.isOpen === 2){
					e.different_time = e.end_time
				} else {
					e.different_time = 0
				}
				if (e.different_time>0) {
					e.time_limit = countDown(e.different_time)
					if(countDown(e.different_time) === '00天00:00:00' || countDown(e.different_time) === '00:00:00') {
						if(e.isOpen === 1){
							e.isOpen = 2
						} else if (e.isOpen === 2) {
							self.setData({
								count_down: false
							})
							e.isOpen = 3
						} else {
							return false
						}
					}
				}
				let date_array = []
				let date_day = 0
				if (e.time_limit){
					date_array = e.time_limit.split(":")
					if (date_array[0].indexOf('天') != -1){
						date_day = date_array[0].split('天')[0]
						date_array[0] = date_array[0].split('天')[1]
					}
				}
				e.seckill_time_line = date_array
				e.seckill_time_line_day = date_day
				self.setData({
					spike_list: spike_list
				})
			})
		} else {
			clearTimeout(this.data.timer)
		}
		self.data.timer = setTimeout(function () {
      self.getTimeLimit()
    },1000)
	},
	// 获取秒杀列表
	async getSpikeList() {
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode,
				data,
				meta,
				code,
				message
			} = await getSpikeSkuListApi({
				page: this.data.meta.current_page + 1,
				size: 10
			})
			if (statusCode === 200) {
				if(code === 0){
					let self = this
					wx.hideLoading()
					data.forEach(function(e){
						e.sku_price = (e.sku_price / 100).toFixed(2)
						e.seckill_sku_price = (e.seckill_sku_price / 100).toFixed(2)
						// 进度条的展示
						e.sale_number = (parseInt(e.sales_total) / (parseInt(e.inventory_total)+parseInt(e.sales_total))) * 74
						// 判断是否已开启(isOpen=1-即将开始，isOpen=2-已开始，isOpen=3-已结束)
						let nowDate = new Date() / 1000
						if (e.start_time > nowDate) {
							e.isOpen = 1
						} else if (e.start_time < nowDate && e.end_time > nowDate) {
							e.isOpen = 2
						} else if (e.end_time < nowDate) {
							e.isOpen = 3
						}
					})
					// 拼接列表
					const lastData = self.data.spike_list
					lastData.splice(lastData.length, 0, ...data)
					self.setData({
						spike_list: lastData,
						isinitiated: true,
						is_loading: false,
						is_all_loaded: lastData.length >= parseInt(meta.total),
						meta,
					})
					self.getTimeLimit();
				}
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取秒杀列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('秒杀-getSpikeList:', err)
		}
		this.setData({
      is_loading: false,
      pageShow: true
    })
	},
	// 上拉加载
  onReachBottom() {
    if (this.data.is_all_loaded) {
      return
    }
    this.getSpikeList()
  },
	// 页面分享设置
	onShareAppMessage() {
		let url = 'pages/spilkeGroup/timeLimitGoodsList/timeLimitGoodsList?share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
		return {
			title: '没什么比省下真金白银更重要的，快来一起省省省！',
			path: url,
		};
	},
	// 去商品或服务详情
	goLimitDetail(e) {
		let item = e.currentTarget.dataset.item
		let seckill_id = item.seckill_id
		let spu_id = item.spu_id
		let sku_id = item.sku_id
    let customize = {
      spuId: e.currentTarget.dataset.item.spu_id ? parseInt(e.currentTarget.dataset.item.spu_id) : '',
      skuId: e.currentTarget.dataset.item.sku_id ? parseInt(e.currentTarget.dataset.item.sku_id) : '',
    } 		
		if(parseInt(item.type) === 1) {
			wx.navigateTo({
				url: `/pages/spilkeGroup/timeLimitGoodsDetail/timeLimitGoodsDetail?seckill_id=${seckill_id}&sku_id=${sku_id}&spu_id=${spu_id}`
			});
			clearTimeout(this.data.timer)
		} else if(parseInt(item.type) === 2) {
			wx.navigateTo({
				url: `/pages/spilkeGroup/timeLimitServiceDetail/timeLimitServiceDetail?seckill_id=${seckill_id}&spu_id=${spu_id}`,
			});
			clearTimeout(this.data.timer)
		} else if(parseInt(item.type) === 3 || parseInt(item.type) === 4 || parseInt(item.type) === 5) {
			wx.navigateTo({
				url: `/pages/spilkeGroup/timeLimitPurchaseDetail/timeLimitPurchaseDetail?seckill_id=${seckill_id}&card_id=${spu_id}`,
			});
			clearTimeout(this.data.timer)
		}
	},
	onLoad () {
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    }) 
	},
	// 生命周期
	onShow(){
    let pages = getCurrentPages();
    if (pages.length === 1) {
      this.setData({
        showHome: true
      })
    }
		this.setData({
			enter_page_date: new Date() / 1, // 进入页面的时间
			spike_list: [],
      isinitiated: false,
      is_all_loaded: false,
			is_loading: false,
			pageShow: false,
    })
    this.data.meta = {
      last_page: 1,
      current_page: 0,
    }
		this.getSpikeList()
	}
});
