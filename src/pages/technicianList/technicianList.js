import {getTechnician, recommendTechnician} from '@/libs/modules/store'

const {showMessage, globalData} = getApp()

Page({
  data: {
		topbarHeight: 64,
    list: [],
    isinitiated: false,
    isLoading: false,
    showHome: false,
		show_tech: false,
		tech_id: '',
  },
  onLoad () {
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
        topbarHeight: globalData.topbarHeight,
				showHome: true
			})
    } else {
      this.setData({
				topbarHeight: globalData.topbarHeight
			})
    }
    wx.hideShareMenu()
  },
  async onShow () {  
    this.setData({
      list: [],
      isinitiated: false,
    })
    this.getTechnicianList() // 获取技师列表数据
  },
  // 获取技师列表数据
  async getTechnicianList () {
    this.data.isLoading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await getTechnician({
        page: 1,
        // per_page: 15, // 每页条数（不传默认不分页）
      })
      if (statusCode === 200 && code === 0) {
        this.setData({
          list: data,
          isinitiated: true,
        })
      } else {
        showMessage({
          title: '获取技师列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('技师列表-getTechnicianList:', err)
    }
    wx.hideLoading()
    this.data.isLoading = false
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
  // 给技师点赞
  async likeTechnician (e) {
    // is_registered 0 未注册 1 注册、登录 2 未判断
		if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
		}
    this.data.isLoading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, code, message} = await recommendTechnician({
        technicians_id: e.target.dataset.techniciansid,
      })
      if (statusCode === 200 && code === 0) {
        this.getTechnicianList() // 获取技师列表数据
        wx.showToast({
          title: '推荐成功',
          icon: 'success',
          duration: 2000,
        })
      } else if (code === 10010011) {
        showMessage({
          title: '推荐技师失败',
          content: `${message}`,
        })
      } else {
        showMessage({
          title: '推荐技师失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('技师列表-likeTechnician:', err)
    }
    wx.hideLoading()
    this.data.isLoading = false
  },
})
