// 获取全局应用程序实例对象
const {globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		topbarHeight: 64,
		title: 'photoAlbum',
		list: [],
		currentLevel: '0',
		scrollPosition: null,
		showView: false,			// 显示及隐藏弹框播放视频
		palyVideo: '',
	},
	// 生命周期函数--监听页面加载
	onLoad(options) {
		wx.hideShareMenu()
		this.setData({
			topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式,防止顶部tab被遮挡
			currentLevel: options.type - 1 + '',
			scrollPosition: 'filter' + (options.type - 1)
		})
		if(globalData.photoAlbum) {
			globalData.photoAlbum.forEach(ele => {
				if (ele.type == options.type) {
					this.setData({
						list: ele.image
					})
				}
			})
		}
		this.pauseVideo()
		// TODO: onLoad
	},
	onShow () {
		this.setData({
			topbarHeight: globalData.topbarHeight
		})
		this.pauseVideo()
	},
	onHide () {
		this.pauseVideo()
	},	
	// tab切换并获取订单列表
	switchLevel({
		currentTarget
	}) {
		if(this.data.currentLevel === currentTarget.dataset.level){
			return
		} else {
			let arr = globalData.photoAlbum.filter(ele => {
				if (ele.type === (Number(currentTarget.dataset.level) + 1)) {
					return ele
				}
			})
			this.setData({
				list: (arr.length && arr[0].image.length > 0) > 0 ? arr[0].image : [],
				currentLevel: currentTarget.dataset.level
			})
		}
	},
	// 点击图片放大
	previewImage(e) {
		let index = e.currentTarget.dataset.index
		// 将图片数组处理成一维数组
		let imgArr = e.currentTarget.dataset.arr.map((element, index) => {
			element = element.image_url
			return element
		});
		wx.previewImage({
			urls: imgArr,
			current: imgArr[index],
			success: (res) => {},
			fail: (err) => {}
		})
	},
	// 初始化视频禁止播放
	pauseVideo () {
		if(this.currentLevel === '0') {
			this.data.list.forEach((element, index) => {
				let video = wx.createVideoContext(`my-video${index}`)
				video.pause()
			});
		}
	},
	// 视频播放的时候只可以放一条（开发工具可用，真机无用）
	videoPlay (e) {
		let e_index = e.currentTarget.dataset.index
		this.data.list.forEach((element, index) => {
			let video = wx.createVideoContext(`my-video${index}`)
			if( index === e_index) {
				video.play()
			} else {
				video.pause()
			}
		});
	},
	// 显示及隐藏弹框播放视频
	async onChangeShowState(e) {
		this.setData({
			palyVideo: e.target.dataset.url,
			showView: true
		})
	},

	// 隐藏
	async onChangeShowCloseState(e) {
		this.setData({
			palyVideo: e.target.dataset.url,
			showView: false,
		})
		let video = wx.createVideoContext('myVideo')
		video.stop()
	},	
});