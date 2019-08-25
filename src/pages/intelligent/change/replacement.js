// 获取全局应用程序实例对象
import { getChangeList, changeOil2, changeGearBoxOil2 } from '@/libs/modules/intelligent'

const {
	showMessage,
  globalData
} = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		groom: '',			// 推荐型号
		resources: '',		// 推荐用量
		modelList: [],		// 机油列表
		oilList: {},		// 返回后台的数据
		type: '',			// 接收传进列表的类型
    showHome: false,
    top_height: 0, // padding高度
	},
	/*** 更换机油 ***/
	// 获取更换列表
	async changeList() {
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode, data, code, message } = await getChangeList({
					type: this.data.type
				})
			if (statusCode ===200 && code === 0) {
				wx.hideLoading()
				if (data.list.length <= 0) {
					wx.navigateBack({
						delta: '1'
					})
				}
				this.setData({
					modelList: data.list,
					resources: data.reference_amount
				})
				if (this.data.type === 2) {
					let str = ''
					let list = this.data.modelList
					list.forEach((item, index) => {
						if (index === list.length - 1) {
							str += item.sku_value.replace(/\s+/g, '')
						} else {
							str += (item.sku_value.replace(/\s+/g, '') + ',')
						}
					})
					this.setData({
						groom: str,
					})
				}
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取项目列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-changeList', err)
		}
		wx.hideLOading()
	},

	// 选中机油发送请求
	async clickOil() {
		let self = this
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode, data, code, message } = await changeOil2({
					basic_sku_id: this.data.oilList.sku_id,
					basic_sku_ids: this.data.oilList.sku_ids,
					reference_amount: this.data.resources,
					order_id: this.data.oilList.orderId
				})
			if (statusCode ===200 && code === 0) {
				wx.hideLoading()
				let pages = getCurrentPages();					//当前页面
				let prevPage = pages[pages.length - 2];			//上一页面
				prevPage.setData({								//直接给上一页面赋值
					item: data,
					type: 1,
					go_type: 1,
				});
				if (data.list.length > 0) {
					wx.navigateBack({
						delta: '1'
					})
				} else {
					showMessage({
						title: '更换未成功',
						content: `很抱歉，所选商品门店已下架`,
						resolve() {
							self.changeList()
						},
					})
				}

			} else {
				wx.hideLoading()
				showMessage({
					title: '获取项目列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-clickOil', err)
		}
		wx.hideLOading()
	},

	// 选中变速箱油发送请求
	async clickGearBoxOil() {
		let self = this
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode, data, code, message } = await changeGearBoxOil2({
					basic_sku_id: this.data.oilList.sku_id,
					order_id: this.data.oilList.orderId
				})
			if (statusCode ===200 && code === 0) {
				wx.hideLoading()
				let pages = getCurrentPages();					//当前页面
				let prevPage = pages[pages.length - 2];			//上一页面
				prevPage.setData({								//直接给上一页面赋值
					item: data,
					type: 3,
					go_type: 1,
				});
				if (data.list.length > 0) {
					wx.navigateBack({
						delta: '1'
					})
				} else {
					showMessage({
						title: '更换未成功',
						content: `很抱歉，所选商品门店已下架`,
						resolve() {
							self.changeList()
						},
					})
				}

			} else {
				wx.hideLoading()
				showMessage({
					title: '获取项目列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-clickGearBoxOil', err)
		}
		wx.hideLOading()
	},
	/**
	 * 选中机油
	 * @sku_id  商品sku_id
	 * @spu_id  商品spu_id
	 * @sku_value  商品对应的型号 eg:"0W-40"
	 * @sku_ids 选中商品对应spu_id同一的sku_id组合
	 * @order_id 是否上下架
	 * @itemList 给下一页传递传递的商品集合
	 * @url 要跳转的路径
	 */
	async chooseOil(e) {
		if (this.data.type === 1) { // 机油
			let sku_id = e.currentTarget.dataset.sku
			let spu_id = e.currentTarget.dataset.skus
			let sku_value = e.currentTarget.dataset.skuvalue
			let order_id = e.currentTarget.dataset.orderid
			this.data.oilList.sku_id = sku_id
			this.data.oilList.orderId = order_id
			let sku_ids = []
			let self = this
			self.data.modelList.forEach(function (e, i) {
				if (spu_id === e.product_id && sku_value === e.sku_value) {
					sku_ids.push(e.basic_sku_id)
					self.data.oilList.sku_ids = sku_ids
				}
			})
			self.clickOil()
		} else if (this.data.type === 3) {   // 变速箱油
			let sku_id = e.currentTarget.dataset.sku
			let order_id = e.currentTarget.dataset.orderid
			this.data.oilList.sku_id = sku_id
			this.data.oilList.orderId = order_id
			this.clickGearBoxOil() // 选中变速箱油发送请求
		} else { // 机油滤清器
			let itemList = {}
			let itemSon = []
			this.data.modelList.forEach(function (j) {
				if (e.currentTarget.dataset.sku === j.basic_sku_id) {
					itemSon.push(j)
					itemList.money = j.unit_price
					itemList.item = itemSon
				}
			})
			let pages = getCurrentPages();//当前页面
			let prevPage = pages[pages.length - 2];//上一页面
			prevPage.setData({//直接给上一页面赋值
				item: itemList,
				type: 2,
				go_type: 1,
			});
			wx.navigateBack({
				delta: '1'
			})
		}
	},

	onLoad(options) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		wx.hideShareMenu()
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
		this.setData({
			type: parseInt(options.type)
		})
	},
	
	async onShow() {
		this.changeList()
	},
});
