
import {
  getContent,
  contentJoin
} from '@/libs/modules/contentBlock'
import { getParamsApi} from '@/libs/modules/common'
import { getCardCenterListApi } from '@/libs/modules/mycard'  // 待删除
// 解码二维码scene
import queryScene from '@/utils/queryScene'
// 获取全局应用程序实例对象
const { globalData, changeDate, showMessage, queryURL, isRegistered, getAccessId} = getApp();

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    // sign_up: 0,
    // contents_type: 1,           // 平台内容-报名状态   1：已报名 2：未报名
    // product: [], // 商品
    // upkeep: [], // 养护卡
    card_list: [], // 养护卡数据 (待删除)

    data_list: {
      title: '',
      brand_id: '',
      brand_name: '',
      cover: '',
      description: '',
      // 1、内容，2、报名，3、商品，4、服务，5、养护卡，6、拼团，7、秒杀，8、优惠券
      relation: [
        {
          type: 6,
          goods_img: "https://oss1.chedianai.com/test/images/other/15580738992646.png?imageMogr2/auto-orient",
          goods_name: "左木专用(次",
          goods_price: 1,
          group_price: 1,
          group_product_id: 110,
          num: 2,
          sku_id: 0,
          spu_id: 34,
          content_type: 5,
        },
        {
          type: 6,
          goods_img: "https://oss1.chedianai.com/test/images/other/15639659303229.png?imageMogr2/auto-orient",
          goods_name: "左木专用 5W-40 1",
          goods_price: 1,
          group_price: 1,
          group_product_id: 112,
          num: 2,
          sku_id: 25292,
          spu_id: 1352,
          content_type: 1,
        },
        {
          type: 7,
          end_time: 1567267140,
          inventory_total: 18,
          mini_price: 1,
          mini_price_sku: 25292,
          name: "秒杀111",
          pic: "https://oss1.chedianai.com/test/images/other/15639659303229.png?imageMogr2/auto-orient",
          sales_total: 5,
          seckill_id: 352,
          seckill_sku_price: 1,
          sku_id: 25292,
          sku_price: 1,
          spu_id: 1352,
          start_time: 1564761600,
          content_type: 1,
        },
        {
          type: 7,
          end_time: 1567267140,
          inventory_total: 222,
          mini_price: 1200,
          mini_price_sku: 0,
          name: "秒杀222",
          pic: "https://oss1.chedianai.com/test/images/other/15580738564447.png?imageMogr2/auto-orient",
          sales_total: 0,
          seckill_id: 350,
          seckill_sku_price: 1200,
          sku_id: 0,
          sku_price: 10000,
          spu_id: 29,
          start_time: 1566576000,
          content_type: 5,
        },
        {
          type: 3,
          goods_img: "https://oss1.chedianai.com/test/images/other/15547940500943.png?imageMogr2/auto-orient",
          goods_name: "（智能保养测试）壳牌极净超凡喜力机油 ECT C2/C3 0W-30 4L",
          goods_price: 76800,
          is_recommend: 2,
          sales: 1,
          shop_id: 235,
          sku_id: 25058,
          source: 1,
          spu_id: 1143,
          store_id: 306,
          content_type: 1,
        },
        {
          type: 5,
          id: 29,
          image_url: "https://oss1.chedianai.com/test/images/other/15580738564447.png?imageMogr2/auto-orient",
          name: "朱云强新增次卡",
          num: 0,
          origin_price: "1000.00",
          price: "100.00",
          sale: 7,
          content_type: 2,
        },
        {
          type: 8,
        },
        {
          type: 5,
          id: 63,
          image_url: "https://oss1.chedianai.com/test/images/other/15580738992646.png?imageMogr2/auto-orient",
          name: "1",
          num: 1,
          origin_price: "1.00",
          price: "0.01",
          sale: 5,
          content_type: 1,
        },
        {
          type: 4,
          goods_img: "https://oss1.chedianai.com/test/images/other/15405529026771.jpg",
          goods_name: "壳牌喜力HX7深度养护服务",
          goods_price: 64800,
          is_recommend: 2,
          sales: 7,
          shop_id: 235,
          sku_id: 0,
          source: 1,
          spu_id: 341,
          store_id: 306,
          content_type: 2,
        }
      ]
    },


    topbarHeight: 64, // 默认菜单栏高度
		title: '',								// 标题
		brand: '',								// 品牌名
		time: '',								  // 时间
		content: '',							// 内容
		type: 1,
    content_type: 0,           // 内容类型 1: 平台 2: 门店
    errPage: false, // 错误页面控制字段
    errMsg: '暂无内容',
    showHome: false,
    top_height: 0, // padding高度
    is_open: 2, // 是否开启参与活动 1: 开启参与活动 2: 关闭参与活动
    is_join: 2, // 用户是否过参与活动 1: 已参与 2: 未参与
    is_brand: '', // 判断是否从品牌馆进入文章详情的
    is_disabled: false, // 防止按钮多次点击
    access_id: null, // 二维码追踪标识
  },
  // 生命周期函数--监听页面加载
	async onLoad(option) {
    // 判断是否从品牌馆进入文章详情的
    if (option.is_brand) {
      this.setData({
        is_brand: option.is_brand,
      })
    }
    if (option.access_id) {
      this.data.access_id = option.access_id
    }
    // 如果是扫码进入
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      if (scene.indexOf(',') !== -1) {
        let obj = queryScene(scene)
        if (obj.scene.store_id) wx.setStorageSync('current_store_id', obj.scene.store_id)
        if (obj.qr_code_rid) {
          await this.getParams(obj.qr_code_rid)
          await getAccessId(obj)
        }
      }
      if (scene.indexOf('?') !== -1) {
        let obj = queryURL(scene)
        if (obj.s) wx.setStorageSync('current_store_id', obj.s)
        await this.getParams(obj.o)
      }
    } else {
      let pages = getCurrentPages();
      if (pages.length === 1) {
        this.setData({
          showHome: true,
          topbarHeight: globalData.topbarHeight
        })
      } else {
        this.setData({
          topbarHeight: globalData.topbarHeight
        })
      }
      if (option.type || option.title ) {
        this.setData({
          id: option.id,
          is_open: option.isopen,
          is_join: option.isjoin,
        })
        // type= 2  3  4   超级品牌日跳转的文章详情页
        // 金装双11
        if (parseInt(option.type) === 2){
          this.setData({
            type: 4,
            title: '血拼双十一，喜力金装大惠战',
            brand: '壳牌',
            time: '10月29日',
            imgUrls: 'https://oss1.chedianai.com/images/assets/banner-shell-long.jpg'
          })
        }else if (parseInt(option.type) === 3){
          // 深度换油
          this.setData({
            type: 2,
            title: '小保养，大学问，放净油，深排毒',
            brand: '壳牌',
            time: '10月29日',
            imgUrls: 'https://oss1.chedianai.com/images/assets/deep-service-2.jpg'
          })
        }else if (parseInt(option.type) === 4){
          // 三元快车道
          this.setData({
            type: 3,
            title: '三元养护快车道，排除毒素更可靠',
            brand: '快车道',
            time: '10月29日',
            imgUrls: 'https://oss1.chedianai.com/images/assets/three-yuan-long.jpg'
          })
        }else{
          let content = globalData.richContent.replace(/<img/g, '<img style="max-width:100%;height:auto" ')
          this.setData({
            title: option.title,
            brand: option.name,
            time: changeDate(option.at),
            content: content
          })
        }
        this.setData({
          errPage: false
        })
      } else {
        this.setData({
          id: option.id,
          content_type: option.content_type
        })
        // this.getContentFun()
      }
    }
    // 判断是否注册
    if(globalData.is_registered === 2 && !this.data.is_brand) {
      await isRegistered()
      this.getContentFun() // 获取活动详情
      this.getCardList() // 待删除
    }
  },
  onShow() {
    if(globalData.is_registered !== 2 && this.data.id && !this.data.is_brand) {
      this.getContentFun() // 获取活动详情
      this.getCardList() // 待删除
    }
  },
  /**
   *   1=平台内容、2=门店内容
   */
  async getContentFun() {
    let self = this
    wx.showLoading({
      title: '加载中'
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await getContent({
        id: self.data.id,
        type: self.data.content_type,
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        // 设置返回数据中的所有图片尺寸
        let content = data.content.replace(/<img/g, '<img style="max-width:100%;height:auto" ')
        // 平台内容支持报名
        if(parseInt(self.data.content_type) === 1){
          this.setData({
            title: data.title,
            brand: data.brand_name,
            time: changeDate(data.created_at),
            // product: data.product,
            // upkeep: data.upkeep,
            content: content,
            // contents_type: parseInt(data.contents_type), // 报名状态
            // sign_up: data.sign_up, // 是否开启报名状态
          })
        } else {
          this.setData({
            title: data.title,
            brand: data.brand_name,
            time: changeDate(data.created_at),
            // product: data.product,
            // upkeep: data.upkeep,
            content: content
          })
        }
        // 数据内容正常
        self.setData({
          errPage: false
        })
      } else {
        // 数据内容返回错误
        self.setData({
          errPage: true,
          errMsg: message
        })
        wx.hideLoading()
        let codeArray = [10011020]
        if (codeArray.indexOf(code) === -1) {
          showMessage({
            title: `获取品牌内容失败`,
            content: `${message}`,
          })
        }
      }
    } catch (err) {
      wx.hideLoading()
      console.error('详情-getContentFun', err)
    }
    wx.hideLoading()
  },
  // 跳转商品/服务详情
  goDetail(e) {
    let type = e.currentTarget.dataset.type
    let product_id = e.currentTarget.dataset.productid
    let sku_id = e.currentTarget.dataset.skuid
    if (type === 1) {
      wx.navigateTo({
        url: `/pages/mall/goodsDetail/goodsDetail?spu_id=${product_id}&sku_id=${sku_id}`
      })
    } else if (type === 2) {
      wx.navigateTo({
        url: `/pages/mall/serviceDetail/serviceDetail?spu_id=${product_id}`
      })
    }
  },
  // 养护卡详情
  goUpkeepDetail (e) {
    let card_id = e.currentTarget.dataset.cardid
    if (this.data.access_id) {
      // 如果当前页面路由参数里包含access_id则传递至下一个页面否则不用传递
      wx.navigateTo({
        url: '../card/purchaseDetails/purchaseDetails?card_id=' + card_id + '&access_id=' +this.data.access_id
      })
    } else {
      wx.navigateTo({
        url: '../card/purchaseDetails/purchaseDetails?card_id=' + card_id
      })
    }
  },
  // 根据scene值获取参数
  async getParams (id) {
    try {
      const {statusCode, data, message, code} = await getParamsApi({
        relation_id: id,
      })
      wx.hideLoading()
      if (statusCode === 200) {
        let option = JSON.parse(data.scene)
        this.setData({
          topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
          id: option.content_id,
          content_type: option.content_type,
          showHome: true,
        })
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
  },
  // 品牌馆参与活动
  async goJoinActiv() {
    // 未注册或已参与的不再请求接口
    if (!this.isLogging() || this.data.is_join == 1) {
      return
    }
    wx.showLoading({
      title: '加载中'
    })
    this.setData({
      is_disabled: true,
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await contentJoin({
        id: Number(this.data.id),
        type: 2,
      })
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
        wx.showToast({
          title: '参与成功',
          icon: 'success',
          duration: 1000,
        })
        this.setData({
          is_join: 1
        })
      } else {
        showMessage({
          title: '参与失败',
          content: message
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('详情-goJoinActiv', err)
    }
    wx.hideLoading()
    this.setData({
      is_disabled: false,
    })
  },
  // 判断是否注册
  isLogging() {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return false
    }
    return true
  },

  // 获取购卡列表 (待删除)
  async getCardList() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
        meta
      } = await getCardCenterListApi()
      if (statusCode === 200) {
				if (code === 0) {
          data.forEach(element => {
            element.price = (element.price / 100).toFixed(2)
            element.origin_price = (element.origin_price / 100).toFixed(2)
          })
					this.setData({
						card_list: data,
          })
          console.log('data', data)
				}
      } else {
        showMessage({
          title: '获取购卡列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购卡中心-getCardList', err)
    }
    wx.hideLoading()
  },

  // 平台内容参与活动
  // async goJoinContent() {
  //   if(globalData.is_registered === 0) {
  //     wx.navigateTo({
  //       url: '/pages/register/registerPhone/registerPhone',
  //     })
  //     return
  //   }
  //   // 已参与的不再请求接口
  //   if (this.data.contents_type == 1){
  //     return
  //   }
  //   wx.showLoading({
  //     title: '加载中'
  //   })
  //   this.setData({
  //     is_disabled: true,
  //   })
  //   try {
  //     const {
  //       statusCode,
  //       data,
  //       code,
  //       message,
  //     } = await contentJoin({
  //       id: this.data.id,
  //     })
  //     if (statusCode === 200 && code === 0) {
  //       wx.hideLoading()
  //       wx.showToast({
  //         title: '参与成功',
  //         icon: 'success',
  //         duration: 1000,
  //       })
  //       this.setData({
  //         contents_type: 1
  //       })
  //     } else {
  //       showMessage({
  //         title: '参与失败',
  //         content: message
  //       })
  //     }
  //   } catch (err) {
  //     wx.hideLoading()
  //     console.error('详情-goJoinContent', err)
  //   }
  //   wx.hideLoading()
  //   this.setData({
  //     is_disabled: false,
  //   })
  // },
});
