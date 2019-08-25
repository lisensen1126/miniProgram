// 获取全局应用程序实例对象
import {maintain, carParament} from '@/libs/modules/intelligent'
const {  showMessage, cdpReport, globalData } = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		tabType: 1,						// 切换tab
		modelList: [],					// 参数列表
		tabs: [],						// 表格数据（横向）
		tab: [],						// 表格数据
		tableData: [],					// 表格数据（纵向）
		showPage: false,				// 缺省页（保养手册）
		showPageModel: false,			// 缺省页（车型参数）
    showHome: false,
    top_height: 0, // padding高度
	},
	/**
	 * 切换tab
	 * @tabType 当前选中tab
	 */
	async changeTab(e) {
		let tab_type = parseInt(e.currentTarget.dataset.tab)
		if (tab_type !== this.data.tabType) {
			this.setData({
				tabType: tab_type
			})
		}
	},

	/*** 保养手册 ***/
	// 获取保养手册参数
	async getMaintain () {
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {statusCode, data, code, message} = await maintain()
			if (statusCode ===200 && code === 0) {
				wx.hideLoading()
				this.setData({
					[`tabs[0].colHeader`]: data.x,
					tableData: data.value,
					tab: data,
					showPage: true
				})
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取保养手册失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-getMaintain', err)
		}
		wx.hideLOading()
	},

	/*** 车型参数 ***/
	// 获取车型参数
	async getCarParament () {
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {statusCode, data, code, message} = await carParament()
			if (statusCode ===200 && code === 0) {
				wx.hideLoading()
				this.setData({
					modelList: data,
					showPageModel: true
				})
			} else {
				wx.hideLoading()
				showMessage({
				title: '获取车型参数失败',
				content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-getCarParament', err)
		}
		wx.hideLOading()
	},
	/*** 获取tab传进来的值 ***/
	onLoad (options) {
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
			tabType: parseInt(options.tab)
		})
	},
	async onShow() {
		this.getMaintain()
		this.getCarParament()
	},
});
