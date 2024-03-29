import {fetchLiveUrl, fetchLiveStatus} from '@/libs/modules/videos'

const {showMessage, cdpReport, globalData } = getApp()

Page({
  data: {
    liveInfo: {},
    status: '',
    showHome: false,
    top_height: 0, // padding高度
  },
  async getStatus () {
    try {
      const {statusCode, data, code, message} = await fetchLiveStatus()
      if (statusCode === 200) {
        // reset lists
        this.setData({
          status: data.status,
        })
      } else {
        showMessage({
          title: '获取直播地址失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('施工直播-getStatus:', err)
    }
  },

  async getVideoRecord () {
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '获取直播地址中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await fetchLiveUrl()
      if (statusCode === 200) {
        // reset lists
        this.setData({
          liveInfo: data,
        })
      } else {
        showMessage({
          title: '获取直播地址失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('施工直播-getVideoRecord:', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },
  onLoad() {
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
  },
  onShow () {
    this.getStatus()
    this.getVideoRecord()
  },
})
