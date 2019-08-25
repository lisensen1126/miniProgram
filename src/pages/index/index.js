// 获取全局应用程序实例对象
import {
  shopHome,
  indexCarApi,
  rotationImageApi,
  getOpenConfigApi,
  getWeather,
  getBrands,
  tipsListApi,
  maintainSuggestApi,
} from '@/libs/modules/index'
import {
  // VisitorCreate, 
  getStoreByRelation
} from '@/libs/modules/common'
// 秒杀
import {getSpikeSkuListApi} from '@/libs/modules/spike'
// 拼团
import {groupGoodsSkuList} from '@/libs/modules/shopGroup'
// 养护卡
import {getCardCenterListApi} from '@/libs/modules/mycard'
// 优惠券
import {getCouponsLists, getCoupon, getCouponStateApi} from '@/libs/modules/coupon'
// 解码二维码scene
import queryScene from '@/utils/queryScene'
// 获取全局应用程序实例对象
const {
  showMessage,
  globalData,
  countDown,
  isRegistered,
  queryURL,
  getAccessId,
} = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		title: '',  // 首页标题
    imgUrls: [], //轮播图列表
    currentSwiper: 0, //轮播图下标
    weather_data: null, //天气
    superBrandList: [], //品牌列表
    currentIconSwiper: 0, //金刚下标
    navList: [], // 金刚列表
    spike_list: [], // 秒杀列表
    groupList: [], // 拼团列表
    brandList: [], // 品牌专区列表
    maintain_type: null, // 保养建议
    tipList: [], // 小贴士列表
    coupon_list: [], // 优惠券列表
    card_list: [], // 养护卡列表
    default_car: null, //车辆信息
    lat: null, // 纬度
    lng: null, // 经度
    topbarHeight: 0, // 头部padding-top高度
    need_get_id: false, // 是否需要通过进入场景 scene 获取门店id
    showOfficial: true, // 在页面滚动时，控制关注公众号组件显隐
    openOfficial: false, // 门店后台已开启展示推荐公众号功能且用户未关注公众号，则展示推荐公众号组件
    guide_cover: false,   // 是否显示引导添加到我的小程序浮层
    isShowOpen: false, // 显示开机大屏
    isShowCoupon: false, // 显示推送优惠券弹框
    recommend_coupon: [],     // 推荐的优惠券列表数据
    scene: 0, // 解码二维码的参数
    skeleton: true,  // 骨架屏
    timer_skeleton: '', // 骨架屏消失定时器
  },

	// 生命周期函数--监听页面加载
	async onLoad(query) {
    let self = this
    // 解码二维码的参数
    const scene = decodeURIComponent(query.scene)
    if (scene.indexOf('?') !== -1) {
      console.log(scene, '解析参数')
			let obj = queryURL(scene)
      wx.setStorageSync('current_store_id', obj.s)
    }
    if (parseInt(scene) > 0) {
      this.data.scene = parseInt(scene)
      this.data.need_get_id = true
      this.getStoreId(scene)
      wx.setStorageSync('scene', parseInt(scene))
    } else {
      this.data.need_get_id = false
    }

    this.data.timer = setTimeout(function () {
      self.setData({skeleton: false})
    }, 1000)
    this.setData({
      topbarHeight: globalData.topbarHeight
    })
    // 根据位置获取天气
    this.getWeather()
    // 轮播
    this.rotationImageFun()
    // 小贴士
    this.getMaintainTips()
    // 开机大屏
    this.getOpenConfig()
    // 判断是否判断过注册
    if (globalData.is_registered === 2) {
      await isRegistered()
      if (globalData.is_registered == 1) {
        this.getMaintainSuggest() // 保养建议
        this.getDefaultCarData() // 默认车辆
        this.fetchCouponList() // 推送优惠卷
      }
      this.getCouponList() // 优惠卷列表
    }
     // 门店后台已开启展示推荐公众号功能，则展示推荐公众号组件
    if (globalData.official_is_open == 1) {
      if (wx.getLaunchOptionsSync().scene === 1047 || wx.getLaunchOptionsSync().scene === 1011) {
        this.setData({
          openOfficial: true
        })
      }
    }
    this.getBrandFun() // 品牌专区列表
		this.getCardList() // 养护卡列表
  },

	async onShow() {
    globalData.CATEGORY = null
    this.setData({
      is_show_open: globalData.is_show_open,
      isShowCoupon: false
    })
    
    // 正在调用接口，通过二维码参数 relation_id 获取门店id
    if (this.data.need_get_id === true) {
      return false
    }
    // 获取缓存中的技师id
    let scene = wx.getStorageSync('scene')
    // 可以判断是由分享二维码进入
    if (parseInt(scene) > 0) {
      this.data.scene = parseInt(scene)
      // 记录用户使用记录
      // this.remindUserHistory()
    }
    if (globalData.is_registered == 1) {
      this.getMaintainSuggest() // 保养建议
      this.getDefaultCarData() // 默认车辆
      await this.fetchCouponList() // 推送优惠卷
      if (this.data.recommend_coupon) {
        this.setData({
          isShowCoupon: true
        })
      }
    }

    if (globalData.is_registered !== 2) {
      this.getCouponList() // 优惠卷列表
    }
    this.getIndexData() // 金刚区
		this.getSpikeList() // 秒杀列表
    this.getGroupList() // 拼团列表
	},
  // 获取金刚区
  async getIndexData() {
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await shopHome()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // 更新缓存
        wx.setStorageSync('current_store_id', data.store_id) // 存储当前门店id,请求接口公共方法传入该参数
        globalData.ep_store_name = data.store_name
        // 金刚区
        let new_data = [
          [
            data.list[0],
            data.list[1],
            data.list[2],
            data.list[3],
          ],
          [
            data.list[4],
            data.list[5],
            data.list[6],
            data.list[7],
          ],
        ]
        this.setData({
          is_chain: data.is_chain, // 1：连锁店；2：非连锁店
          store_name: data.store_name,
          navList: new_data
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取首页信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getIndexData', err)
    }
    wx.hideLOading()
  },

  // 获取车辆信息
  async getDefaultCarData() {
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await indexCarApi()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // 全局存放车辆数据，商品列表页面要使用该参数
        globalData.default_vehicle = data
        this.setData({
          default_car: data,
        })
        // 更新缓存
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取车辆信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getDefaultCarData', err)
    }
    wx.hideLOading()
  },

  // 获取位置信息
  // async getLocation() {
  //   this.getWeather()
  // },

  // 获取天气信息
  async getWeather() {
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await getWeather({
        lat : this.data.lat,
        lng : this.data.lng,
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        this.setData({
          weather_data: data,
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取天气信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getWeather', err)
    }
  },
  // 去保养
  goIntelligent() {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    wx.navigateTo({
      url: '/pages/intelligent/intelligent/intelligent'
    })
  },
  // 添加车辆、爱车档案
  goAddcar() {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    wx.navigateTo({
      url: '../vehicle/vehicleAdd/vehicleAdd?index=true&is_first=1'
    })
  },
  // 管理车辆
  goManagecar(e) {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    wx.navigateTo({
      url: '../vehicle/vehiclesMultiple/vehiclesMultiple'
    })
  },
  // 去切换门店页面
  changeStore (e) {
    wx.navigateTo({
      url: '/pages/storeList/storeList'
    })
  },

  // 轮播图
  async rotationImageFun() {
    let self = this
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await rotationImageApi()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        data.forEach(function (listItem) {
          listItem.url = self.formateTypeFun(listItem.value_content, listItem.value_type)
        })
        // 轮播列表
        self.setData({
          imgUrls: data
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: `获取轮播图列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-rotationImageFun', err)
    }
    wx.hideLoading()
  },

  // 保养建议
  async getMaintainSuggest() {
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await maintainSuggestApi()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // 轮播列表
        this.setData({
          maintain_type: data
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: `获取保养建议失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getMaintainSuggest', err)
    }
  },

  // 小贴士
  async getMaintainTips() {
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await tipsListApi()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // 轮播列表
        this.setData({
          tipList: data
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: `获取保养小贴士列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getMaintainTips', err)
    }
  },

  // 小提示轮播禁止滑动
  swiperTip(e) {
    return false
  },

  // 品牌专区
  async getBrandFun() {
    let self = this
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await getBrands()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        self.setData({
          brandList: data
        })
      } else {
        wx.hideLoading()
        showMessage({
          title: `获取品牌专区列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getBrandFun', err)
    }
    wx.hideLoading()
  },

  // 去品牌专区列表
  goBrandList () {
    wx.navigateTo({
      url: '/pages/maintenance/brandAreaList/brandAreaList'
    })
  },

  /**
   * 去品牌馆详情
   * @param event对象
   */
  goBrandDetail (e) {
    wx.navigateTo({
      url: '/pages/maintenance/maintenance/maintenance?id='+e.currentTarget.dataset.id
    })
  },

  /**
   * 轮播切换
   * @current  轮播图切换的时候对应下标
   */
  swiperChange: function (e) {
    if (e.detail.source === 'autoplay'){
      this.setData({
        currentSwiper: e.detail.current
      })
    } else if (e.detail.source === 'touch'){
      this.setData({
        currentSwiper: e.detail.current
      })
    }
  },


  /**
   * 轮播跳转/弹框
   * e 当前项
   */
  async goSwiper(e) {
    let item = e.currentTarget.dataset.item
    let type = e.currentTarget.dataset.type
    if (globalData.is_registered === 0 && (type === 7 || type === 13)) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    if (item && item.url) {
      if (item.action.from_type && item.action.from_id && item.value_content && item.value_type) {
        let params = {
          scene: {}
        }
        params.from_id = item.action.from_id
        params.from_type = item.action.from_type
        params.scene.value_content = {...item.value_content}
        params.scene.value_type = item.value_type
        params.is_cache = true
        let accessId = await getAccessId(params)
        if (accessId) {
          wx.navigateTo({
            url: item.url + '&access_id=' + accessId,
          })
        } else {
          wx.navigateTo({
            url: item.url,
          })
        }
      } else {
        wx.navigateTo({
          url: item.url,
        })
      }
    }
  },

  /**
   * 金刚区
   * @current  切换的时候对应下标
   */
  swiperIconChange: function (e) {
    if (e.detail.source === 'autoplay'){
      this.setData({
        currentIconSwiper: e.detail.current
      })
    } else if (e.detail.source === 'touch'){
      this.setData({
        currentIconSwiper: e.detail.current
      })
    }
  },

  /**
   * 点击icon跳转/弹框
   * @category_type  2:服务 1:商品
   * @category_id   一级分类ID
   * @url 要跳转的路径
   */
  goNav(e) {
    let type_value = e.currentTarget.dataset.item.type_value
    let title = e.currentTarget.dataset.item.title
    let type = parseInt(e.currentTarget.dataset.item.type)
    let url  = this.formateTypeFun(type_value, type, title)

    // 未注册 智能保养不能进入
    // is_registered 0 未注册 1 注册、登录 2 未判断
		if (globalData.is_registered === 0 && (type === 7 || type === 13)) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    
    // 跳公共缺省页
    if (type == 12) {
      wx.navigateTo({
        url: `/pages/defaultPage/defaultPage?icon=nosearch&slogan=暂无内容&title=${title}`
      })
    }

    console.log('>>>>>', type)

    // 普通跳转相应页面
    if (type != 12) {
      wx.navigateTo({
        url: url
      })
    }
  },

  /** type 跳转类型* */
  formateTypeFun(value_content, type, title) {
    let url = ''
    /**
     *  1:商品, 2:服务, 3:商品分类, 4：服务分类项, 5：平台内容, 6：品牌馆,
     *  7：评论, 8：抽奖,  9：商品分类列表, 10：服务分类列表, 11：门店内容,12：敬请期待 ,13智能保养, 14不跳转, 15跳注册, 16 养护卡
     * */
    switch(parseInt(type)){
      case 1:
        // url = '/pages/mall/goodsDetail/goodsDetail?spu_id='+value_content.id+'&sku_id='+value_content.sku_id  // 3.8.10跳转取消Sku
        url = '/pages/mall/goodsDetail/goodsDetail?spu_id='+value_content.id
        break;
      case 2:
        url = '/pages/mall/serviceDetail/serviceDetail?spu_id='+value_content.id
        break;
      case 3:
        url = '/pages/mall/categories/categories?category_id='+value_content.id+'&type=1'
        break;
      case 4:
        url = '/pages/mall/categories/categories?category_id='+value_content.id+'&type=2'
        break;
      case 5:
        url = '/pages/article/article?id='+value_content.id+'&content_type=1'
        break;
      case 6:
        url = '/pages/maintenance/maintenance/maintenance?id='+value_content.id+'&title='+(title?title:'')
        break;
      case 7:
        url = '/pages/perevaluate/storeEvaluate/storeEvaluate'
        break;
      case 8:
        url = '/pages/lottery/lucky/lucky?activity_id=' + value_content.id
        break;
      case 9:
        url = `/pages/mall/categorySearchList/categorySearchList?category_id=${value_content.category_id}&search_bar=0`
        // tabbar页面跳转不能路由携带参数，智能存储在全局变量中
        // let first_obj = {
        //   parent_id: value_content.parent_id ? value_content.parent_id : '',
        //   category_id: value_content.category_id
        // }
        // globalData.CATEGORY = first_obj
        break;
      case 10:
        url = '/pages/mall/categorySearchList/categorySearchList?parent_id='+(value_content.parent_id?value_content.parent_id:'')+'&category_id='+value_content.category_id
        // tabbar页面跳转不能路由携带参数，智能存储在全局变量中
        // let secend_obj = {
        //   parent_id: value_content.parent_id ? value_content.parent_id : '',
        //   category_id: value_content.category_id
        // }
        // globalData.CATEGORY = secend_obj
        break;
      case 11:
        url = '/pages/article/article?id='+value_content.id+'&content_type=2'
        break;
      case 12:
        url = false
        break;
      case 13:
        url = '/pages/intelligent/intelligent/intelligent'
        break;
      case 14:
        url = ''
        break;
      case 15:
        url = '/pages/register/registerPhone/registerPhone'
        break;
      case 16:
        url = '/pages/card/purchaseDetails/purchaseDetails?card_id='+value_content.id
        break;
    }
    return url
  },

  // 获取优惠券列表
  async getCouponList() {
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await getCouponsLists({
        page: 1,
        per_page: 3
      })
      if (statusCode === 200 && code === 0) {
        data.forEach(v => {
          v.discount_amount = v.discount_amount/100
        });
        this.setData({
          coupon_list: data,
        })
      } else {
        showMessage({
          title: '获取优惠券列表失败',
          content: message,
        })
      }
    } catch (err) {
      console.error('首页-getCouponList', err)
    }
  },

  goUse(event){
		const coupon = event.target.dataset.item
		if (coupon.coupon_use_type == 2) {
			wx.navigateTo({ url: `/pages/mall/categories/categories?category_id=0&type=2` })
		} else {
			wx.navigateTo({ url: '/pages/applicable/applicable?ccId=' + coupon.cc_id + '&type=' + coupon.coupon_use_type })
		}
  },
  // 领取优惠券
  async getCouponOperation(event) {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }

    let _this = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      coupon_id: event.target.dataset.id,
      obtain_type: 4
    }
    // 存在技师id
    if (_this.data.scene) {
      params.relation_id = parseInt(_this.data.scene)
    }
    // 当前时间 减去 获取access_id的时间 是否超过五分钟
    if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
      params.access_id =  wx.getStorageSync('access_id').access_id
    }
    try {
      const {
        statusCode,
        code,
        message,
        data
      } = await getCoupon(params)
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        wx.showToast({
          title: '领取成功',
          icon: 'none',
          duration:1000,
        })   
        let new_list = [...this.data.coupon_list]
        new_list = new_list.map(item=>{          
          if(item.coupon_id===params.coupon_id){
            item.receive_status=3
            item.cc_id=data[0].cc_id
          }
          return item
        })
        this.setData({
          coupon_list:new_list
        }) 

      } else {
        wx.hideLoading()
        showMessage({
          title: '领取优惠券失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getCouponOperation', err)
    }
  },

  // 跳转领券中心列表
  async goVoucher(e) {
    wx.navigateTo({
      url: '/pages/coupon/voucher/voucher'
    })
  },

  // 获取养护卡购卡中心列表
  async getCardList() {
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
      } = await getCardCenterListApi({
        page: 1,
        per_page: 1,
      })
      if (statusCode === 200) {
        if (code === 0) {
          data.forEach(element => {
            element.price = (element.price / 100).toFixed(2)
            element.origin_price = (element.origin_price / 100).toFixed(2)
          })
          this.setData({
            card_list: data,
          })
          wx.hideLoading()
        }
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取养护卡列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getCardList', err)
    }
  },

  /**
   * 跳转养护卡列表
   * @param {*} e 
   */
  async goCardList() {
    wx.navigateTo({
      url: '../card/cardCenter/cardCenter'
    })
  },

  // 获取拼团列表
  async getGroupList() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await groupGoodsSkuList({
        page: 1,
        size: 2
      })
      if (statusCode === 200 && code === 0) {
        data.forEach(function(e){
          e.goods_price = (e.goods_price / 100).toFixed(2)
          e.group_price = (e.group_price / 100).toFixed(2)
        })
        this.setData({
          groupList: data
        })
      } else {
        showMessage({
          title: '获取拼团列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('首页-getGroupList', err)
    }
  },

  // 获取秒杀列表
  async getSpikeList() {
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await getSpikeSkuListApi({
        page: 1,
        size: 2
      })
      if (statusCode === 200 && code === 0) {
        data.forEach(function(e){
          e.sku_price = (e.sku_price / 100).toFixed(2)
          e.seckill_sku_price = (e.seckill_sku_price / 100).toFixed(2)
        })
        this.setData({
          spike_list: data
        })
        // 计算秒杀倒计时
        this.getTimeLimit()
      } else {
        showMessage({
          title: '获取秒杀列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('首页-getSpikeList', err)
    }
  },

  /*****
   * 倒计时
   * @is_open  是否开始-结束
   */
  getTimeLimit () {
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('index') === -1){
      return false
    }
    let _this = this
    let spike_list = _this.data.spike_list
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
              _this.setData({
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
        _this.setData({
          spike_list: spike_list
        })
      })
    } else {
      clearTimeout(this.data.timer)
    }
    _this.data.timer = setTimeout(function () {
      _this.getTimeLimit()
    },1000)
  },

  // 去秒杀列表
  async goSpilkeList(e) {
    wx.navigateTo({
      url: '../spilkeGroup/timeLimitGoodsList/timeLimitGoodsList'
    })
  },

  // 去拼团列表
  async goGroupList(e) {
    wx.navigateTo({
      url: '../spilkeGroup/groupCategoryList/groupCategoryList'
    })
  },

  /**
   * 去秒杀商品或服务详情
   * @param e 对应项数据
   */
  goLimitDetail(e) {
    console.log(e)
    let item = e.currentTarget.dataset.item
    let seckill_id = item.seckill_id
    let spu_id = item.spu_id
    let sku_id = item.sku_id
    if(parseInt(item.type) === 1) {
      wx.navigateTo({
        url: `../spilkeGroup/timeLimitGoodsDetail/timeLimitGoodsDetail?seckill_id=${seckill_id}&sku_id=${sku_id}&spu_id=${spu_id}`
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

  /****
   * 跳转拼团详情页面
   * @param event对象
   */
  goDetail(e) {
    let item = e.currentTarget.dataset.item
    if (parseInt(item.type) === 1){
      // 拼团商品详情
      wx.navigateTo({
        url: `../spilkeGroup/groupGoodsDetail/groupGoodsDetail?spu_id=${item.spu_id}&group_product_id=${item.group_product_id}&sku_id=${item.sku_id}`
      })
    } else if (parseInt(item.type) === 2){
      // 服务详情
      wx.navigateTo({
        url: `../spilkeGroup/groupServiceDetail/groupServiceDetail?spu_id=${item.spu_id}&group_product_id=${item.group_product_id}`
      })
    } else if (parseInt(item.type) === 3 || parseInt(item.type) === 4 || parseInt(item.type) === 5){
      // 服务详情
      wx.navigateTo({
        url: `../spilkeGroup/groupPurchaseDetail/groupPurchaseDetail?card_id=${item.spu_id}&group_product_id=${item.group_product_id}`
      })
    }
  },

  // 推荐公众号组件加载成功时触发
  connectSuccess(detail) {
    console.log('首页-connectSuccess:', detail)
  },
  // 推荐公众号组件加载失败时触发,此处console别删，利于以后线上用体验码排查问题
  connectError(detail) {
    console.log('首页-connectError:', detail)
  },
  // 监听页面滚动
  onPageScroll:function(res){
    // 在页面滚动时，控制关注公众号组件显隐
    if (res.scrollTop < 5){
      if(!this.data.showOfficial){
        this.setData({ showOfficial: true })
      }
    }else{
      if(this.data.showOfficial){
        this.setData({ showOfficial: false })
      }
    }
  },
  // 关闭引导“添加到我的小程序”
  closeGuideCover() {
    this.setData({
      guide_cover: false
    })
    // 存储已展示过我的小程序
    wx.setStorageSync('I_GUIDE_COVER', true)
    globalData.is_show_index_tip = false
  },

  // 获取开机大屏配置
  async getOpenConfig() {
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message
      } = await getOpenConfigApi()
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        if (data && data.image_url.length > 0) {
          this.setData({
            open_img: data.image_url,
            open_url: this.formateTypeFun(data.jump_value, data.jump_type, data.jump_name),
            open_type: data.jump_type,
            isShowOpen: true
          })
        } else {
          // 没有开机大屏
          this.openCancel()
        }
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取开屏配置失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('首页-getOpenConfig', err)
    }
  },

  // 开机大屏隐藏
  openCancel() {
    //关闭开机大屏
    this.setData({
      isShowOpen: false
    })
    globalData.is_show_open = false

    //  随后 =》判断是否有推送的优惠卷
    if (this.data.recommend_coupon && this.data.recommend_coupon.length) {
      this.setData({
        isShowCoupon: true
      })
      return
    }

    //  随后 =》判断是否需要弹出 添加到我的小程序
    if (globalData.scene != 1089) {
      // 判断是否展示过引导浮层
      let guide_cover = wx.getStorageSync('I_GUIDE_COVER')
      if (!guide_cover){
        this.setData({
          guide_cover: true
        })
      }
    }
  },

  // 页面分享设置
  onShareAppMessage() {
    let url = 'pages/index/index?share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    // 分享带上用户id,用于cdp分享参数上报
    if (globalData.current_customer_id) {
      url = url + '&share_from_id=' + globalData.current_customer_id
		}
		// 分享带上门店名称,用于cdp参数上报
		if (globalData.ep_store_name) {
			url = url + '&current_store_name=' + globalData.ep_store_name
		}	    
    return {
      title: globalData.ep_store_name?globalData.ep_store_name:'精选',
      path: url,
    };
  },

  // 获取推送的优惠券
	async fetchCouponList () {
    let _this = this
		try {
      const {statusCode, data, code, message} = await getCouponStateApi({
				from_type: 6
			})
      if (statusCode === 200 && code === 0) {
        this.setData({
          recommend_coupon: data,
        })
			} else {
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      console.error('首页-fetchCouponList', err)
    }
  },
  
  // 关闭推送优惠券弹框
	couponCancel() {
		this.setData({
      isShowCoupon: false
    })
    
    // 随后 =》判断是否需要弹出 添加到我的小程序
    if (globalData.scene != 1089) {
      // 判断是否展示过引导浮层
      let guide_cover = wx.getStorageSync('I_GUIDE_COVER')
      if (!guide_cover){
        this.setData({
          guide_cover: true
        })
      }
    }
	},

  // 记录用户访问记录
  // async remindUserHistory() {
  //   // form_type 来源页面类型：1首页，2领券中心，3门店详情，4门店评价
  //   let params = {
  //     relation_id: this.data.scene,
  //     from_type: 1
  //   }
  //   await VisitorCreate(params)
  //   wx.hideLoading()
  // },

  /**
   * 获取门店id并存储当前门店id,请求接口公共方法传入该参数
   * @param id
   * @returns {Promise<void>}
   */
  async getStoreId (id) {
    try {
      const {statusCode, data, code,} = await getStoreByRelation({
        relation_id: id,
      })
      if (statusCode === 200 && code === 0) {
        wx.setStorageSync('current_store_id', data.store_id) // 存储当前门店id,请求接口公共方法传入该参数
        // 继续调用页面其他接口
        this.setData({
          need_get_id: false
        })
        this.onShow()
      } else {
        showMessage({
          title: '获取门店信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('首页-getStoreId', err)
    }
  },

  // 页面卸载时触发的生命周期
  onHide() {
    clearTimeout(this.data.timer)
  },
});