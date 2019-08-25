// 获取全局应用程序实例对象
import {
  getStoreInfo,
  getTechnician,
  recommendTechnician,
  getLatelyStore,
} from '@/libs/modules/store'
import {
  getHot,
} from '@/libs/modules/index'
import {
  // VisitorCreate,
  getStoreByRelation,
} from '@/libs/modules/common'
import {
  getCoupon,
  getCouponsLists,
} from '@/libs/modules/coupon'

import queryScene from '@/utils/queryScene'

const {
  showMessage,
  globalData,
  changeDateTime,
  isRegistered,
  queryURL,
  getAccessId,
} = getApp()

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    storeInfo: {}, // 门店信息
    current_store_id: "", // 当前门店id
    technicianList: [], // 技师列表
    hotcakeList: [], // 爆款列表
    coupon_list: [], // 优惠卷
    preImgStatus: false, // 是否打开查看大图
    need_get_id: false, // 是否需要通过relation_id获取门店id
    relation_id: '', // 技师 id
    is_top_bar_show: false, // 是否显示top_bar
    show_tech: false,
    tech_id: '',
    need_getlocation: false,    // 是否 需要 授权地理位置
    already_getlocation: false, // 是否 已经提示 授权地理位置(不在乎结果)
    from_comment: false, // 是否从评价页面进来的
  },
  async onLoad (query) {
    // 导航栏高度
    this.setData({
      topbarHeight: globalData.topbarHeight,
    })

    // 评论之后进门店页面
    if(query.tocomment==='1'){
      this.data.from_comment = true
    }

    // 如果是扫码进入
    if(query.scene) {
      // 解码二维码的参数
      const scene = decodeURIComponent(query.scene)
      // 如果scene值使用 ',' 拼接
      if (scene.indexOf(',') > 0) {
        let obj = queryScene(scene)
        this.data.current_store_id = obj.scene.store_id
        this.data.relation_id = parseInt(obj.from_id)
        this.data.need_get_id = false
        this.data.obj = obj
        wx.setStorageSync('scene', parseInt(obj.from_id))
        wx.setStorageSync('current_store_id', obj.scene.store_id)
        return false
      } else {
        // 1. 如果是从扫描海报二维码进来的, (scene.s 代表门店id)
        if (scene.indexOf('?') !== -1) {
          let obj = queryURL(scene)
          this.data.current_store_id = obj.s
          wx.setStorageSync('current_store_id', obj.s)
          return false
        }

        // 2. 如果从二维码扫描进来 (兼容第一个版本, scene 是string类型, 代表技师 id. 通过技师id再拿storeid)
        if (parseInt(scene) > 0) {
          this.data.need_get_id = true
          this.data.relation_id = parseInt(scene)
          this.getStoreId(scene) // 获取store_id,再调其他接口
          // this.remindUserHistory()
          wx.setStorageSync('scene', parseInt(scene))
          return false
        }
      }
    }
    // 3. 如果首页切换过门店, 就不再根据地理位置拿到最近门店 
    // if (globalData.has_changed_store) {
    if (wx.getStorageSync('has_changed_store')) {
      return false
    }
    
    // 4. 正常跳转进入, 第一次进入需要授权地理位置, 根据位置, 拿到最近的门店 id
    this.data.need_getlocation = true

    // 如果有缓存store_id, 则不使用地理位置获取门店
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      this.data.current_store_id = current_store_id
      this.data.need_getlocation = false
    } else {
      this.wxGetLocation()
    }
    
  },
  // 生命周期函数--监听页面加载
  async onShow () {
    // 查看大图返回时会触发 onshow 时 return
    if (this.data.preImgStatus === true) {
      this.data.preImgStatus = false
      return false
    }

    // 2. 二维码扫描进来，需要通过relation_id获取门店id, 第一次进入需要return
    if (this.data.need_get_id === true) {
      return false
    }

    // 3. 如果需要授权位置, 你没有授权(第一次走onshow), return
    if (this.data.need_getlocation && !this.data.already_getlocation) {
      return false
    }

    // 2、3 没有拿是否有 current_store_id 来判断, 是因为 current_store_id 不是必须的, 接口会有默认, 
    
    // 调用接口
    this.getStoreInfoFnc() // 门店信息
    this.getHotcake() // 爆品推荐
    // 以下五行, 顺序不能变, 必须先判断身份,再请求优惠卷、技师
    if (globalData.is_registered === 2) {
      await isRegistered()
      getAccessId(this.data.obj)
    }
    this.getCouponList() // 优惠卷
    this.getTechnicianList() // 推荐技师列表

    // 评价完成, 返回需要滑动到技师评价位置
    if (this.data.from_comment) {
      setTimeout(()=>{
        wx.pageScrollTo({
          scrollTop: 1000,
          duration: 300,
          selector:'#comment-box',          
        })
      },1000)
    }
  },
  // 获取地理位置
  wxGetLocation () {
    let self = this
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        // 拿到经纬度, 根据经纬度换取 store_id
        self.data.already_getlocation = true
        self.getLatelyStoreId(res.longitude, res.latitude)
      },
      fail() {
        // 没有拿到经纬度 
        self.data.already_getlocation = true
        self.onShow()
      },
    })
  },
  // 获取门店id
	async getLatelyStoreId(lng, lat) {
		wx.showLoading({
			title: '加载中...',
			mask: true,
		})
    try {
      const {statusCode, data, code} = await getLatelyStore({
				local_lng: lng ? lng : '',
        local_lat: lat ? lat : '',
        no_store: true,
			})
      if (statusCode === 200 && code === 0) {
        this.data.current_store_id = data.store_id
        wx.setStorageSync('current_store_id', data.store_id)
        this.onShow()
			} else {
        showMessage({
          title: '获取最近门店失败',
          content: `${message}`,
        })
      }
    } catch (err) {
			wx.hideLoading()
			console.error('获取最近门店失败-getStoreDetail:', err)
    }
	},	
  closeTechModel () {
    this.getTechnicianList()
    this.setData({
      show_tech: false,
    })
  },
  showTech (e) {
    this.setData({
      tech_id: e.currentTarget.dataset.techniciansid,
      show_tech: true,
    })
  },
  // 去切换门店列表
  changeStore (e) {
    wx.navigateTo({
      url: '/pages/storeList/storeList',
    })
  },
  // 获取门店信息
  async getStoreInfoFnc () {
    try {
      const {
        statusCode,
        code,
        data,
        message,
      } = await getStoreInfo()
      if (statusCode === 200 && code === 0) {
        data.avg_ratings = (data.avg_ratings / 100).toFixed(1) + ''
        let arr = data.avg_ratings.split('.')
        let points = arr[0]
        let half = 0
        let inActive = 0
        if (arr.length === 2) {
          half = arr[1]
          inActive = 4 - points
        } else {
          inActive = 5 - points
        }
        if (data.comments.length > 0) {
          data.comments.forEach(ele => {
            ele.created_at = changeDateTime(ele.created_at)
          })
        }
        if (data.videos.length > 0) {
          data.images.unshift({
            type: 1,
            image: [...data.videos],
          })
        }
        globalData.photoAlbum = data.images
        this.setData({
          points: Number(points),
          half: Number(half),
          inActive: inActive,
          storeInfo: data,
        })
      } else {
        showMessage({
          title: '获取门店信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('门店-getStoreInfoFnc:', err)
    }
  },
  // 获取优惠卷
  async getCouponList () {
    try {
      const {
        statusCode,
        code,
        data,
        message,
      } = await getCouponsLists({
        page: 1,
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        this.setData({
          coupon_list: data.slice(0, 3),
        })
      } else {
        showMessage({
          title: '获取技师列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('门店-getCouponList:', err)
    }
  },
  // 领取优惠卷
  async receiveCoupon (event) {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }

    let self = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      coupon_id: event.target.dataset.id,
      obtain_type: 4,
    }
    // 存在技师id
    if (self.data.relation_id) {
      params.relation_id = parseInt(self.data.relation_id)
    }
    // 当前时间 减去 获取access_id的时间 是否超过五分钟
    if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
      params.access_id =  wx.getStorageSync('access_id').access_id
    }
    try {
      const {
        data,
        statusCode,
        code,
        message,
      } = await getCoupon(params)
      if (statusCode === 200 && code === 0) {
        // wx.hideLoading()
        wx.showToast({
          title: '领取成功',
          icon: 'none',
          duration: 1000,
        })
        let newlist = []
        newlist = this.data.coupon_list.map(item => {
          if (item.coupon_id == params.coupon_id) {
            item.receive_status = 3
            item.cc_id = data[0].cc_id
          }
          return item
        })
        this.setData({
          coupon_list: newlist,
        })
      } else {
        showMessage({
          title: '领取优惠券失败',
          content: `${message}`,
        })
        // wx.hideLoading()
      }
    } catch (err) {
      console.error('门店-receiveCoupon:', err)
    } finally {
      wx.hideLoading()
    }
  },
  // 使用优惠券
  goUse (event) {
    const coupon = event.target.dataset.item
    if (coupon.coupon_use_type == 2) {
      wx.navigateTo({ url: '/pages/mall/categories/categories?category_id=0&type=2' })
    } else {
      wx.navigateTo({ url: '/pages/applicable/applicable?ccId=' + coupon.cc_id + '&type=' + coupon.coupon_use_type })
    }
  },
  // 获取推荐技师
  async getTechnicianList () {
    try {
      const {
        statusCode,
        code,
        data,
        message,
      } = await getTechnician()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // data.forEach(v => {
        //   if (v.memFace) {
        //     v.memFace = scaleImage(v.memFace, 3, 160, 160)
        //   }
        // })
        this.setData({
          technicianList: data,
        })
      } else {
        showMessage({
          title: '获取技师列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('门店-getTechnicianList:', err)
    }
  },
  /**
	 * 推荐技师
	 * @techniciansid   技师ID
	 */
  async recommendTechnician (e) {
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }


    let index = e.currentTarget.dataset.index
    let is_like = e.currentTarget.dataset.like
    let self = this

    // is_like 1表示可以推荐  2表示不可推荐
    if (is_like === 2) {
      wx.showToast({
        title: '一个技师只能点赞5次哟',
        icon: 'none',
        duration: 2000,
        mask: true,
      })
      return
    }
    if (self.data.technicianList[index].zan_active) {
      // 不能连续点赞
      console.log('不能连续点赞')
      return
    }
    self.data.technicianList[index].zan_active = true
    self.setData({
      technicianList: self.data.technicianList,
    })
    setTimeout(function () {
      self.data.technicianList[index].zan_active = false
      self.setData({
        technicianList: self.data.technicianList,
      })
    }, 1200)


    try {
      const {
        statusCode,
        code,
        data,
        message,
      } = await recommendTechnician({
        technicians_id: e.currentTarget.dataset.techniciansid,
      })
      if (statusCode === 200 && code === 0) {
        wx.showToast({
          title: '推荐成功',
        })
        this.data.technicianList.forEach(ele => {
          if (ele.technicians_id == e.currentTarget.dataset.techniciansid) {
            ele.recommend_num = parseInt(ele.recommend_num) + 1
            // data.surplus  代表剩余推荐次数
            if (data.surplus == 0) {
              ele.is_like = 2
            }
          }
        })
        this.setData({
          technicianList: this.data.technicianList,
        })
      } else if (code === 10010011) {
        showMessage({
          title: '推荐失败',
          content: `${message}`,
        })
      } else {
        showMessage({
          title: '推荐失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('门店-recommendTechnician:', err)
    }
  },
  // 拨打电话
  makePhoneCall (e) {
    let phone = e.currentTarget.dataset.phone
    wx.makePhoneCall({
      phoneNumber: phone,
      success () {
      },
      fail (err) {
        console.error('门店-makePhoneCall', err)
      },
    })
  },
  /**
	 * 点击图片放大
	 * @index  图片下标
	 * @imgArr 图片集合
	 */
  previewImage (e) {
    this.data.preImgStatus = true
    let index = e.currentTarget.dataset.index
    let imgArr = e.currentTarget.dataset.arr.map(x => x.image_url)
    wx.previewImage({
      urls: imgArr,
      current: imgArr[index],
      success: (res) => {},
      fail: (err) => {},
    })
  },
  // 打开地图
  openMap (e) {
    const lng = parseFloat(this.data.storeInfo.lng)
    const lat = parseFloat(this.data.storeInfo.lat)
    wx.openLocation({
        latitude: lat,
        longitude: lng,
    })
  },
  // 爆款
  async getHotcake () {
    wx.showNavigationBarLoading()
    try {
      const {
        statusCode,
        data,
        code,
        message,
        meta,
      } = await getHot({
        per_page: 4,
        page: 1,
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        data.forEach(element => {
          element.sell_price = (element.sell_price / 100).toFixed(2)
        })
        this.setData({
          hotcakeList: data,
        })
        // wx.setStorage('S_HOTCAKE_LIST', JSON.stringify(data))
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取爆款精品失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('门店-getHotcake:', err)
    }
  },
  /**
	 * 跳转商品详情
	 * @spu  spuID
	 * @sku	 skuID
	 * @type 1:商品详情 2:服务详情
	 */
  async goMallDetail (e) {
    let spu = e.currentTarget.dataset.spu
    // let sku = e.currentTarget.dataset.sku
    if (e.currentTarget.dataset.type == 1) {
      wx.navigateTo({
        // url: `/pages/mall/goodsDetail/goodsDetail?spu_id=${spu}&sku_id=${sku}&go_type='store'`,   // 3.8.10修改
        url: `/pages/mall/goodsDetail/goodsDetail?spu_id=${spu}&go_type='store'`,
      })
    } else if (e.currentTarget.dataset.type == 2) {
      wx.navigateTo({
        url: `/pages/mall/serviceDetail/serviceDetail?spu_id=${spu}&go_type='store'`,
      })
    } else if (e.currentTarget.dataset.type == 16) {
      wx.navigateTo({
        url: `/pages/card/purchaseDetails/purchaseDetails?card_id=${spu}`,
      })
    }
  },
  // 门店评价列表
  goStoreEvaluate (e) {
    wx.navigateTo({
      url: '/pages/storeEvaluate/storeEvaluate',
    })
  },
  // 技师列表
  goTechnicianList (e) {
    wx.navigateTo({
      url: '/pages/technicianList/technicianList',
    })
  },
  // 跳转领券中心列表
  async goVoucher (e) {
    wx.navigateTo({
      url: '/pages/coupon/voucher/voucher',
    })
  },
  // 去评价 - 悬浮按钮
  goCreateEvaluate (e) {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }

    wx.navigateTo({
      url: '/pages/perevaluate/storeEvaluate/storeEvaluate',
    })
  },
  // 查看图册
  goPhotoAlbum (e) {
    let type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/photoAlbum/photoAlbum?type=${type}`,
    })
  },

  // 记录用户访问记录
  // async remindUserHistory () {
  //   // form_type 来源页面类型：1首页，2领券中心，3门店详情，4门店评价
  //   let params = {
  //     relation_id: this.data.relation_id,
  //     from_type: 3,
  //   }
  //   await VisitorCreate(params)
  //   wx.hideLoading()
  // },
  // 获取门店id并存储当前门店id,请求接口公共方法传入该参数
  async getStoreId (id) {
    try {
      const {statusCode, data, code } = await getStoreByRelation({
        relation_id: id,
      })
      if (statusCode === 200 && code === 0) {
        this.data.current_store_id = data.store_id 
        wx.setStorageSync('current_store_id', data.store_id) // 存储当前门店id,请求接口公共方法传入该参数
        this.data.need_get_id = false
        this.onShow()
      } else {
        showMessage({
          title: '获取门店信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('门店-getStoreId:', err)
    }
  },
  // 页面分享设置
  onShareAppMessage () {
    let url = 'pages/store/store?share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = 'pages/store/store?current_store_id=' + current_store_id
    }
    return {
      title: '门店详情',
      path: url,
      success: (res) => {
      },
    }
  },
	 // 监听页面滚动
  onPageScroll (e) {
    if (e.scrollTop > 60) {
      if(!this.data.is_top_bar_show){
        this.setData({
          is_top_bar_show: true,
        })
      }
    } else {
      if(this.data.is_top_bar_show){
        this.setData({
          is_top_bar_show: false,
        })
      }
    }
  },
})
