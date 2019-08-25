import {shopList, brandList} from '@/libs/modules/shopMall'
import {userCarDetailApi} from '@/libs/modules/user'
const {globalData, showMessage, isRegistered } = getApp()

Page({
  data: {
    has_vehicle: 0, // 用户是否有车
    has_complete: 0, // 用户车是否完整
    has_show_tip: 1, // 是否展示车 
    list: [], // 列表数据
    searData: {
      sort_volume: 0, // 销量排序
      sort_price: 0, // 价格排序
      recommend: 1,  // 推荐
    },
    sort_up: true, // 价格、评分是否升序排列
    category_ids: '', // 分类id集合
    brand_ids: '', // 品牌id集合
    brandCover: false, // 品牌浮层开关
    chooseNav: 1, // 默认按照推荐排序
    isSear: false, // 是否在搜索
    searchValue: '', // 搜索的关键字
    isLoading: false, // 接口是否请求中
    isAllLoaded: false, // 是否列表(商品不推荐、服务)数据全部请求完成
    brandList: [], // 品牌列表
    page: 1, // 服务（不推荐）商品列表 page
    per_page: 10, // 服务（不推荐）商品列表 per_page
    pageShow: false, // 是否显示页面
    is_option: false, // 判断是否以获取参数
    page_title: '分类列表', // 页面标题
    top_height: 0, // 搜索框位移高度
    top_nav_height: 0, // tap栏位移高度
    data_list_height: 0, // 内容区域 padding-top 高度
    recommend_list: [ // 推荐项
      {
        pic: 'https://oss1.chedianai.com/images/assets/m-icon-01.png',
        name: 'HX7'
      },
      {
        pic: 'https://oss1.chedianai.com/images/assets/m-icon-02.png',
        name: 'HX8'
      },
      {
        pic: 'https://oss1.chedianai.com/images/assets/m-icon-03.png',
        name: '极净超凡'
      },
      {
        pic: 'https://oss1.chedianai.com/images/assets/m-icon-04.png',
        name: '深度换油'
      },
      {
        pic: 'https://oss1.chedianai.com/images/assets/m-icon-05.png',
        name: '标准换油'
      },
      {
        pic: 'https://oss1.chedianai.com/images/assets/m-icon-06.png',
        name: '洗车'
      },
    ],
  },

  async onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
      top_nav_height: globalData.top_nav_height,
      data_list_height: globalData.data_list_height
    })
    wx.hideShareMenu()
    this.getGoodsList()      // 商品、服务列表、
    this.getBrandList()      // 品牌列表
  },

  async onShow() { 
    // 在还没有判断登录状态下的情况
    if (globalData.is_registered == 2) {
      await isRegistered()
    }
    // 在登录状态下获取用户车辆信息
    if (globalData.is_registered == 1) {
      this.getCarDetail()
    }
  },

  // 去车辆列表或者添加车辆
  goVehicle() {
    // 如果没有车辆 去添加
    if (this.data.has_vehicle == 0) {
      // is_first 控制是否第一辆 添加页面默认展示
      wx.navigateTo({
        url: '/pages/vehicle/vehicleAdd/vehicleAdd?is_first=1',
      })
    } else {
      // 如果有车且车辆没有完善去车辆编辑
      if(this.data.has_complete === 0) {
        wx.setStorageSync('car_info', this.data.default_vehicle)
        wx.navigateTo({
          url: '/pages/vehicle/VehicleEdit/VehicleEdit',
        })
      }
    }
  },

  // 获取用户车辆详情
  async getCarDetail () {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      let {statusCode, data, code, message} = await userCarDetailApi()
      if (statusCode === 200 && parseInt(code) === 0) {
        this.setData({
          default_vehicle: data.default_vehicle,
          has_complete: data.has_complete,
          has_vehicle: data.has_vehicle,
          has_show_tip: data.has_complete === 1 && data.has_vehicle === 1 ? 0 : 1
        })
      } else {
        showMessage({
          title: '获取用户车辆信息失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('获取用户车辆信息失败', err)
    }
  },

  // 点击搜索按钮
  goSear(e) {
    let name = e.currentTarget.dataset.name
    let url = `/pages/mall/categorySearchList/categorySearchList`
    if (name) {
      url += `?name=${name}`
      // 更新历史记录
      this.changeHistory(name)
    }
    wx.navigateTo({
      url
    })
  },

  // 更新历史记录
  changeHistory(name) {
    // 搜索的历史记录
    let searchHistory = []
    // 获取缓存中的历史记录
    searchHistory = wx.getStorageSync('searchHistory').length>0 ? wx.getStorageSync('searchHistory') : []
    // 获取前10条
    if (searchHistory.length > 10) {
      searchHistory = searchHistory.splice(0,10)
    }
    // 关键字有值下更新搜索历史缓存数据
    let str = name.replace(/^\s*|\s*$/g,"");
    if (str.length>0) {
      // 历史记录去重
      if (searchHistory.indexOf(str) == -1){
        searchHistory.unshift(str)
      } else {
        // 重复的字段搜索默认展示在第一个
        let strIndex = searchHistory.indexOf(str)
        searchHistory.splice(strIndex,1)
        searchHistory.unshift(str)
      }
      // 更新历史记录
      wx.setStorageSync('searchHistory', searchHistory)
    }
  },

  // tab切换含有，价格，销量，推荐
  async changeClassify(e) {
    let curr_tab = e.currentTarget.dataset.nav
    // 已选中的tab不能再点击，排除价格排序
    if (this.data.chooseNav == curr_tab && curr_tab != 4) {
      return false
    }

    // 价格支持升序降序
    if (curr_tab == 4) {
      this.setData({
        sort_up: !this.data.sort_up
      })
    } else {
      this.setData({
        sort_up: true
      }) 
    }
    
    // 排序参数
    let searData = {}
    switch(parseInt(curr_tab)) {
      // 推荐1
      case 1:
        searData ={
          recommend: 1,
          sort_volume: 0,
          sort_price: 0,
        }
        break;
      //  品牌2
      case 2:
        searData ={
          recommend: 0,
          sort_volume: 0,
          sort_price: 0,
        }
        break;
      //  销量3
      case 3:
        searData ={
          recommend: 0,
          sort_volume: 1,
          sort_price: 0,
        }
        break;
      //  价格4
      default:  
        searData ={
          recommend: 0,
          sort_volume: 0,
          sort_price: this.data.sort_up ? 2 : 1,
        }
    }

    // 更新当前tab项
    this.setData({
      chooseNav: parseInt(curr_tab),
      searData: searData
    })

    // 非品牌以为的数据、关闭品牌浮层、初始化列表数据和请求参数、获取列表
    if (this.data.chooseNav != 2) {
      this.setData({
        brandCover: false,
        list: [],
        isAllLoaded: false,
        page: 1,
        recommend_page: 1,
      })
      this.getGoodsList()
    }
  },

  // 品牌筛选
  async getBrandList () {
    let self = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {}
    if (this.data.brand_ids) {
      params.brand_id = this.data.brand_ids
    } else if (this.data.parent_id) {
      params.parent_id = this.data.parent_id
    }  else if (this.data.category_ids) {
      params.category_id = this.data.category_ids
    }  else if (this.data.searchValue) {
      params.product_name = this.data.searchValue
    }
    params.is_page = 2
    try {
      let {statusCode, data, code, message} = await brandList(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        data.forEach(function (item) {
          item.is_check = 1
          if (parseInt(item.brand_id) === parseInt(self.data.brand_ids)) {
            item.is_check = 2
          }
        })
        this.setData({
          brandList: data,
        })
      } else {
        showMessage({
          title: '获取品牌列表失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('分类列表-getBrandList', err)
    }
  },

  // 品牌浮层开关
  chooseBrand (e) {
    this.setData({
      brandCover: !this.data.brandCover,
    })
    // 更新tab数值
    this.changeClassify(e)
  },

  // 选择品牌
  checkBrand(e) {
    let currentIndex = e.currentTarget.dataset.index
    const list = this.data.brandList
    for (let i in list) {
      if (parseInt(i) == parseInt(currentIndex)) {
        list[i].is_check = list[i].is_check === 2 ? 1 : 2
      }
    }
    this.setData({
      brandList: list,
    })
  },

  // 重置
  async reset() {
    const list = this.data.brandList
    for (let i in list) {
      list[i].is_check = 1
    }
    this.setData({
      brandList: list,
      brandCover: false,
      brand_ids: '',
      list: [],
      isRecommendAllLoaded: false,
      isAllLoaded: false,
      page: 1,
      recommend_page: 1,
    })
    this.getGoodsList()
  },

  // 确定
  async sure() {
    let _this = this
    let brand_ids = []
    const list = this.data.brandList
    for (let i in list) {
      if(parseInt(list[i].is_check) === 2){
        brand_ids.push(list[i].brand_id)
      }
    }
    // 关闭品牌浮层、整合品牌ID、初始化列表数据
    this.setData({
      brandCover: false,
      brand_ids: brand_ids.join(','),
      list: [],
      isRecommendAllLoaded: false,
      isAllLoaded: false,
      page: 1,
      recommend_page: 1,
    })
    this.getGoodsList()
  },

  // 跳转详情
  goDetail(e) {
    let type = parseInt(e.currentTarget.dataset.item.type)  
    if (type === 1) {
      wx.navigateTo({
        url: '/pages/mall/goodsDetail/goodsDetail?spu_id='+e.currentTarget.dataset.item.spu_id+'&sku_id='+e.currentTarget.dataset.item.sku_id
      })
    }
    if (type === 2) {
      wx.navigateTo({
        url: '/pages/mall/serviceDetail/serviceDetail?spu_id='+e.currentTarget.dataset.item.spu_id
      })
    }
  },

  // 商品服务列表
  async getGoodsList () {
    if (this.data.isLoading){
      return false
    }
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      category_ids: this.data.category_ids,
      parent_id: this.data.parent_id,
      brand_ids: this.data.brand_ids,
      goods_name: this.data.searchValue,
      recommend: this.data.searData.recommend?this.data.searData.recommend:0,
      sort_volume: this.data.searData.sort_volume?this.data.searData.sort_volume:0,
      sort_price: this.data.searData.sort_price?this.data.searData.sort_price:0,
      page: this.data.page,
      per_page: this.data.per_page,
    }
    try {
      const {statusCode, data, code, message, meta} = await shopList(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        const lastData = this.data.list
        data.forEach(function (item) {
          item.is_check = 1
          item.goods_price = (item.goods_price/100).toFixed(2)
        })
        lastData.splice(lastData.length, 0, ...data)
        this.setData({
          list: lastData,
          isLoading: false,
          page: this.data.page+1,
          isAllLoaded: parseInt(meta.current_page) >= parseInt(meta.last_page),
          meta,
        })
      } else {
        showMessage({
          title: `获取分类列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('分类列表-getGoodsList', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },

  // 上拉加载
  onReachBottom: function() {
    // 搜索浮层不支持上拉加载
    if (this.data.isSear){
      return false
    }
    // 推荐列表、商品（不推荐）、服务列表都请求完成 则不再触发上拉加载更多操作
    if (this.data.isAllLoaded) {
      return false
    }
    this.getGoodsList()
  },
  
  // 跳转分类列表
  gocategories () {
    wx.navigateTo({
      url: '/pages/mall/categories/categories'
    })
  }
});
