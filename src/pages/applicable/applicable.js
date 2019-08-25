import {
  getApplicableList,
  getApplicaAllApi,
  getApplicaCardApi,
} from '@/libs/modules/coupon'

const {globalData, showMessage} = getApp()
Page({
  data: {
    top_height: 0, // 搜索框位移高度
    top_nav_height: 0, // tap栏位移高度
    data_list_height: 0, // 内容区域padding-top高度
    is_sear: false,   // 控制搜索显隐
    search_value: '',     // 搜索框内容
    page_title: '适用商品/服务',   // 页面标题
    cc_id: null,    // 优惠券id
    list: [],     // 列表
    input_default: "快速搜索您想要的商品和服务",   // 搜索框中文案
		// 分页参数
		meta: {
			last_page: 1,
			current_page: 0,
		},
		is_loading: true,    // 上拉加载
    is_all_loaded: false,    // 判断是否加载完全部数据
    request_type: '',    // 优惠券适用场景，不同的参数请求不同的接口   1.通用   3.指定商品/服务  4.指定的养护卡
  },

  // 搜索框 获取焦点  展示历史记录、搜索按钮
  showSearchBar() {
    this.setData({
      is_sear: true,
      brandCover: false,
    })
  },

  // 更新关键字
  changesearch_value(e) {
    this.setData({
      search_value: e.detail.value.slice(0,20),
    })
  },

  // 清除关键字
  cleanSear() {
    this.setData({
      search_value: ''
    })
  },

  // 点击搜索按钮
  goSear(e) {
    if(this.data.search_value) {
      this.setData({
        is_sear: false,
        meta: {
          last_page: 1,
          current_page: 0,
        },
        list: []
      })
      // 1.通用   3.指定商品/服务  4.指定的养护卡
      if(this.data.request_type === 3) this.fetchGoodList()
      if(this.data.request_type === 1) this.fetchAllList()
      if(this.data.request_type === 4) this.fetchCardList()
    } else {
      this.setData({is_sear: false})
    }
  },

  // 请求指定商品服务列表数据
  async fetchGoodList () {
    this.setData({ is_loading: true })
		wx.showLoading({
			title: '加载中...',
			mask: true,
    })
    try {
			let page_index = this.data.meta.current_page + 1
			const {
				statusCode,
				data,
				code,
				message,
				meta
			} = await getApplicableList({
				page: page_index,
				per_page: 10,
        cc_id: this.data.cc_id,
        keywords: this.data.search_value,
			})
			if (statusCode === 200 && code === 0) {
				let _list = this.data.list
				_list.splice(_list.length, 0, ...data)
        this.setData({
          list: _list,
          is_all_loaded: meta.current_page >= meta.last_page,
          meta
        })
			} else {
				showMessage({
					title: '获取列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
      console.error('适用商品/服务-fetchGoodList', err)
		}
    this.setData({ is_loading: false })
		wx.hideLoading()
  },
  
  // 请求指定养护卡列表数据
  async fetchCardList () {
    this.setData({ is_loading: true })
		wx.showLoading({
			title: '加载中...',
			mask: true,
    })
    try {
			let page_index = this.data.meta.current_page + 1
			const {
				statusCode,
				data,
				code,
				message,
				meta
			} = await getApplicaCardApi({
				page: page_index,
				per_page: 10,
        cc_id: this.data.cc_id,
        keywords: this.data.search_value,
			})
			if (statusCode === 200 && code === 0) {
				let _list = this.data.list
				_list.splice(_list.length, 0, ...data)
        this.setData({
          list: _list,
          is_all_loaded: meta.current_page >= meta.last_page,
          meta
        })
			} else {
				showMessage({
					title: '获取列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
      console.error('适用商品/服务-fetchCardList', err)
		}
    this.setData({ is_loading: false })
		wx.hideLoading()
  },
  
  // 请求指定商品服务养护卡列表数据
  async fetchAllList () {
    this.setData({ is_loading: true })
		wx.showLoading({
			title: '加载中...',
			mask: true,
    })
    try {
			let page_index = this.data.meta.current_page + 1
			const {
				statusCode,
				data,
				code,
				message,
				meta
			} = await getApplicaAllApi({
				page: page_index,
				per_page: 10,
        cc_id: this.data.cc_id,
        keywords: this.data.search_value,
			})
			if (statusCode === 200 && code === 0) {
				let _list = this.data.list
				_list.splice(_list.length, 0, ...data)
        this.setData({
          list: _list,
          is_all_loaded: meta.current_page >= meta.last_page,
          meta
        })
			} else {
				showMessage({
					title: '获取列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
      console.error('适用商品/服务-fetchAllList', err)
		}
    this.setData({ is_loading: false })
		wx.hideLoading()
	},
	
  // 去商品详情
  goDetail(e) {
    let type = parseInt(e.currentTarget.dataset.item.type)
    let is_recommend = parseInt(e.currentTarget.dataset.item.is_recommend)  
    if (type === 1 || is_recommend === 1) {
      wx.navigateTo({
        url: '/pages/mall/goodsDetail/goodsDetail?spu_id='+e.currentTarget.dataset.item.spu_id+'&sku_id='+e.currentTarget.dataset.item.sku_id
      })
    }
    if (type === 2) {
      wx.navigateTo({
        url: '/pages/mall/serviceDetail/serviceDetail?spu_id='+e.currentTarget.dataset.item.spu_id
      })
    }
    if (type === 3) {
      wx.navigateTo({
        url: `/pages/card/purchaseDetails/purchaseDetails?card_id=${e.currentTarget.dataset.item.spu_id}`
      })
    }
  },

  // 上拉加载
  onReachBottom () {
    if (this.data.is_all_loaded) {
      return
    }
    // 1.通用   3.指定商品/服务  4.指定的养护卡
    if(this.data.request_type === 3) this.fetchGoodList()
    if(this.data.request_type === 1) this.fetchAllList()
    if(this.data.request_type === 4) this.fetchCardList()
  },

  onLoad(options) {
    let title=""
    switch(options.type){
      case "1":
        title="适用商品/服务"
        break
      case "3":
        title="适用商品/服务"
        break
      case "4":
        title="适用养护卡"        
        break
    }
    if(options.type==="4"){
      this.setData({
        input_default: "快速搜索您想要的养护卡"
      })
    }
    this.setData({
      top_height: globalData.topbarHeight,
      top_nav_height: globalData.top_nav_height,
      data_list_height: globalData.data_list_height - 45,
      cc_id: options.ccId,
      request_type: options.type - 0,
      page_title:title
    })
    wx.hideShareMenu()
  },
  
  onShow () {
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间，cdp上报用
      list: [],
      meta: {
        last_page: 1,
        current_page: 0,
      },
      is_loading: true,
      is_all_loaded: false,
    })
    // 1.通用   3.指定商品/服务  4.指定的养护卡
    if(this.data.request_type === 3) this.fetchGoodList()
    if(this.data.request_type === 1) this.fetchAllList()
    if(this.data.request_type === 4) this.fetchCardList()
  },
});
