import {fetchVideoRecord} from '@/libs/modules/videos'

const {showMessage, cdpReport, globalData } = getApp()

Page({
  data: {
    page: 1,
    per_page: 10,
    isAllLoaded: false,
    isLoading: false,
    list: [],
    inInit: false,
    showHome: false,
    top_height: 0, // padding高度
  },
  async getVideoRecord () {
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message, meta} = await fetchVideoRecord({
        page: this.data.page,
        per_page: this.data.per_page,
      })
      if (statusCode === 200) {
        if (this.data.page === 1) {
          // reset lists
          this.setData({
            list: [],
          })
        }
        this.data.list.splice(this.data.list.length, 0, ...data)
        this.setData({
          list: this.data.list,
          page: meta.current_page + 1,
          per_page: meta.per_page,
          isAllLoaded: meta.current_page >= meta.last_page,
        })
      } else {
        showMessage({
          title: '获取录播列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('施工录像-getVideoRecord:', err)
    }
    this.setData({
      inInit: true,
      isLoading: false,
    })
    wx.hideLoading()
  },
  onPullDownRefresh () {
    // 上拉刷新
    this.setData({
      page: 1,
    })
    this.getVideoRecord()
  },
  onReachBottom () {
    if (this.data.isAllLoaded) {
      return
    }
    this.getVideoRecord()
  },
  onLoad (options) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    wx.hideShareMenu()
    this.setData({
      page: 1,
      isEmpty: options.isEmpty
    })
    if (this.data.isEmpty != 'off') {
      this.getVideoRecord()
    }else{
      this.setData({
        inInit: true
      })
    }
  },  
})
