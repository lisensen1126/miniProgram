// 获取全局应用程序实例对象
import {storeInfo, addStoreEvaluate, technicianList} from '@/libs/modules/user'
import {
  // VisitorCreate, 
  getStoreByRelation
} from '@/libs/modules/common'
import {scaleImage} from '@/libs/utils'
import {getCouponStateApi} from '@/libs/modules/coupon'
import {getCommentListApi} from '@/libs/modules/store'
const {globalData, showMessage, isRegistered, getAccessId} = getApp()
import { sendFormId } from '@/utils/formid'
import queryScene from '@/utils/queryScene'
Page({ 
	data: {
		topbarHeight: 64,
		title: '门店评价',
		list: {
			item: [],
			store: {
				gray_star:5
			},
		},
		comment_list: [
      {is_select: false, name: '服务态度好！'},
      {is_select: false, name: '不错！下次还会来！'},
      {is_select: false, name: '技师专业！ 老板热情！'},
      {is_select: false, name: '服务棒！ 态度好！'},
      {is_select: false, name: '值得推荐的一家店～'},
      {is_select: false, name: '为你们的服务点赞！'}
    ],
		isTypeComment:false, // 是否用户自己输入评价，默认不
		isLoading: false,
		// 评分数字
		scoreNum: 5,
		// 初始化页面所需数据
		sendInfo: {
			storeImg: '',
			storeName: '',
			storeId: '',
			storeAddress: '',
			commentText: '',
			wx_uid: [], // 技师ID
			technicians_id: []
		},
		jishi: [],
		isclick: false,
		// 回首页按钮展示
		isShowHome: false,
		// 技师id
		teacherId: 0,
		isShowCoupon: false,	// 优惠券弹框
		isEvalute: false,		// 评价弹框
		showText: true,
		need_get_id: false, // 是否需要通过relation_id获取门店id
		coupon_list: [],        // 首次评价有礼，优惠券列表  
		is_register_show: false,  
		hasClose:false
	},
	// formid 收集
	sendFormId,
  
  // 生命周期函数--监听页面加载
	async onLoad(query) {
		this.setData({
			topbarHeight: globalData.topbarHeight,
		})
		wx.hideShareMenu()
    // 分享二维码进入场景接收参数  scene: 传值xxx，不传：0
    let self = this
    let obj = {}
    // 当前小程序历史路径
    let historyLength =  getCurrentPages().length
    // 由分享二维码进入 历史路径只有一条
		if (historyLength <= 1) {
			self.setData({
				isShowHome: true,
			})
    }
    // 如果是扫码进入
    if(query.scene) {
      // 解码二维码的参数
      const scene = decodeURIComponent(query.scene)
      // 如果scene值使用 ',' 拼接
      if (scene.indexOf(',') > 0) {
        obj = queryScene(scene)
        this.data.relation_id = parseInt(obj.from_id)
        this.data.need_get_id = false
        wx.setStorageSync('scene', obj.from_id)
        wx.setStorageSync('current_store_id', obj.scene.store_id)
      } else {
        // 如果从二维码扫描进来 (兼容第一个版本, scene 是string类型)
        this.data.relation_id = parseInt(scene)
        this.data.need_get_id = true
        wx.setStorageSync('scene', scene)
        this.getStoreId(scene) // 获取store_id,再调其他接口
        // this.remindUserHistory()
      }
    } else {
      this.data.need_get_id = false
    }
		await this.getCommentList()
		if (this.data.need_get_id == false) {
			this.getStoreInfo()
			this.getTechnicianList()
		}
		if (globalData.is_registered == 2) {
      await isRegistered()
      getAccessId(obj)
			if(globalData.is_registered == 0) {
				this.setData({
					is_register_show: true
				})
			}
		}
  },
  
  
	async onShow() {
		let self = this	
		// 当前小程序历史路径
		let historyLength =  getCurrentPages().length
		if (historyLength<=1) {
			self.setData({
				isShowHome: true,
				enter_page_date: new Date() / 1,
				isShowCoupon: false
			})
		}	else {
			// 进入页面的时间
			this.setData({
				enter_page_date: new Date() / 1,
				isShowCoupon: false
			})
		}
		// 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered == 0) {
			this.setData({
				is_register_show: true
			})
      return
    } else {
      // 缓存中的技师id
      let scene = wx.getStorageSync('scene')
      // 可以判断是由分享二维码进入
      if (parseInt(scene) > 0){
        // 历史路径只有一条展示返回首页
        // 更新技师关联id
        self.setData({
          relation_id: scene
				})
	      // this.remindUserHistory()
      }
			this.setData({
				is_register_show: false
			})
		}	
	},

	// 获取门店信息
	async getStoreInfo() {
		try {
			const {
				statusCode,
				data,
				code,
				message,
			} = await storeInfo({})
			if (statusCode === 200 && code === 0) {
				if (data.banner === '') {
					data.banner = 'https://oss1.chedianai.com/images/assets/category-default.png'
				}
				this.setData({
					'sendInfo.storeImg': scaleImage(data.banner,3,130,130),
					'sendInfo.storeName': data.store_name,
					'sendInfo.storeAddress': data.address,
					'sendInfo.storeId': data.store_id,
					isLoading: true,
				})
			} else {
				showMessage({
					title: '获取评价详情失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('门店评价-getStoreInfo:', err)
		}

	},
	// 隐藏选择评论
	hideComment(){
		this.setData({
			isTypeComment:true
		})
	},

	// 选择评价
	chooseInfo(e){
		let tempindex = e.currentTarget.dataset.index
    let curr = e.currentTarget.dataset.params
		let tempstr=''
    this.data.comment_list.forEach((v, index) => {
			if (tempindex == index) {
				v.is_select = !v.is_select
			}
			if(v.is_select){
				tempstr = tempstr + v.name + '，'
			}
    })
		// 去掉最后一个逗号
		tempstr=tempstr.substr(0,tempstr.length-1)
    this.setData({
			comment_list: this.data.comment_list,
			'sendInfo.commentText':tempstr
		})
	},

	// 提交评价
	addEvaluate(){

	},

	// 改变star
	changeStar(e) {
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
			return
		}
		let nowDetail = this.data.list
		let num = e.currentTarget.dataset.num
		nowDetail.store.gray_star = num + 1
		this.setData({
			list: nowDetail,
			scoreNum: nowDetail.store.gray_star
		})
	},

	// 获取textarea中的值
	getTextarea({
		detail
	}) {
		this.setData({
			'sendInfo.commentText': detail.value.replace(/(^\s*)|(\s*$)/g, "")
		})
	},

	// 调起多行文本的键盘事件，兼容部分机型手触时无法调起键盘的问题
	openKeyboard () {
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
			return
		}
		this.setData({
			focus: true 
		})
	},

	// 图片上传到服务器
	async upImg(path, str) {
		var self = this
		wx.showLoading({
			title: '图片上传中...',
			mask: true,
		})
		wx.uploadFile({
			url: globalData.host + globalData.apiRoot + 'comment/image_upload',
			filePath: path,
			name: 'file',
			header: {
				'content-type': 'multipart/form-data',
				'Authorization': `Bearer ${globalData.token}`,
				'Shop-Hash': globalData.shopHash
			},
			success: function (res) {
				let data = JSON.parse(res.data)
				if (data.code == 0) {
					self.data.list.item.push(data.data.image_url)
					self.setData({
						'list.item': self.data.list.item,
					})
					if (str) wx.hideLoading()
				} else {
					wx.hideLoading()
					showMessage({
						title: '图片上传失败',
						content: '请重新上传！',
					})
				}
			},
			fail: function () {
				wx.hideLoading()
				showMessage({
					title: '图片上传失败',
					content: '请重新上传！',
				})
			},
		})
	},

	// 图片上传(选择图片来源)
	chooseImageTap: function (e) {
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
			return
		}
		let store = e.currentTarget.dataset.type
		let self = this;
		wx.showActionSheet({
			itemList: ['从相册中选择', '拍照'],
			itemColor: "#f7982a",
			success: function (res) {
				if (!res.cancel) {
					if (res.tapIndex == 0) {
						self.chooseWxImage('album')
					} else if (res.tapIndex == 1) {
						self.chooseWxImage('camera')
					}
				}
			}
		})
	},

	// 图片上传(调用微信选择图片API，拿到图片临时路径)
	chooseWxImage: function (type) {
		let self = this;
		wx.chooseImage({
			count: 3 - self.data.list.item.length,
			sizeType: ['original', 'compressed'],
			sourceType: [type],
			success: function (res) {
				wx.showLoading({
					title: '加载中...',
					mask: true,
				})
				for (var i in res.tempFilePaths) {
					var str = false
					if (i == res.tempFilePaths.length - 1) {
						str = true
					}
					self.upImg(res.tempFilePaths[i], str)
				}
			}
		})
	},

	// 删除
	del({
		currentTarget
	}) {
		this.data.list.item.splice(currentTarget.dataset.index, 1)
		this.setData({
			'list.item': this.data.list.item
		})
	},

	// 获取技师列表 technicianList
	async getTechnicianList() {
		try {
			const {
				statusCode,
				data,
				code,
				message,
			} = await technicianList({is_comment: 1})
			if (statusCode === 200 && code === 0) {
				data.forEach(v => {
					v.checked = true
				})
				this.setData({
					'jishi': data,
				})
			} else {
				showMessage({
					title: '温馨提示',
					content: message,
				})
			}
		} catch (err) {
			console.error('门店评价-getTechnicianList:', err)
		}
	},

	// 选择技师
	selectTechnician(e) {
		let _this = this
		// 没有注册就去注册
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
			return false
		}
		// 已经选了四个技师提示
		if (this.data.sendInfo.technicians_id.length >= 4 && e.currentTarget.dataset.item.checked) {
			wx.showToast({
        title: '最多可推荐4位技师',
        icon: 'none',
        duration: 2000,
        mask: true,
			})
			return false
		}
		this.data.jishi.forEach(v => {
			// 选中
			if (v.technicians_id == e.currentTarget.dataset.item.technicians_id) {
				v.checked = !v.checked
				if (!v.checked) {    // 如果是选中状态，将需要给后台传递的参数存储起来
					_this.data.sendInfo.technicians_id.push(v.technicians_id)
					_this.data.sendInfo.wx_uid.push(v.wx_uid)
				} else {            // 如果将选中状态取消，则数组中对应的数据删除
					let tec = _this.data.sendInfo.technicians_id.indexOf(v.technicians_id)
					let uid = _this.data.sendInfo.wx_uid.indexOf(v.wx_uid)
					_this.data.sendInfo.technicians_id.splice(tec, 1)
					_this.data.sendInfo.wx_uid.splice(uid, 1)
				}
			}
		});
		this.setData({
			jishi: this.data.jishi
		})
	},

	// 添加评论
	async submit() {
		// 如果没输入评价，则不提交
		if(!this.data.sendInfo.commentText){
			return
		}
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
			return
		}
		let self = this
		// 数据验证，评分必填，评价内容必填，技师非必填，图片非必填
		if (this.data.scoreNum === 0 || this.data.sendInfo.commentText === '') {
			showMessage({
				title: '提示',
				content: '别忘了留下您的评价哦！',
			})
			return false
		}
		if (this.data.sendInfo.commentText.length < 5) {
			showMessage({
				title: '提示',
				content: '再多说点什么吧，评价内容不得少于5个字',
			})
			return false
		}
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
		try {
			let params = {
        comment_content: self.data.sendInfo.commentText,
        score: self.data.scoreNum,
        image_url: self.data.list.item,
        technicians_id_items: self.data.sendInfo.technicians_id || [],
        wx_uid_items: self.data.sendInfo.wx_uid || [],
			}
      // 存在关联技师id
      if (self.data.relation_id) {
        params.relation_id = parseInt(self.data.relation_id)
      }
      // 当前时间 减去 获取access_id的时间 是否超过五分钟
      if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
        params.access_id =  wx.getStorageSync('access_id').access_id
      }

			const {
				statusCode,
				code,
				message,
				data
			} = await addStoreEvaluate(params)
			if (statusCode === 200 && code === 0) {
				wx.hideLoading()
				if (data.state) {
					this.setData({
						showText: false
					})
					this.fetchCouponList()        // 获取首次评价优惠券
				} else {
					this.setData({
						isEvalute: true,
						showText: false
					})
					setTimeout(() => {
						this.evaluteCancel()
					}, 2000);
				}
			} else {
				wx.hideLoading()
				showMessage({
					title: '温馨提示',
					content: message,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('门店评价-submit:', err)
		}
	},

  // 记录用户访问记录
  // async remindUserHistory() {
  //   // form_type 来源页面类型：1首页，2领券中心，3门店详情，4门店评价
  //   let params = {
  //     relation_id: parseInt(this.data.relation_id),
  //     from_type: 4
  //   }
  //   await VisitorCreate(params)
  //   wx.hideLoading()
	// },
	
	// 获取门店id并存储当前门店id,请求接口公共方法传入该参数
	async getStoreId (id) {
    try {
      const {statusCode, data, code,} = await getStoreByRelation({
				relation_id: id,
			})
      if (statusCode === 200 && code === 0) {
				wx.setStorageSync('current_store_id', data.store_id) // 存储当前门店id,请求接口公共方法传入该参数
				// 继续调用页面其他接口
				this.getStoreInfo()
				this.getTechnicianList()
			} else {
				showMessage({
					title: '获取门店信息失败',
					content: `${message}`,
				})
			}
    } catch (err) {
      console.error('门店评价-getStoreId:', err)
    }
	},

	// 关闭有礼
	couponCancel() {
		this.setData({
			isShowCoupon:false
		})
		this.evaluteCancel()	
	},

	// 评价完成
	evaluteCancel () {
		if(this.data.hasClose){
			return false
		}
		this.setData({
			hasClose:true
		})
		wx.switchTab({
			url: '/pages/store/store?tocomment=1',
		});		
	},

	// 评价有礼数据
	async fetchCouponList () {
		try {
      const {statusCode, data, code,} = await getCouponStateApi({
				from_type: 2
			})
      if (statusCode === 200 && code === 0) {
				if (data.length > 0) {
					this.setData({
						isShowCoupon: true,
						coupon_list: data,
					})
				}
			} else {
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      console.error('门店评价-fetchCouponList:', err)
    }
	},

	goRegister () {
		if (globalData.is_registered === 0) {
			wx.navigateTo({
				url: '/pages/register/registerPhone/registerPhone',
			})
		}
	},

	async getCommentList(){
		try {
			const {
				statusCode,
				data,
				code,
				message,
			} = await getCommentListApi()
			if (statusCode === 200 && code === 0) {
				let arr=data.map(v=>{
					return {
						is_select:false,
						name:v
					}
				})
				this.setData({
					comment_list:arr
				})
			} else {
				showMessage({
					title: '获取评价列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			console.error('门店评价-getCommentList:', err)
		}
	},
});