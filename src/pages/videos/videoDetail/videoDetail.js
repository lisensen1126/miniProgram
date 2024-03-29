import {fetchVideoRecordDetail} from '@/libs/modules/videos'

const {showMessage, cdpReport, globalData } = getApp()

Page({
  data: {
    liveInfo: {},
    showHome: false,
    top_height: 0, // padding高度
    show:true
  },
  
  videowaiting(e) {
    console.log('加载中',e)
    //this.bindplay()
  },
  videoerror(e) {
    console.log('错误',e)
  },
  
  bindplay (e) {
      let _this=this
      _this.setData({ show:false})
      setTimeout(function(){
        console.log(22222);
        _this.setData({ show: true })
      },10)
  },
  async getVideoRecord (id) {
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await fetchVideoRecordDetail({record_id: id})
      if (statusCode === 200) {
        // reset lists
        this.setData({
          liveInfo: data,
        })
      } else {
        showMessage({
          title: '获取录播详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('施工录像-getVideoRecord:', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },
  onLoad (option) {


   
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
    this.getVideoRecord(option.id)
    //this.bindplay();    
  },
  
  onHide () {
  },
})
