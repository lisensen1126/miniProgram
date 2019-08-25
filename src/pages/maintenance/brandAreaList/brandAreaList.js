import {allBrands} from '@/libs/modules/index'

// 获取全局应用程序实例对象
const {globalData} = getApp()

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    list: [], // 列表
    page: 1, // 分页：当前页
    per_page: 10, // 分页：每页数据
    pageShow: false, // 页面是否可渲染
    isAllLoaded: false, // 接口是否已经加载完
    topbarHeight: globalData.topbarHeight, // 接口是否已经加载完
  },

  // 品牌列表
  async getBrandList () {
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      page: this.data.page,
      per_page: this.data.per_page,
    }
    try {
      const {statusCode, data, code, message, meta} = await allBrands(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        const lastData = this.data.list
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
          title: `获取品牌列表失败`,
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('品牌专区-getBrandList', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
      pageShow: true
    })
  },

  // 去品牌馆详情
  goBrandDetail (e) {
    wx.navigateTo({
      url: '/pages/maintenance/maintenance/maintenance?id='+e.currentTarget.dataset.id
    })
  },

  // 上拉加载
  onReachBottom: function() {
    // 品牌列表请求完成
    if (this.data.isAllLoaded) {
      return false
    }
    this.getBrandList()
  },
  // 生命周期函数--监听页面加载
  onLoad () {
  },
  async onShow () {
    // 初始化字段
    this.data.per_page = 10 // 分页：每页数据
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间，上报用
      list: [], // 列表
      page: 1, // 分页：当前页
      // per_page: 10, // 分页：每页数据
      pageShow: false, // 页面是否可渲染
      isAllLoaded: false, // 接口是否已经加载完
    })
    // 品牌列表
    this.getBrandList()
  },
});
