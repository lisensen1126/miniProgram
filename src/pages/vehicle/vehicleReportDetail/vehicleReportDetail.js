import {
  inspectDetailApi
} from '@/libs/modules/user'


// 获取全局应用程序实例对象
const {
	showMessage,
  globalData,
  changeDate,
	isRegistered,
} = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: '车检详情',
		top_height: '',
		show_home: false,
		id: 0, //车检的id
		index: 1, // 当前选择的点
		current: {}, // 当前查看的项
		show_view: false, // 查看视频
		paly_video: '', // 视频地址
		report: null,
	},

	// 生命周期函数--监听页面加载
	async onLoad(option) {
		wx.hideShareMenu()
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
			top_height: globalData.topbarHeight,
			id: option.id,
		})
		// 判断用户身份，未注册跳转注册授权
		if(globalData.is_registered === 2) {
			await isRegistered()
			if(globalData.is_registered === 0) {
				wx.navigateTo({
					url: '/pages/register/registerPhone/registerPhone',
				})
			} else {
				this.getDetail()
			}
		}
	},
	onShow() {
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				show_home: true
			})
		}
		if(globalData.is_registered === 1) {
			this.getDetail()
		}
		let video = wx.createVideoContext('myVideo')
		video.pause()
	},
	// 显示及隐藏弹框播放视频
	async onChangeShowState(e) {
		this.setData({
			paly_video: e.target.dataset.video,
			show_view: true
		})
	},
	// 隐藏
	async onChangeShowCloseState(e) {
		this.setData({
			show_view: false,
		})
		let video = wx.createVideoContext('myVideo')
		video.stop()
	},
	/**
	 * 点击图片放大
	 * @index  图片下标
	 * @imgArr 图片集合
	 */
	lookImage(e) {
		let obj= e.currentTarget.dataset.arr
		let img = e.currentTarget.dataset.img
		wx.previewImage({
			urls: obj,
			current: img,
			success: (res) => {},
			fail: (err) => {}
		})
	},
	// 切换检测点
	changeTab (e) {
		let index = e.currentTarget.dataset.index - 0
		let report = this.data.report
		let current = index === 1 ? report.exception : index === 2 ? report.pending : index === 3 ? report.normal : report.noninspect
		this.setData({
			index: index,
			current: current,
		})
	},
	async getDetail () {
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
			} = await inspectDetailApi({
				id: this.data.id,
			})
			if (statusCode === 200 && code === 0) {
				data.created_at = changeDate(data.created_at)
				this.setData({
					report: data,
					current: data.exception,
				})
			} else {
				showMessage({
					title: '获取我的车检记录详情失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('获取我的车检记录详情失败-getReportList', err)
		}
		wx.hideLoading()
	},
});
