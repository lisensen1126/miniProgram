import { groupGoodsSkuList} from '@/libs/modules/shopGroup'

// 获取全局应用程序实例对象
const { globalData } = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		list: [],
    is_loading: false,
    is_all_loaded: false,
		page: 1,
		size: 10,
		total: 0,
    showHome: false
	},
  // 商品列表
  async getList () {
    this.setData({
      is_loading: true,
    })
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    // 请求商品列表接口
    groupGoodsSkuList({
      page: this.data.page,
      size: 10
    }).then( result => {
      let data = result.data
      // 格式化商品、服务价格
      data.forEach(item => {
        item.group_price = (item.group_price/100).toFixed(2)
        item.goods_price = (item.goods_price/100).toFixed(2)
      });
      // 拼接列表
      let lastData = this.data.list
      lastData.splice(lastData.length, 0, ...data)
      // 更新数据
      this.setData({
        list: lastData,
        is_loading: false,
        pageShow: true,
        page: this.data.page+1,
        is_all_loaded: lastData.length >= parseInt(result.meta.total),
      })
      wx.hideLoading()
    }, err => {
      wx.hideLoading()
      if(err.error === "ERROR"){
        showMessage({
          title: '获取拼团商品列表失败',
          content: err.message,
        })
      }
    })
  },

  // 上拉加载更多
  onReachBottom: function() {
    // 商品列表都请求完成 则不再触发上拉加载更多操作
    if (this.data.is_all_loaded) {
      return false
    }
    this.getList()
  },

  /****
   * 跳转详情页面
   * @param event对象
   */
  goDetail(e) {
    let item = e.currentTarget.dataset.item
    let customize = {
      spuId: e.currentTarget.dataset.item.spu_id ? parseInt(e.currentTarget.dataset.item.spu_id) : '',
      skuId: e.currentTarget.dataset.item.sku_id ? parseInt(e.currentTarget.dataset.item.sku_id) : '',
    }
    // 1:商品 2:服务 3壳养护卡 4养护卡 5次卡
	  if (parseInt(item.type) === 1){
      // 拼团商品详情
	    wx.navigateTo({
	      url: `/pages/spilkeGroup/groupGoodsDetail/groupGoodsDetail?spu_id=${item.spu_id}&group_product_id=${item.group_product_id}&sku_id=${item.sku_id}`
      })    
	  } else if (parseInt(item.type) === 2){
      // 服务详情
      wx.navigateTo({
        url: `/pages/spilkeGroup/groupServiceDetail/groupServiceDetail?spu_id=${item.spu_id}&group_product_id=${item.group_product_id}`
      })    
	  } else if (parseInt(item.type) >= 3){
      // 卡详情
      wx.navigateTo({
        url: `/pages/spilkeGroup/groupPurchaseDetail/groupPurchaseDetail?card_id=${item.spu_id}&group_product_id=${item.group_product_id}`
      })
	  }

  },

	// 页面分享设置
	onShareAppMessage() {
    let url = 'pages/spilkeGroup/groupCategoryList/groupCategoryList?share=1'
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
			title: '团结就是力量，大家一起努力，拼出实惠拼垮老板！',
			path: url,
		};
	},
  onLoad () {
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    }) 
  },
  // 页面数据初始化、请求接口
  onShow() {
    // 获取小程序路径长度，判断是否需要展示返回首页按钮
    let pages = getCurrentPages();
    if (pages.length === 1) {
      this.setData({
        showHome: true
      })
    }
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间
      list: [],
      is_loading: false,
      is_all_loaded: false,
      pageShow: false
    })
    this.data.page = 1
    this.data.size = 10
    this.data.total = 0
  	this.getList()
	}
});
