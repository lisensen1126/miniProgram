import { serviceDetail, addShop, getServiceCouponList } from '@/libs/modules/shopMall'
import { getCoupon } from '@/libs/modules/coupon'
// 获取全局应用程序实例对象
const { showMessage, isRegistered, globalData } = getApp()
import { sendFormId } from '@/utils/formid'
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    // 服务详情
    goodsInfo: {},
    // 购买数量
    quantity: 1,
    pageShow: false,
    isShowCoupon: false,
    // 优惠券浮层
    couponCover: false,
    showHome: false,
    // 是否展示缺省页面
    isShowDefault: false,
    err_tip: '获取服务详情失败', // 缺省文案
    err_icon: 'nosearch', // 缺省icon
    go_type: null, // 跳转进入类型，首页进入=index和门店进入=store
    top_height: 0, // padding高度
    received_list: [], // 已领取优惠券
    un_receive_list: [], // 未领取优惠券
    isRequestCoupon: true, // 是否第一次查询过优惠列表
  },
  // formid 收集
  sendFormId,
  /** ****************** 选取优惠券浮层 **********************/

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
      const { statusCode, data, code, message } = await getServiceCouponList({
        spu_id: this.data.spu_id,
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
      console.error('服务详情-fetchCouponList', err)
    }
    wx.hideLoading()
  },

  /**
   * 领取优惠券
   * @param {Object} item 优惠券对象
   */
  async receiveCoupon(item) {
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
      console.error('服务详情-receiveCoupon', err)
      wx.hideLoading()
    }
  },

  /*****************服务详情**************************/
  async getServiceDetail() {
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
    }
    try {
      const { statusCode, data, message, code } = await serviceDetail(params)
      wx.hideLoading()
      let err_code_arr = [30306, 10011021, 10011022, 10011023]
      self.setData({
        pageShow: true
      })
      if (statusCode === 200) {
        if (parseInt(code) === 0) {
          // 已下架商品不展示页面，确定返回上一页
          if (parseInt(data.is_sale) === 2) {
            showMessage({
              title: '查看未成功',
              content: `很抱歉，当前服务门店已下架`,
            })
            self.setData({
              err_tip: '服务已下架',
              err_icon: 'goodsdown',
              isShowDefault: true,
            })
            return false
          }
          // 格式化服务金额(接口返回的数据单位：分)
          data.goods_price = (data.goods_price / 100).toFixed(2)
          // 展示页面数据
          self.setData({
            isLoading: false,
            goodsInfo: data,
            pageShow: true
          })
        } else if (parseInt(code) === 10011025) {
          showMessage({
            title: '获取服务详情失败',
            content: `服务已下架`,
          })
          self.setData({
            err_tip: '服务已下架',
            err_icon: 'goodsdown',
            isShowDefault: true,
          })
        } else if (parseInt(code) === 10011022) {
          showMessage({
            title: '获取服务详情失败',
            content: `服务已下架`,
          })
          self.setData({
            err_tip: '服务已下架',
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        } else {
          showMessage({
            title: '获取服务详情失败',
            content: `${message}`,
          })
          self.setData({
            err_tip: '获取服务详情失败',
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }
      } else {
        if (err_code_arr.indexOf(code) != -1) {
          self.setData({
            isShowDefault: true,
          })
        }
        showMessage({
          title: '获取服务详情失败',
          content: `${message}`,
        })
        self.setData({
          err_tip: '获取服务详情失败',
          err_icon: 'nogoods',
          isShowDefault: true,
        })
      }
    } catch (err) {
      console.error('服务详情-getServiceDetail', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
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

  /********************加购物车**********************/
  async addGoods(e) {
    let self = this
    // 判断用户身份
    var res = await this.getUserRegister()
    if (!res) {
      return
    }
    let params = {
      type: 2,
      product_id: this.data.goodsInfo.spu_id,
      quantity: this.data.quantity,
      unit_price: this.data.goodsInfo.goods_price * 100,
    }
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
          title: '添加服务失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('服务详情-addGoods', err)
    }
  },

  /********************立即下单**********************/
  async createOrder(e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if (!res) {
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let listItem = {
      image_url: this.data.goodsInfo.goods_imgs[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.goodsInfo.goods_price * 100,
      category_id: this.data.goodsInfo.category_id,       // 获取可使用优惠券所需参数
      biz_product_id: this.data.goodsInfo.product_id,     // 获取可使用优惠券所需参数
    }
    let params = {
      payment_channel: 1,
      total_amount: this.data.goodsInfo.goods_price * 100 * this.data.quantity,
      final_amount: this.data.goodsInfo.goods_price * 100 * this.data.quantity,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        quantity: this.data.quantity,
        unit_price: this.data.goodsInfo.goods_price * 100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 2
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
    let url = 'pages/mall/serviceDetail/serviceDetail?spu_id=' + this.data.spu_id + '&share=1'
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
    this.setData({
      isShowCoupon: false
    })
  },

  /********************生命周期函数--监听页面加载**********************/
  async onLoad(option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    let pages = getCurrentPages();
    this.setData({
      spu_id: option.spu_id,
      showHome: parseInt(option.share) === 1 ? true : false,
      go_type: option.go_type ? option.go_type : null,
    })
    if (pages.length === 1) {
      this.setData({
        showHome: true
      })
    }
    // 判断是否判断过注册
    if (globalData.is_registered === 2) {
      await isRegistered()
    }
  },

  async onShow() {
    // 进入页面的时间
    let pages = getCurrentPages();
    console.log(pages)
    this.setData({
      enter_page_date: new Date() / 1
    })
    this.getServiceDetail()
  },
});
