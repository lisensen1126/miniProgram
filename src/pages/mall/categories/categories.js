import {categoryList} from '@/libs/modules/shopMall'

// 获取全局应用程序实例对象
const { globalData, showMessage } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    topbarHeight: 64, // 自定义导航高度
    tabType: 2,
    categoryIndex: null,
    scrollPosition: '',
		categoryList:[],
    isBindTap: true,
    top_height: 0
  },
  // 生命周期函数
  async onLoad(option) {
    wx.hideShareMenu()

    let categoryList = wx.getStorageSync('CATEGORY_LIST') || []
    this.setData({
      topbarHeight: globalData.topbarHeight,
      categoryList: categoryList,
      tabType: parseInt(option.type) || 2
    })
    
    await this.getCategoryList()
    // 来自首页的跳转
    if (option.category_id) {
      this.setData({
        categoryIndex: parseInt(option.category_id),
        tabType: parseInt(option.type),
        categoryIndex: parseInt(option.category_id),
        scrollPosition: 'category' + parseInt(option.category_id)
      })
    } else {
      // 正常的状态
      this.setData({
        categoryIndex: this.data.categoryList[0].category_id
      })
    }
  },
  onShow() {
    let pages = getCurrentPages()
    console.log('pages', pages)
    console.log('pages-1', pages[pages.length - 1].route)
  },
	/**
   * 获取分类数据
   */
  async getCategoryList () {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      type: this.data.tabType,
    }
    try {
      let {statusCode, data, code, message} = await categoryList(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        this.setData({
          categoryList: data,
        })
        wx.setStorage({
          key: 'CATEGORY_LIST',
          data: data,
        })
      } else {
        showMessage({
          title: '获取服务分类列表失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      console.error('分类-getCategoryList', err)
    }
    wx.hideLoading()
  },

  /**
   * 展示搜索框
   * @param {*} e 
   */
  showSearchBar(e) {
    wx.navigateTo({
      url: '/pages/mall/categorySearchList/categorySearchList?search_bar=1'
    })
	},

	/**
   * tab切换
   * @param {*} e 
   */
  async changeTab(e) {
    let tabType = parseInt(e.currentTarget.dataset.tab)
    if (tabType !== this.data.tabType) {
      this.setData({
        tabType: tabType,
        categoryList: []
      })
      await this.getCategoryList()
      this.setData({
        categoryIndex: this.data.categoryList[0].category_id,
        scrollPosition: 'category' + this.data.categoryList[0].category_id,
      })
    }
	},

  /**
   * 展开对应二级分类、品牌
   * @param {*} e 
   */
  showSecondCategory(e) {
		this.setData({
      categoryIndex: e.currentTarget.dataset.parentid,
      scrollPosition: 'category' + e.currentTarget.dataset.parentid,
		})
	},

  /**
   * 随页面滚动、动态点亮一级分类
   * @param {*} e 
   */
  scorllFun(e) {
    this.setData({
      categoryIndex: e.currentTarget.dataset.parentid,
    })
  },

  /**
   * 跳转分类列表
   * @param {*} e 
   */
  goCategoryList(e) {
    let category_id = e.currentTarget.dataset.categoryid?e.currentTarget.dataset.categoryid:''
    let soncategoryids = e.currentTarget.dataset.soncategoryids?e.currentTarget.dataset.soncategoryids:''
    let brand_id = e.currentTarget.dataset.brandid?e.currentTarget.dataset.brandid:''
    let name = e.currentTarget.dataset.name?e.currentTarget.dataset.name:''
    if (soncategoryids) {
      soncategoryids = soncategoryids.join(',')
    }

    wx.navigateTo({
      url: '/pages/mall/categorySearchList/categorySearchList?brand_id='+brand_id+'&category_id='+category_id+'&soncategoryids='+soncategoryids+'&name='+name+'&is_search=0'
    })
  },
});
