import {
  shopList,
  shopRecommendList,
  brandList
} from '@/libs/modules/shopMall'

// 获取全局应用程序实例对象
const {
  globalData,
  showMessage
} = getApp()

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    list: [], // 列表数据
    historyList: [], // 搜索历史
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
    isSear: true, // 是否在搜索
    searchValue: '', // 搜索的关键字
    isLoading: false, // 接口是否请求中
    isAllLoaded: false, // 是否列表(商品不推荐、服务)数据全部请求完成
    isRecommendAllLoaded: false, // 是否商品推荐列表数据全部请求完成
    brandList: [], // 品牌列表
    recommend_page: 1, // 推荐商品列表 page
    recommend_per_page: 10, // 推荐商品列表 per_page
    recommend_sku_ids: [], // 推荐商品的sku_id集合
    page: 1, // 服务（不推荐）商品列表 page
    per_page: 10, // 服务（不推荐）商品列表 per_page
    option: {},
    pageShow: false, // 是否显示页面
    is_option: false, // 判断是否以获取参数
    page_title: '', // 页面标题
    top_height: 0, // 搜索框位移高度
    top_nav_height: 0, // tap栏位移高度
    data_list_height: 0, // 内容区域 padding-top 高度
    is_search_goods_name: true, // 是否搜索商品/服务名称
  },
  // 生命周期函数--监听页面加载
  async onLoad(options) {
    globalData.goods_option = options
    let option = globalData.goods_option
    wx.hideShareMenu()          // 关闭分享
    this.data.brand_ids = option.brand_id ? option.brand_id : '' // 品牌ID
    this.setData({
      top_height: globalData.topbarHeight,
      top_nav_height: globalData.top_nav_height,
      data_list_height: globalData.data_list_height,
      // 品牌ID
      // brand_ids: option.brand_id ? option.brand_id : '',
      // 商品、服务的二级分类ID集合
      category_ids: option.category_id ? option.category_id : (option.soncategoryids ? option.soncategoryids : ''),
      // 商品、服务的一级分类ID
      parent_id: option.parent_id ? option.parent_id : '',
      isSear: option.search_bar == 1,
      option: option,
      // is_option: true,
      searchValue: option.name ? option.name : '',
      // is_search_goods_name: option.is_search ? Boolean(option.is_search * 1) : true,
    })
    this.data.is_search_goods_name = option.is_search ? Boolean(option.is_search * 1) : true
    this.data.is_option = true
    if (!this.data.searchValue && !this.data.category_ids) {
      this.showSearchBar()
    }

    if (this.data.isSear) {
      this.setData({
        page_title: '搜索'
      })
    } else {
      this.setData({
        page_title: '搜索列表'
      })
    }
    // 机油、滤清器； 用户有车辆；用户已注册；
    if ((parseInt(this.data.category_ids) === 201 || parseInt(this.data.category_ids) === 220) && globalData.default_vehicle && parseInt(globalData.is_registered) === 1) {
      await this.getGoodsRecommendList()
      if (this.data.isRecommendAllLoaded) {
        this.getGoodsList()
      }
    } else {
      this.getGoodsList()
      // 非机油和滤清器的分类时，推荐列表的isRecommendAllLoaded = true
      // this.setData({
      //   isRecommendAllLoaded: true,
      // })
      this.data.isRecommendAllLoaded = true
    }

    // 商品、服务列表、品牌列表
    this.getBrandList()
  },

  /****************搜索框******/
  // 搜索框 获取焦点  展示历史记录、搜索按钮
  showSearchBar(e) {
    let flag = e && e.currentTarget.dataset.type === 'clear'
    if (flag) this.cleanSear()
    // 搜索的历史记录
    let searchHistory = []
    // 获取缓存中的历史记录
    searchHistory = wx.getStorageSync('searchHistory').length > 0 ? wx.getStorageSync('searchHistory') : []
    // 获取前20条
    if (searchHistory.length > 10) {
      searchHistory = searchHistory.splice(0, 10)
    }
    this.setData({
      isSear: true,
      brandCover: false,
      historyList: searchHistory,
      page_title: '搜索',
    })
  },
  // 更新关键字
  changeSearchValue(e) {
    this.setData({
      searchValue: e.detail.value.slice(0, 20),
    })
  },
  // 清除关键字
  cleanSear() {
    this.setData({
      searchValue: '',
      // page_title: '搜索'
    })
  },
  // 点击搜索按钮
  goSear(e) {
    let flag = e && e.currentTarget.dataset.type === 'back'
    let itemValue = e && e.currentTarget.dataset.item

    if ((!this.data.searchValue || flag) && !itemValue) {
      wx.navigateBack()
      return false
    }

    // 隐藏搜索历史浮层
    this.data.category_ids = ''
    this.data.brand_ids = ''
    this.setData({
      // brand_ids: '',
      // category_ids: '',
      brandCover: false,
      isSear: false,
      page: 1,
      // recommend_page: 1,
      list: [],
      page_title: '搜索列表',
      is_search_goods_name: true
    })
    this.data.is_search_goods_name = true
    this.data.recommend_page = 1
    if (itemValue) {
      this.setData({
        searchValue: itemValue,
      })
    }
    // 判断当前是否取消搜索操作
    if (this.data.searchValue.length <= 0) {
      // this.setData({
      //   brand_ids: this.data.option.brand_id ? this.data.option.brand_id : '',
      //   category_ids: this.data.option.category_id ? this.data.option.category_id : '',
      // })
      this.data.brand_ids = this.data.option.brand_id ? this.data.option.brand_id : ''
      this.data.category_ids = this.data.option.category_id ? this.data.option.category_id : ''
    }
    // 更新历史记录
    this.changeHistory()
    // 请求列表数据
    this.getGoodsList()
    // 请求品牌列表
    this.getBrandList()
  },
  // 更新历史记录
  changeHistory() {
    // 搜索的历史记录
    let searchHistory = []
    // 获取缓存中的历史记录
    searchHistory = wx.getStorageSync('searchHistory').length > 0 ? wx.getStorageSync('searchHistory') : []
    // 获取前10条
    if (searchHistory.length > 10) {
      searchHistory = searchHistory.splice(0, 10)
    }
    // 关键字有值下更新搜索历史缓存数据
    let str = this.data.searchValue.replace(/^\s*|\s*$/g, "");
    console.log('str', str)
    if (str.length > 0) {
      // 历史记录去重
      if (searchHistory.indexOf(str) == -1) {
        searchHistory.unshift(str)
      } else {
        // 重复的字段搜索默认展示在第一个
        let strIndex = searchHistory.indexOf(str)
        searchHistory.splice(strIndex, 1)
        searchHistory.unshift(str)
      }
      // 更新历史记录
      wx.setStorageSync('searchHistory', searchHistory)
    }
    // 页面历史记录更新
    this.setData({
      historyList: searchHistory,
    })
  },

  /****************tap切换******/
  async changeClassify(e) {
    if (this.data.isLoading) {
      return
    }
    // 价格支持升序降序
    if (parseInt(e.currentTarget.dataset.nav) === 4) {
      this.setData({
        sort_up: !this.data.sort_up
      })
    } else {
      this.setData({
        sort_up: true
      })
      // 不可多次重复点击当前tab
      if (this.data.chooseNav === parseInt(e.currentTarget.dataset.nav)) {
        return false
      }
    }

    this.setData({
      chooseNav: parseInt(e.currentTarget.dataset.nav),
    })

    // 排序参数
    let searData = {}
    switch (this.data.chooseNav) {
      // 推荐
      case 1:
        searData = {
          recommend: 1,
          sort_volume: 0,
          sort_price: 0,
        }
        break;
        //  品牌
      case 2:
        searData = {
          recommend: 0,
          sort_volume: 0,
          sort_price: 0,
        }
        break;
        //  销量
      case 3:
        searData = {
          recommend: 0,
          sort_volume: 1,
          sort_price: 0,
        }
        break;
        //  价格
      case 4:
        searData = {
          recommend: 0,
          sort_volume: 0,
          sort_price: this.data.sort_up ? 2 : 1,
        }
        break;
    }
    // 更新当前tab项
    this.setData({
      searData: searData
    })
    // 非品牌以为的数据、关闭品牌浮层、初始化列表数据和请求参数、获取列表
    if (this.data.chooseNav !== 2) {
      this.data.isRecommendAllLoaded = false
      this.setData({
        brandCover: false,
        list: [],
        // isRecommendAllLoaded: false,
        isAllLoaded: false,
        page: 1,
        // recommend_page: 1,
      })
      this.data.recommend_page = 1
      // 机油、滤清器； 用户有车辆；用户已注册；
      if ((parseInt(this.data.category_ids) === 201 || parseInt(this.data.category_ids) === 220) && globalData.default_vehicle && parseInt(globalData.is_registered) === 1) {
        await this.getGoodsRecommendList()
        if (this.data.isRecommendAllLoaded) {
          this.getGoodsList()
        }
      } else {
        this.getGoodsList()
        // 非机油和滤清器的分类时，推荐列表的isRecommendAllLoaded = true
        // this.setData({
        //   isRecommendAllLoaded: true,
        // })
        this.data.isRecommendAllLoaded = true
      }
    }
  },

  /****************品牌筛选******/
  async getBrandList() {
    let self = this
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {}
    if (this.data.brand_ids) {
      params.brand_id = this.data.brand_ids
    } else if (this.data.parent_id) {
      params.parent_id = this.data.parent_id
    } else if (this.data.category_ids) {
      params.category_id = this.data.category_ids
    } else if (this.data.searchValue) {
      params.product_name = this.data.searchValue
    }
    params.is_page = 2
    try {
      let {
        statusCode,
        data,
        code,
        message
      } = await brandList(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        data.forEach(function (item) {
          item.is_check = 1
          if (parseInt(item.brand_id) === parseInt(self.data.brand_ids)) {
            item.is_check = 2
          }
        })
        this.setData({
          brandList: data,
          isLoading: false
        })
      } else {
        showMessage({
          title: '获取品牌列表失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      console.error('分类列表-getBrandList', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },
  // 品牌浮层开关
  chooseBrand(e) {
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
    let self = this
    const list = this.data.brandList
    for (let i in list) {
      list[i].is_check = 1
    }
    this.data.brand_ids = ''
    this.setData({
      brandList: list,
      brandCover: false,
      // brand_ids: '',
      list: [],
      // isRecommendAllLoaded: false,
      isAllLoaded: false,
      page: 1,
      // recommend_page: 1,
    })
    this.data.recommend_page = 1
    this.data.isRecommendAllLoaded = false
    // 机油、滤清器； 用户有车辆；用户已注册；
    if ((parseInt(this.data.category_ids) === 201 || parseInt(this.data.category_ids) === 220) && globalData.default_vehicle && parseInt(globalData.is_registered) === 1) {
      await this.getGoodsRecommendList()
      if (self.data.isRecommendAllLoaded) {
        self.getGoodsList()
      }
    } else {
      this.getGoodsList()
      // 非机油和滤清器的分类时，推荐列表的isRecommendAllLoaded = true
      // this.setData({
      //   isRecommendAllLoaded: true,
      // })
      this.data.isRecommendAllLoaded = true
    }
  },
  // 确定
  async sure() {
    let self = this
    let brand_ids = []
    const list = this.data.brandList
    for (let i in list) {
      if (parseInt(list[i].is_check) === 2) {
        brand_ids.push(list[i].brand_id)
      }
    }
    // 关闭品牌浮层、整合品牌ID、初始化列表数据
    this.data.brand_ids = brand_ids.join(',')
    this.setData({
      brandCover: false,
      // brand_ids: brand_ids.join(','),
      list: [],
      // isRecommendAllLoaded: false,
      isAllLoaded: false,
      page: 1,
      // recommend_page: 1,
    })
    this.data.recommend_page = 1
    this.data.isRecommendAllLoaded = false
    // 机油、滤清器； 用户有车辆；用户已注册；
    if ((parseInt(this.data.category_ids) === 201 || parseInt(this.data.category_ids) === 220) && globalData.default_vehicle && parseInt(globalData.is_registered) === 1) {
      await this.getGoodsRecommendList()
      if (self.data.isRecommendAllLoaded) {
        self.getGoodsList()
      }
    } else {
      this.getGoodsList()
      // 非机油和滤清器的分类时，推荐列表的isRecommendAllLoaded = true
      // this.setData({
      //   isRecommendAllLoaded: true,
      // })
      this.data.isRecommendAllLoaded = true
    }
  },

  /*****************跳转详情******/
  goDetail(e) {
    let type = parseInt(e.currentTarget.dataset.item.type)
    let is_recommend = parseInt(e.currentTarget.dataset.item.is_recommend)
    let customize = {
      spuId: e.currentTarget.dataset.item.spu_id ? parseInt(e.currentTarget.dataset.item.spu_id) : '',
      skuId: e.currentTarget.dataset.item.sku_id ? parseInt(e.currentTarget.dataset.item.sku_id) : '',
    }
    if (type === 1 || is_recommend === 1) {
      wx.navigateTo({
        url: '/pages/mall/goodsDetail/goodsDetail?spu_id=' + e.currentTarget.dataset.item.spu_id + '&sku_id=' + e.currentTarget.dataset.item.sku_id
      })
    }
    if (type === 2) {
      wx.navigateTo({
        url: '/pages/mall/serviceDetail/serviceDetail?spu_id=' + e.currentTarget.dataset.item.spu_id
      })
    }
  },

  /*****************商品（不推荐）、服务列表*/
  async getGoodsList() {
    if (this.data.isLoading) {
      return false
    }
    this.setData({
      isLoading: true,
      // page_title: '搜索列表'
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      category_ids: this.data.category_ids,
      parent_id: this.data.parent_id,
      brand_ids: this.data.brand_ids,
      goods_name: this.data.is_search_goods_name ? this.data.searchValue : '',
      recommend: this.data.searData.recommend ? this.data.searData.recommend : 0,
      sort_volume: this.data.searData.sort_volume ? this.data.searData.sort_volume : 0,
      sort_price: this.data.searData.sort_price ? this.data.searData.sort_price : 0,
      sku_ids: this.data.recommend_sku_ids.join(','),
      page: this.data.page,
      per_page: this.data.per_page,
    }
    try {
      const {
        statusCode,
        data,
        code,
        message,
        meta
      } = await shopList(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        const lastData = this.data.list
        data.forEach(function (item) {
          item.is_check = 1
        })
        data.forEach(function (listItem) {
          listItem.goods_price = (listItem.goods_price / 100).toFixed(2)
        })
        lastData.splice(lastData.length, 0, ...data)
        this.setData({
          list: lastData,
          isLoading: false,
          page: this.data.page + 1,
          isAllLoaded: parseInt(meta.current_page) >= parseInt(meta.last_page),
          meta,
        })
      } else {
        showMessage({
          title: `获取搜索列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('分类列表-getGoodsList', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
      pageShow: true
    })
  },

  /*****************商品推荐列表*/
  async getGoodsRecommendList() {
    if (this.data.isLoading) {
      return false
    }
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // type 1：机油(ID:201)、2：滤清器(ID:220)
    let params = {
      type: (parseInt(this.data.category_ids) === 201) ? 1 : 2,
      brand_ids: this.data.brand_ids,
      page: this.data.recommend_page,
      per_page: this.data.recommend_per_page,
    }
    try {
      const {
        statusCode,
        data,
        code,
        message,
        meta
      } = await shopRecommendList(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        const lastData = this.data.list
        if (data.list.length > 0) {
          data.list.forEach(function (item) {
            item.is_check = 1
            item.goods_price = (item.goods_price / 100).toFixed(2)
          })
        }

        lastData.splice(lastData.length, 0, ...data.list)
        this.setData({
          list: lastData,
          loading: false,
          // recommend_page: this.data.recommend_page + 1,
          isRecommendAllLoaded: (meta.total === 0 || parseInt(lastData.length) === parseInt(meta.total)),
          recommend_meta: meta,
          // recommend_sku_ids: data.sku_ids,
        })
        this.data.recommend_sku_ids = data.sku_ids
        this.data.recommend_page = this.data.recommend_page + 1
        // 推荐列表的所有数据未请求完成，不隐藏加载中浮层
        if (!this.data.isRecommendAllLoaded) {
          this.setData({
            pageShow: true,
          })
          wx.hideLoading()
        }
      } else {
        wx.hideLoading()
        showMessage({
          title: `获取推荐商品列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('分类列表-getGoodsRecommendList', err)
    }
    this.setData({
      isLoading: false,
    })
  },

  // 上拉加载
  onReachBottom: function () {
    // 搜索浮层不支持上拉加载
    if (this.data.isSear) {
      return false
    }
    // 推荐列表、商品（不推荐）、服务列表都请求完成 则不再触发上拉加载更多操作
    if (this.data.isRecommendAllLoaded && this.data.isAllLoaded) {
      return false
    }
    // 推荐列表全部数据未加载完
    if (!this.data.isRecommendAllLoaded) {
      this.getGoodsRecommendList()
    } else if (!this.data.isAllLoaded) {
      // 推荐列表加载完，商品（不推荐）、服务列表全部数据未加载完成
      this.getGoodsList()
    }
    this.setData({
      isLoading: true,
    })
  },
});