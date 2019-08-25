// 获取全局应用程序实例对象
const { showMessage, globalData, cdpReport } = getApp()
import { shopCar } from '@/libs/modules/intelligent'
import {
	getMaintainList
} from '@/libs/modules/maintenance'

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		topbarHeight: 64, //
		indexInfo: null,   			// 车辆信息
		heard_image: '',			// 头部图片
		textCombination: '',		// 接收传回来的数组
		videoList: [],				// 视频列表
		imgList: [],				// 套餐列表
		brandImage: '',				// 品牌日图片
		isExpectation: false,		// 品牌日提示判断
		carList: [],				// 车图文列表
		showView: false,			// 显示及隐藏弹框播放视频
		palyVideo: '',				// 播放视频地址
		islogin: false, 			// 是否登录flag
		id: '',						// 品牌馆id
		advert_list: [],     		// 去看看页面的图片列表
		advert_title: '',    		// 页面的title和广告页title
		showHome: false,
	},
	/*** 车辆信息部分 ***/
	// 获取车辆信息
	async getCarData () {
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode,data,code,message,meta} = await shopCar()
					if(statusCode ===200 && code === 0) {
						this.setData({
							indexInfo: data.carInfo
						})
						wx.hideLoading()
						if(this.data.indexInfo === false){
							this.setData({
								pageShow: false
							})
						}else{
							this.setData({
								pageShow: true
							})
						}
					} else {
						wx.hideLoading()
						showMessage({
							title: '获取车辆信息失败',
							content: `${message}`,
						})
					}
				} catch (err) {
					wx.hideLoading()
					console.error('壳保养-getCarData', err)
		}
		wx.hideLoading()
	},

	// 跳转添加车辆
	async goAddcar (e) {
		// 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
		wx.navigateTo({
			url: '../../vehicle/vehicleAdd/vehicleAdd?index=true&is_first=1'
		})
		// cdp-点击引导添加车辆
    let target = {
      url: '/pages/vehicle/vehicleAdd/vehicleAdd',
    }
    cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)		
	},

	// 跳转管理车辆
	async goManagecar (e) {
		// 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
		wx.navigateTo({
			url: '../../vehicle/vehiclesMultiple/vehiclesMultiple'
		})
		// cdp-点击跳转页面事件
		let target = {
			url: '/pages/vehicle/vehiclesMultiple/vehiclesMultiple',
		}
		cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)		
	},

	/*** 获取品牌馆信息（整体） ***/
	async getReserve() {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		let params = {
			id: this.data.id,
		}
		try {
			const {statusCode, data, code, message} = await getMaintainList(params)
			if (statusCode === 200) {
				this.setData({
					textCombination: data,						// 接收传回来的数组
					heard_image: data.cover,					// 头图
					videoList: data.videos,						// 视频列表
					imgList: data.products,						// 保养套餐
					brandImage: data.ad,						// 品牌日
					carList: data.contents,						// 爱车有道
					advert_list: data.ad_content,    		 	// 跳转的页面的图片集合
					advert_title: data.name,
				})
				wx.setNavigationBarTitle({
					title: data.name + '品牌馆'
				})
				this.setData({
					page_title: data.name + '品牌馆'
				})  				
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取信息失败',
					content: `${message}`,
				})
			}
		} catch (err) {
		  wx.hideLoading()
		  showMessage({
				title: '网络异常',
				content: '请尝试关闭小程序后再次进入该页面',
				resolve: () => {
					wx.navigateBack()
				}
		  })
		}
		wx.hideLoading()
	},

	// 跳转商品详情
	async goMallDetail(e){
		let type = e.currentTarget.dataset.type
		let spu = e.currentTarget.dataset.spu
    let customize = {
      spuId: e.currentTarget.dataset.spu ? parseInt(e.currentTarget.dataset.spu) : '',
      skuId: e.currentTarget.dataset.sku ? parseInt(e.currentTarget.dataset.sku) : '',
    } 		
		if (type === 1) {
			let sku = e.currentTarget.dataset.sku
			wx.navigateTo({
				url: '../../mall/goodsDetail/goodsDetail?spu_id=' + spu + '&sku_id=' + sku
			})
			// cdp-点击跳转页面事件
			let target = {
				url: '/pages/mall/goodsDetail/goodsDetail',
			}
			cdpReport(1, e.currentTarget.dataset.cdp, 99, customize, '', target, this.data.enter_page_date)			
		} else {
			wx.navigateTo({
				url: `../../mall/serviceDetail/serviceDetail?spu_id=${spu}` 
			})
			// cdp-点击跳转页面事件
			let target = {
				url: '/pages/mall/serviceDetail/serviceDetail',
			}
			cdpReport(1, e.currentTarget.dataset.cdp, 99, customize, '', target, this.data.enter_page_date)			
		}
	},

	// 跳转爱车详情
	async goCarDetail(e){
    let id = e.currentTarget.dataset.id
		let at = e.currentTarget.dataset.at
		let name = e.currentTarget.dataset.name
		let content = e.currentTarget.dataset.content
    let title = e.currentTarget.dataset.title
    let isopen = e.currentTarget.dataset.isopen
    let isjoin = e.currentTarget.dataset.isjoin    
    globalData.richContent = content
    wx.navigateTo({
			url: `/pages/article/article?id=${id}&title=${title}&name=${name}&at=${at}&isopen=${isopen}&isjoin=${isjoin}&is_brand=is_brand`
		})
		// cdp-点击跳转页面事件
    let customize = {
      contentId: e.currentTarget.dataset.id ? parseInt(e.currentTarget.dataset.id) : '',
    } 		
		let target = {
			url: '/pages/article/article',
		}
		cdpReport(1, e.currentTarget.dataset.cdp, 99, customize, '', target, this.data.enter_page_date)		
	},

	// 跳转壳牌详情（介绍）
	async goDetail(e) {
		let image = this.data.textCombination.description_cover
		let describe = this.data.textCombination.brand_description
		// 在传参过程中，因为img的url中有问号，会被截断，影响describe的传参，所以先删除它
		if (image.indexOf('?imageMogr2/auto-orient') > -1) {
			image = image.replace('?imageMogr2/auto-orient','')
		}
		wx.navigateTo({
			url: `../introduce/introduce?image=${image}&describe=${describe}`
		})
		// cdp-点击跳转页面事件
		let target = {
			url: '/pages/maintenance/introduce/introduce',
		}
		cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)			
	},

	// 品牌日去看看
	goBrandDetail(e) {
		if (this.data.advert_list.length === 0) {
			this.setData({
				isExpectation: !this.data.isExpectation
			})
		}else {
			wx.navigateTo({
				url: '/pages/maintenance/advert/advert'
			})
			// cdp-点击跳转页面事件
			let target = {
				url: '/pages/maintenance/advert/advert',
			}
			cdpReport(1, e.currentTarget.dataset.cdp, 99, '', '', target, this.data.enter_page_date)	
		}
	},
	
	// 关闭敬请期待弹框
	triggercancel () {
		this.setData({
			isExpectation: false
		})
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

	async onLoad(options){
		let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true,
				id: options.id,
				topbarHeight: globalData.topbarHeight
			})
    } else {
			this.setData({
				id: options.id,
				topbarHeight: globalData.topbarHeight
			})
		}
		// 判断是否判断过注册
    if (globalData.is_registered === 2) {
      await isRegistered()
      if (globalData.is_registered == 1) {
				// this.getMaintainSuggest() // 保养建议
				this.getCarData()
      }
		}
		wx.hideShareMenu()
	},
	
	async onShow() {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    }) 		
		if (globalData.is_registered === 1){
			this.getCarData()
		}
		await this.getReserve()
		let video = wx.createVideoContext('myVideo')
		video.pause()
	},	
});
