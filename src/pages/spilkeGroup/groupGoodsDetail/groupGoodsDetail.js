import { groupGoodsDetail,groupSkuDetail, groupState, groupJoinData} from '@/libs/modules/shopGroup'
// 获取全局应用程序实例对象
const {showMessage, isRegistered, globalData, queryURL } = getApp()
import {getParamsApi} from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
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
    showHome: false,
    // sku浮层类型，默认1,2底部参团、3单独购买、4自己开团
    skuCoverType:1,
    // 是否展示缺省页面
    isShowDefault: false,
    // sku_lib_all: [], // sku 组合库
    sku_lib: [], // sku 组合库
    // sku_def: [441, 449, 2047, 2055], // 默认的sku 组合
    sku_def: [], // 默认的sku 组合
    sku_err_tip: '', // 非法的sku错误提示
    err_tip: '获取商品详情失败', // 缺省文案
    err_icon: 'nosearch', // 缺省icon
    num_array: ['两', '三', '四', '五'],
    group_product_id: 0, // 拼团商品主键ID
    group_status: 1, // 所参团初始状态 拼团中：1
    is_join: false, //是否已参团
    scene: true,
    go_share: false,
  },
  /**
   * 生命周期函数--监听页面加载
   * @param option 页面传参
   */
  async  onLoad(option) {
    console.log(option, '参数')
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      let obj = queryURL(scene)
      if (obj.s) wx.setStorageSync('current_store_id', obj.s)
      await this.getParams(obj.o)
    } else {
      let pages = getCurrentPages();
      this.setData({
        topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
        spu_id: option.spu_id,
        sku_id: option.sku_id,
        // 拼团商品主键ID
        group_product_id: parseInt(option.group_product_id),
        // 是否展示返回首页按钮
        showHome: parseInt(option.share) === 1 ? true : false,
        scene: false,
      })
      // 初始化全局sku
      globalData.sku_default_Item = null
      if (pages.length === 1) {
        this.setData({
          showHome: true
        })
      }
    }
    if (globalData.is_registered === 2){
      await isRegistered()
    }
  },

  async onShow() {
    if (this.data.group_product_id) {
      // 判断是否存在全局sku,存在sku则默认选中该sku
      let global_sku_item = globalData.sku_default_Item
      if (global_sku_item && global_sku_item.sku_id) {
        this.setData({
          sku_id: global_sku_item.sku_id,
        })
      }
      this.setData({
        enter_page_date: new Date() / 1, // 进入页面的时间
        cartCover: false,
      })
      this.getGoodsDetail()
      // 商品可参与的团
      this.getGroupDetail()
    }
  },
  // formid 收集
  sendFormId,
  // 获取参数
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
          spu_id: option.spu_id - 0,
          sku_id: option.sku_id - 0,
          group_product_id: option.group_product_id - 0,
          showHome: true,
        })
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
  },
  // 显示分享弹框
  goShare () {
    console.log(1111)
    this.setData({
      go_share: true,
    })
  },
  closeShare () {
    this.setData({
      go_share: false,
    })
  },
  // 去海报分享
  goPoster () {
    this.closeShare()
    let self = this
    let info = {
      spu_id: self.data.spu_id,
      sku_id: self.data.skuItem.sku_id,
      group_product_id: self.data.group_product_id,
      name: self.data.goodsInfo.goods_name + self.data.skuInfo,
      origin_price: self.data.skuItem.sku_price,
      price: self.data.skuItem.group_price,
      image_url: self.data.skuItem.sku_pics[0],
      num: self.data.goodsInfo.num
    }
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=2&group=1',
    })
  },
  // 商品详情
  async getGoodsDetail () {
    let self = this
    this.setData({
      is_loading: true,
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
      const {statusCode, data, message, code} = await groupGoodsDetail(params)
      wx.hideLoading()
      if (statusCode === 200) {
        // 渲染页面
        this.setData({
          pageShow: true,
        })
        if(parseInt(code) === 0) {
          // 已下架商品不展示页面，确定返回上一页
          if (parseInt(data.is_sale) === 2) {
            self.setData({
              err_tip: '商品已下架',
              err_icon: 'goodsdown',
              isShowDefault: true,
            })
            return false
          }
          // 格式化商品金额(接口返回的数据单位：分)
          data.goods_price = (data.goods_price/100).toFixed(2)
          data.group_price = (data.group_price/100).toFixed(2)
          let skuItem = {
            sku_pics: [data.sku_default_img],
            sku_price: data.goods_price,
            group_price: data.group_price,
            contents: [],
            sku_id: data.sku_id,
            spu_id: self.data.spu_id
          }
          self.setData({
            goodsInfo: data,
            skuItem: skuItem,
            skuInfo: data.sku_default,
            sku_default: data.sku_default.split(' ')
          })
          // 获取sku数据
          self.getSkuDetail()        
        } else{
          self.setData({
            isShowDefault: true,
          })
          if (parseInt(code) === 10013001) {
            this.setData({
              err_tip: message,
              err_icon: 'nogoods',
            })
          }else if (parseInt(code) === 10011022) {
            this.setData({
              err_tip: '商品已下架',
              err_icon: 'nogoods',
            })
          } else{
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
      console.error('商品详情-getGoodsDetail:', err)
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  // sku详情
  async getSkuDetail () {
    let self = this
    this.setData({
      is_loading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
      sku_id: this.data.sku_id
    }
    try {
      const {statusCode, data, message, code} = await groupSkuDetail(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        let goodsInfo = self.data.goodsInfo
        // 过滤不需要的属性
        goodsInfo.attribute_data = data.attribute_data.map((item, index) => {
          // 组装默认id 如果接口返回 可删除
          item.attribute_items.forEach((attr) => {
            if(attr.is_checkout){
              this.data.sku_def[index] = attr.attribute_item_id
            }
          })
          // 过滤属性
          item.attribute_items = item.attribute_items.filter(attr => {
            return attr.is_optional == 1
          })
          return item
        })

        // 格式sku价格数据
        data.sku_data.forEach(item => {
          item.sku_price = (item.sku_price/100).toFixed(2)
          item.group_price =( item.group_price/100).toFixed(2)
        })

        // 过滤不必要的 sku
        let sku_lib = []
        data.sku_data.forEach(item => {
          if(item.is_enabled == 1) {
            sku_lib.push(item.attribute_item_ids)
          }
          if (parseInt(item.sku_id) === parseInt(self.data.skuItem.sku_id)) {
            self.setData({
              skuItem: item,
            })
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
      console.error('商品详情-getSkuDetail:', err)
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  /**
   * 格式化 冥集
   * @param {array} lib sku库 二维数组
   */
  formatSkuLib(lib){
    let lib_temp = []
    lib.forEach(arr => {
      let list = [''];
      for(var i = 0, len = arr.length; i<len ; i++ ){
        list.forEach(x => {
          if(!x){
            list.push(x + arr[i])
          } else {
            list.push(x + ',' + arr[i])
          }
        })
      }
      lib_temp.push(...list)
    })
    this.data.sku_lib = Array.from(new Set(lib_temp))
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
        if(item.attribute_item_id == sku_def[index]) {
          checkout_nums += 1
          item.is_checkout = true
          item.is_enabled = 1
        } else {
          item.is_checkout = false
        }

        // 如果已选 不作为
        if(item.is_checkout) return item

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
        if(res) {
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

  /**
   * 图片预览
   * @param {Object} e->event对象
   * **/
  previewImg(e) {
    wx.previewImage({
      urls: e.currentTarget.dataset.imgs,
      current: e.currentTarget.dataset.img
    })
  },

  // 整理sku数据
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
          skuInfo += item+' '
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


  /**
   * sku浮层开关
   * @param {Object} e->event对象
   * **/
  chooseSku (e) {
    this.setData({
      // 开启sku浮层的方式（已选：1、拼团：2、 单人：3、开团：4）
      skuCoverType: e.currentTarget.dataset.type?e.currentTarget.dataset.type:1,
      cartCover: !this.data.cartCover
    })
    this.initAttr()
  },

  /**
   * sku选择属性
   * @param {Object} e->event对象
   * **/
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

    this.data.sku_def = sku_def
    // 格式化属性参数
    this.initAttr()

    // 重置 sku
    this.selectSku()
  },

  /**
   * 修改商品、服务数量
   * @param {Object} e->event对象
   * **/
  changeItemNum(e) {
    if (e.currentTarget.dataset.number<0 && this.data.quantity<=1) {
      this.setData({
        quantity: 1,
      })
      return false
    }
    this.setData({
      quantity: this.data.quantity+parseInt(e.currentTarget.dataset.number),
    })
  },

  // 关闭弹层
  closeCartCover() {
    this.setData({
      skuCoverType: 1,
      cartCover: !this.data.cartCover
    })
  },

  // 获取参团数据
  async getGroupDetail () {
    this.setData({
      is_loading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 拼团商品ID
    let params = {
      group_product_id: this.data.group_product_id
    }
    try{
      const{statusCode, data, code, message} = await groupJoinData(params)
      if(statusCode === 200) {
        if (data != []){
          this.setData({
            group_join_data: data
          })
        }

      }else{
        showMessage({
          title: '获取拼团数据失败',
          content: message,
        })
      }
    }catch(err){
      console.error('商品详情-getGroupDetail:', err)
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  // 判断是否可团
  async isCanJoinGroup (e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res || this.data.show_sku_err){
      return
    }

    this.setData({
      is_loading: true,
      is_join: false, // 是否已经参与该团
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    this.setData({
      group_log_id: this.data.group_join_data.group_log_id
    })
    try{
      const{statusCode, data, code, message} = await groupState({
        group_log_id: this.data.group_join_data.group_log_id
      })

      if (statusCode === 200) {
        if (parseInt(code) === 0){
          // 当前详情展示的团的状态，1可参团，2已拼满，3拼团时间到
          this.setData({
            group_status: data.status
          })
          if(parseInt(data.status) === 1){
            // 参团确认订单
            this.createGroupOrder(this.data.group_join_data.group_log_id)
          }
        } else if (parseInt(code) === 600769){
          this.setData({
            is_join: true
          })
        } else {
          this.setData({
            err_tip: '拼团失败',
            isShowDefault: true,
          })
          showMessage({
            title: '拼团失败',
            content: message,
          })
        }
      }else{
        this.setData({
          err_tip: '拼团失败',
          isShowDefault: true,
        })
      }
    }catch(err){
      showMessage({
        title: '拼团失败',
        content: message,
      })
      if(err.error === "ERROR") {
        console.error('商品详情-isCanJoinGroup:', err)
      }

    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  // 立即下单
  async createOrder(e) {
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res || this.data.show_sku_err){
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let listItem = {
      image_url: this.data.skuItem.sku_pics[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.skuItem.sku_price*100,
      sku_detail: this.data.skuInfo,
      category_id: this.data.goodsInfo.category_id,       // 获取可使用优惠券所需参数
      biz_product_id: this.data.goodsInfo.product_id,     // 获取可使用优惠券所需参数
    }
    let params = {
      payment_channel: 1,
      total_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
      final_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        sku_id: this.data.skuItem.sku_id,
        quantity: this.data.quantity,
        unit_price: this.data.skuItem.sku_price*100,
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

  // 开团、参团立即下单
  async createGroupOrder(group_log_id) {
    // 参团状态group_log_id存在值，开团group_log_id值为空
    let activity_id = 0
    let group_type  = 1
    if (typeof(group_log_id) == 'number'){
      activity_id = group_log_id
      group_type = 2
    } else {
      activity_id = this.data.group_product_id
      this.setData({
        cdp_id: 'spilkeGroup_groupGoodsDetail_open', // 开团按钮id,cdp上报用
      })      
    }
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res || this.data.show_sku_err){
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 接口返回sku_data和attribute_data数据时，更新sku数据
    // if (this.data.goodsInfo.sku_data && this.data.goodsInfo.attribute_data) {
    //   await this.selectSku()
    // }
    let listItem = {
      image_url: this.data.skuItem.sku_pics[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.skuItem.group_price * 100,
      sku_detail: this.data.skuInfo,
    }
    let params = {
      payment_channel: 1,
      total_amount: this.data.skuItem.group_price * 100 * this.data.quantity,
      final_amount: this.data.skuItem.group_price * 100 * this.data.quantity,
      offered: 2,
      // 拼团类型：开团group_type=1、参团group_type=2
      group_type: group_type,
      // 拼团类型：开团 activity_id：拼团商品主键ID、参团 activity_id所参团的group_log_id
      activity_id: activity_id,
      original_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
      type: 1,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        sku_id: this.data.skuItem.sku_id,
        quantity: this.data.quantity,
        unit_price: this.data.skuItem.group_price * 100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 1
      }]
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    // 海报图片
    let poster_info = {
      name: this.data.goodsInfo.goods_name + this.data.skuInfo,
      num: this.data.goodsInfo.num,
      origin_price: this.data.skuItem.sku_price,
      price: this.data.skuItem.group_price,
      image_url: this.data.skuItem.sku_pics[0],
    }
    wx.setStorageSync('poster-info', poster_info)
    // 跳转到确认订单页面
    wx.navigateTo({
      url: `/pages/spilkeGroup/groupSpilkeConfirmOrder/groupSpilkeConfirmOrder`,
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
    let url = 'pages/spilkeGroup/groupGoodsDetail/groupGoodsDetail?spu_id='+this.data.spu_id+'&sku_id='+this.data.skuItem.sku_id+'&share=1'+'&group_product_id='+this.data.group_product_id+'&share=1'
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
      title: `${this.data.goodsInfo.num}人拼仅需${this.data.goodsInfo.group_price}元，${this.data.goodsInfo.goods_name}`,
      path: url,
      success: function() {
        // self.shareHasGift()
      }
    };
  },
});
