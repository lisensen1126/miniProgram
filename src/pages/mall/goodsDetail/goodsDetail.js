import { goodsDetail, skudetail, addShop, getGoodsCouponList } from '@/libs/modules/shopMall'
import { getCoupon } from '@/libs/modules/coupon'
// 获取全局应用程序实例对象
const { showMessage, globalData, isRegistered } = getApp()
import { sendFormId } from '@/utils/formid'

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    spu_id: 0, // 商品 spu
    // 商品详情
    goodsInfo: {},
    // 购买数量
    quantity: 1,
    // sku选择浮层
    cartCover: false,
    // sku描述信息
    skuInfo: '',
    // 选择的sku_id
    sku_id: 0,
    // 选择的sku项
    skuItem: {
      sku_price: 0
    },
    // 是否渲染数据
    pageShow: false,
    // 控制分享有礼弹框变量
    isShowCoupon: false,
    showHome: false,
    // 优惠券浮层
    couponCover: false,
    // sku浮层类型，默认1
    skuCoverType: 1,
    // 是否展示缺省页面
    isShowDefault: false,
    // sku_lib_all: [], // sku 组合库
    sku_lib: [], // sku 组合库
    // sku_def: [441, 449, 2047, 2055], // 默认的sku 组合
    sku_def: [], // 默认的sku 组合
    sku_err_tip: '', // 非法的sku错误提示
    err_tip: '获取商品详情失败', // 缺省文案
    err_icon: 'nosearch', // 缺省icon
    go_type: null, // 跳转进入类型，首页进入=index和门店进入=store
    top_height: 0, // padding高度
    received_list: [], // 已领取优惠券
    un_receive_list: [], // 未领取优惠券
    isRequestCoupon: true, // 是否第一次查询过优惠列表
  },
  /*****************商品详情**************************/
  async getGoodsDetail() {
    let self = this
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
      sku_id: this.data.sku_id,
    }
    try {
      const { statusCode, data, message, code } = await goodsDetail(params)
      wx.hideLoading()
      if (statusCode === 200) {
        // 渲染页面
        this.setData({
          pageShow: true,
        })
        if (parseInt(code) === 0) {
          // 已下架商品不展示页面，确定返回上一页
          if (parseInt(data.is_sale) === 2) {
            self.setData({
              err_tip: '商品已下架',
              err_icon: 'goodsdown',
              isShowDefault: true,
            })
            return false
          }

          let skuItem = {
            sku_pics: [data.sku_default_img],
            sku_price: (data.goods_price / 100).toFixed(2),
            contents: [],
            sku_id: self.data.sku_id,
            spu_id: self.data.spu_id
          }
          // 格式化商品金额(接口返回的数据单位：分)
          data.goods_price = (data.goods_price / 100).toFixed(2)
          self.setData({
            goodsInfo: data,
            skuItem: skuItem,
            skuInfo: data.sku_default,
            sku_default: data.sku_default.split(' ')
          })
          // 获取sku数据
          self.getSkuDetail()
        } else {
          self.setData({
            isShowDefault: true,
          })
          if (parseInt(code) === 10011022) {
            this.setData({
              err_tip: '商品已下架',
              err_icon: 'nogoods',
            })
          } else {
            this.setData({
              err_tip: '获取商品详情失败',
            })
          }
        }
      } else {
        showMessage({
          title: '获取商品详情失败',
          content: `${message}`,
          resolve: () => {
            wx.navigateBack()
          }
        })
      }
    } catch (err) {
      console.error('商品详情-getGoodsDetail', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },

  /*****************sku详情**************************/
  async getSkuDetail() {
    let self = this
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
      sku_id: this.data.sku_id,
      category_id: this.data.goodsInfo.category_id,
    }
    try {
      const { statusCode, data, message, code } = await skudetail(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        let goodsInfo = self.data.goodsInfo
        // 过滤不需要的属性
        goodsInfo.attribute_data = data.attribute_data.map((item, index) => {
          // 组装默认id 如果接口返回 可删除
          item.attribute_items.forEach((attr) => {
            if (attr.is_checkout) {
              this.data.sku_def[index] = attr.attribute_item_id
            }
          })
          // 过滤属性
          item.attribute_items = item.attribute_items.filter(attr => {
            return attr.is_optional == 1
          })
          return item
        })

        // 过滤不必要的 sku
        let sku_lib = []
        data.sku_data.forEach(item => {
          item.sku_price = (item.sku_price / 100).toFixed(2)
          if (item.is_enabled == 1) {
            sku_lib.push(item.attribute_item_ids)
          }
          // 3.8.10跳转取消Sku
          // if (parseInt(item.sku_id) === parseInt(self.data.sku_id)) {
          //   self.setData({
          //     skuItem: item,
          //   })
          // }

          // 使用默认选中sku里面的详情图
          if (item.is_checkout) {
            self.setData({
              skuItem: item,
            })
            return
          }
        })

        goodsInfo.sku_data = data.sku_data
        self.setData({
          goodsInfo: goodsInfo,
          sku_lib_all: sku_lib,
        })
        this.formatSkuLib(sku_lib)
      } else {
        showMessage({
          title: '获取商品详情失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      console.error('商品详情-getSkuDetail', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },

  /**
   * 格式化 冥集
   * @param {array} lib sku库 二维数组
   */
  formatSkuLib(lib) {
    let lib_temp = []
    lib.forEach(arr => {
      let list = [''];
      for (var i = 0, len = arr.length; i < len; i++) {
        list.forEach(x => {
          if (!x) {
            list.push(x + arr[i])
          } else {
            list.push(x + ',' + arr[i])
          }
        })
      }
      lib_temp.push(...list)
    })
    // this.setData({
    //   sku_lib: Array.from(new Set(lib_temp))
    // })
    this.data.sku_lib = Array.from(new Set(lib_temp))
  },

  /********************图片预览**********************/
  previewImg(e) {
    wx.previewImage({
      urls: e.currentTarget.dataset.imgs,
      current: e.currentTarget.dataset.img
    })
  },

  /********************整理sku数据**********************/
  selectSku() {
    let attribute_data = this.data.goodsInfo.attribute_data
    let sku_data = this.data.goodsInfo.sku_data
    let checkOut_sku = []
    let self = this
    attribute_data.forEach(function (attribute_item) {
      attribute_item.attribute_items.forEach(function (parameter_item) {
        if (parameter_item.is_checkout) {
          checkOut_sku.push(parameter_item.attribute_item_id)
          return false
        }
      })
    })
    // 获取选中的sku
    sku_data.forEach(function (skuItem) {
      if (skuItem.attribute_item_ids.join(',') === checkOut_sku.join(',')) {
        let skuInfo = ''
        skuItem.attribute_items.forEach(function (item) {
          skuInfo += item + ' '
        })
        self.setData({
          skuItem: skuItem,
          skuInfo: skuInfo
        })
        // 存储更新全局sku
        globalData.sku_default_Item = self.data.skuItem
      }
    })
  },

  /********************选取优惠券浮层**********************/

  showCouponCover() {
    this.setData({
      couponCover: !this.data.couponCover
    }, () => {
      if (this.data.couponCover) {
        this.fetchCouponList()
      }
    })
  },

  /**
   * 优惠券列表
   */
  async fetchCouponList() {
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      const { statusCode, data, code, message } = await getGoodsCouponList({
        spu_id: this.data.spu_id,
        sku_id: this.data.sku_id,
      })
      if (statusCode === 200 && code === 0) {
        this.setData({
          un_receive_list: data.couponList,
          received_list: data.couponCustomerList
        })
      } else {
        showMessage({
          title: '获取优惠券列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('商品详情-fetchCouponList', err)
    }
    wx.hideLoading()
  },

  /**
   * 领取优惠券
   * @param {Object} item 优惠券对象
   */
  async receiveCoupon(item) {
    // this.data.received_list.unshift(item)
    // return
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return false
    }

    let self = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      coupon_id: item.detail.coupon.coupon_id,
      obtain_type: 5, // 1：定向推送，2：活动中心，4：优惠来袭，5：商品详情
      relation_id: self.data.relation_id ? self.data.relation_id : null,
    }
    // 当前时间 减去 获取access_id的时间 是否超过五分钟
    if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
      params.access_id =  wx.getStorageSync('access_id').access_id
    }
    try {
      const { statusCode, data, code, message } = await getCoupon(params)
      if (statusCode === 200 && code === 0) {
        let id = item.detail.coupon.coupon_id
        this.data.un_receive_list.forEach(v => {
          if (v.coupon_id == id) {
            v.receive_status = v.user_limit === 1 ? 3 : 2
          }
        })
        this.data.received_list.unshift(...data)
        this.setData({
          un_receive_list: this.data.un_receive_list,
          received_list: this.data.received_list,
        })
        wx.hideLoading()
        setTimeout(() => {
          wx.showToast({
            title: '领取成功',
            icon: 'none',
            duration: 1000,
          })
        }, 50);
      } else {
        showMessage({
          title: '领取优惠券失败',
          content: `${message}`,
        })
        wx.hideLoading()
      }
    } catch (err) {
      console.error('商品详情-receiveCoupon', err)
      wx.hideLoading()
    } finally {
      // this.fetchCouponList()
    }
  },


  /********************选取规格浮层**********************/
  // sku浮层开关
  chooseSku(e) {
    this.setData({
      skuCoverType: e.currentTarget.dataset.type ? e.currentTarget.dataset.type : 1,
      cartCover: !this.data.cartCover
    })
    if(this.data.goodsInfo.attribute_data) {
      this.initAttr()
    }
  },
  // sku选择属性
  async checkParameterItem(e) {
    let self = this
    let event = e.currentTarget.dataset, // 点击的对象
      item_value = event.item.attribute_item_value, // 点击的属性的value值
      item_id = event.id, // 点击的属性的id
      item_index = event.index, // 点击的是第几个属性
      item_type = event.enabled, // 是否是虚线 1是高亮  3是虚线
      sku_def = this.data.sku_def // 默认sku
    // 无商品 点击虚线框
    if (item_type == 3) {
      sku_def = []
      this.setData({
        sku_err_tip: item_value + ' 与其他已选项无法组成可售商品，请重选',
        show_sku_err: true,
      })
    }
    setTimeout(function () {
      self.setData({
        sku_err_tip: '',
      })
    }, 2000)
    // 有商品 重组默认属性sku
    sku_def[item_index] = item_id
    let array = this.data.goodsInfo.attribute_data
    array.forEach(function (attr, index) {
      if (!sku_def[index]) {
        attr.is_enabled_tip = 1
      } else {
        attr.is_enabled_tip = 2
      }
    })


    // this.setData({
    //   sku_def: sku_def
    // })
    this.data.sku_def = sku_def
    // 格式化属性参数
    this.initAttr()

    // 重置 sku
    this.selectSku()
  },

  // 初始化时候 重组sku
  initAttr() {
    let sku_def = this.data.sku_def
    let array = this.data.goodsInfo.attribute_data
    // 被选中的属性数量
    let checkout_nums = 0

    array = array.map((attr, index) => {
      attr.attribute_items = attr.attribute_items.map(item => {
        // 判断选中  不选中
        if (item.attribute_item_id == sku_def[index]) {
          checkout_nums += 1
          item.is_checkout = true
          item.is_enabled = 1
        } else {
          item.is_checkout = false
        }

        // 如果已选 不作为
        if (item.is_checkout) return item

        // 未选中 判断是否隐藏
        let sku_temp = [...sku_def]
        sku_temp[index] = item.attribute_item_id
        // 去重 空格
        sku_temp = sku_temp.filter(item => {
          return !!item
        })

        let res = this.data.sku_lib.some(sku => {
          return sku === (sku_temp + '')
        })
        if (res) {
          item.is_enabled = 1
        } else {
          item.is_enabled = 3
        }
        return item
      })
      return attr
    })
    // 判断被选中的属性数量  === 启用的属性数量   标识着各属性都已被选择 清空sku的错误提示
    if (parseInt(checkout_nums) == parseInt(this.data.goodsInfo.attribute_data.length)) {
      this.setData({
        show_sku_err: false,
      })
    }
    // 更新数据
    this.setData({
      'goodsInfo.attribute_data': array,
    })
  },
  // 修改商品、服务数量
  changeItemNum(e) {
    if (e.currentTarget.dataset.number < 0 && this.data.quantity <= 1) {
      this.setData({
        quantity: 1,
      })
      return false
    }
    this.setData({
      quantity: this.data.quantity + parseInt(e.currentTarget.dataset.number),
    })
  },
  // 关闭弹层
  closeCartCover() {
    this.setData({
      cartCover: !this.data.cartCover
    })
  },

  /********************加购物车**********************/
  async addGoods(e) {
    let self = this
    // 判断用户身份
    var res = await this.getUserRegister()
    if (!res || this.data.show_sku_err) {
      return
    }

    // 接口返回sku_data和attribute_data数据时，更新sku数据
    if (this.data.goodsInfo.sku_data && this.data.goodsInfo.attribute_data) {
      await this.selectSku()
    }

    let params = {
      type: 1,
      product_id: this.data.goodsInfo.spu_id,
      item_id: this.data.skuItem.sku_id,
      quantity: this.data.quantity,
      unit_price: this.data.skuItem.sku_price * 100,
    }
    // 关闭sku浮层
    self.setData({
      cartCover: false,
    })
    try {
      const { statusCode, message, code } = await addShop(params)
      wx.hideLoading()
      if (statusCode === 200 && parseInt(code) === 0) {
        wx.showToast({
          title: '加入购物车成功',
          icon: 'succes',
          duration: 1500,
          mask: true
        })
        let num = 'goodsInfo.cart_num'
        self.setData({
          [num]: parseInt(self.data.goodsInfo.cart_num) + parseInt(self.data.quantity),
          quantity: 1
        })
      } else {
        showMessage({
          title: '添加商品失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('商品详情-addGoods', err)
    }
  },

  /********************立即下单**********************/
  async createOrder(e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if (!res || this.data.show_sku_err) {
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 接口返回sku_data和attribute_data数据时，更新sku数据
    if (this.data.goodsInfo.sku_data && this.data.goodsInfo.attribute_data) {
      await this.selectSku()
    }
    let listItem = {
      image_url: this.data.skuItem.sku_pics[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.skuItem.sku_price * 100,
      sku_detail: this.data.skuInfo,
      category_id: this.data.goodsInfo.category_id,      // 获取可使用优惠券所需参数
      biz_product_id: this.data.goodsInfo.product_id,    // 获取可使用优惠券所需参数
    }
    let params = {
      payment_channel: 1,
      total_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
      final_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        sku_id: this.data.skuItem.sku_id,
        quantity: this.data.quantity,
        unit_price: this.data.skuItem.sku_price * 100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 1
      }]
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    // 确认订单
    wx.navigateTo({
      url: `/pages/order/confirmOrder/confirmOrder`,
    })
  },

  /********************去购物车**********************/
  async goCart(e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if (!res) {
      return
    }
    wx.navigateTo({
      url: '/pages/shopCart/shopCart'
    })
  },

  // 判断用户是否注册
  async getUserRegister() {
    // is_registered 0 未注册 1 注册、登录 2 未判断
    if (globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return false
    }
    return true
  },

  // 页面分享设置
  onShareAppMessage() {
    let self = this
    let url = 'pages/mall/goodsDetail/goodsDetail?spu_id=' + this.data.spu_id + '&sku_id=' + this.data.skuItem.sku_id + '&share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    // 分享带上用户id,用于分享参数上报
    if (globalData.current_customer_id) {
      url = url + '&share_from_id=' + globalData.current_customer_id
    }
    // 分享带上门店名称,用于参数上报
    if (globalData.ep_store_name) {
      url = url + '&current_store_name=' + globalData.ep_store_name
    }
    return {
      title: '嘿！给你推荐个好东西，绝对物超所值！',
      path: url,
      success: function () {
      }
    };
  },
  // 关闭分享有礼
  couponCancel(params) {
    // this.setData({
    //   isShowCoupon: false
    // })
    this.data.isShowCoupon = false
  },

  /********************生命周期函数--监听页面加载**********************/
  async onLoad(option) {
    console.log('>>>', option)
    let pages = getCurrentPages();
    if (pages.length === 1) {
      this.setData({
        showHome: true,
        // spu_id: option.spu_id,
        // sku_id: option.sku_id ? option.sku_id : '',    // 3.8.10如果存在sku给后台传递，如果不存在传空
        top_height: globalData.topbarHeight,
        // go_type: option.go_type ? option.go_type : null,
      })
      this.data.go_type = option.go_type ? option.go_type : null
      this.data.sku_id = option.sku_id ? option.sku_id : ''
      this.data.spu_id = option.spu_id
    } else {
      this.setData({
        // spu_id: option.spu_id,
        // sku_id: option.sku_id ? option.sku_id : '',
        top_height: globalData.topbarHeight,
        // go_type: option.go_type ? option.go_type : null,
      })
      this.data.go_type = option.go_type ? option.go_type : null
      this.data.sku_id = option.sku_id ? option.sku_id : ''
      this.data.spu_id = option.spu_id
    }

    // 判断是否判断过注册
    if (globalData.is_registered === 2) {
      await isRegistered()
    }

    // 初始化全局sku
    globalData.sku_default_Item = null
  },

  async onShow() {
    // 判断是否存在全局sku,存在sku则默认选中该sku
    let global_sku_item = globalData.sku_default_Item
    if (global_sku_item && global_sku_item.sku_id) {
      // this.setData({
      //   sku_id: global_sku_item.sku_id,
      // })
      this.data.sku_id = global_sku_item.sku_id
    }
    // 缓存中的技师id
    let scene = wx.getStorageSync('scene')
    this.setData({
      cartCover: false,
      relation_id: scene, // 更新技师关联id
      enter_page_date: new Date() / 1
    })

    this.getGoodsDetail()
  },
  // formid 收集
  sendFormId,
});
