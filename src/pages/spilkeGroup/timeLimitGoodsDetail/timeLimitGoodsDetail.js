import { getSpikeGoodsDetailApi, getSpikeGoodsSkuApi } from '@/libs/modules/spike'
// 获取全局应用程序实例对象
const {showMessage, isRegistered, globalData, countDown, queryURL, getAccessId} = getApp()
import {getParamsApi,
  //  visitorStatisticsApi
  } from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
import queryScene from '../../../utils/queryScene';

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
    spu_id: 0,
    // 选择的sku_id
    sku_id: 0,
    // 选择的sku项
    skuItem: {
      sku_price: 0
    },
    // 是否渲染数据
    pageShow: false,
    showHome: false,
    // sku浮层类型，默认1
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
    go_type: null, // 跳转进入类型，首页进入=index和门店进入=store
    // 秒杀
    button_copy: true,// 控制下单按钮的显示（确定-立即下单）
    count_down: true, // 倒计时控制商品是否抢光
    seckill_id: '', //活动场次id
    num_limit: 4,     // 限购数量
    isOpen: 0, // 活动状态
    end_time: '', // 据优惠结束/开始时间
    seckill_time_line: [], // 倒计时时间
    seckill_time_line_day: 0, // 倒计时天数
    inventory_total: 0, // 总库存
    immediately: false, // 下单的展示
    timer: '',  // 倒计时值
    is_payment: false, // 防止多次点击立即下单的flag
    scene: true,
    go_share: false,
    from_type: 0, // 海报进入, 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
    from_id: 0, // 海报进入, 来源id
  },
  // 生命周期函数--监听页面加载
  async onLoad(option) {
    // TODO: onLoad
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      if (scene.indexOf('?') !== -1) {
        let obj = queryURL(scene)
        if (obj.s) wx.setStorageSync('current_store_id', obj.s)
        await this.getParams(obj.o)
      }
    } else {
      let pages = getCurrentPages();
      this.setData({
        topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
        showHome: parseInt(option.share) === 1 ? true : false,
      })
      this.data.scene = false
      this.data.spu_id = parseInt(option.spu_id)
      this.data.sku_id = parseInt(option.sku_id)
      this.data.go_type = option.go_type?option.go_type:''
      this.data.seckill_id = parseInt(option.seckill_id)
      // 没有scene值，则为普通方式进入，统计访问量
      let params = {
        from_id: this.data.seckill_id,
        from_type: 0,
        scene: {
          seckill_id: this.data.seckill_id,
        }
      }
      getAccessId(params)
      // 初始化全局sku
      globalData.sku_default_Item = null
      if (pages.length === 1) {
        this.setData({
          showHome: true
        })
      }
    }
    // 判断是否判断过注册
    if (globalData.is_registered === 2){
      await isRegistered()
    }
    // 记录二维码追踪状态放在此处是需要判断是否注册过才可以请求api
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      if (scene.includes(',')) {
        // scene包含,需要解析出来qr_code_rid通过getparams方法拿到seckill_id,再去获取access_id
        let obj = queryScene(scene)
        if (obj.scene.store_id) wx.setStorageSync('current_store_id', obj.scene.store_id)
        if (obj.scene.qr_code_rid) {
          await this.getParams(obj.scene.qr_code_rid, obj)
          // 如果传入此对象，则再获取accessid
          obj.scene.seckill_id = this.data.seckill_id
          getAccessId(obj)
        }
      }
    }
    // 访客统计
    // this.visitorStatistics()
  },

  async onShow() {
    if (this.data.seckill_id) {
      this.setData({
        enter_page_date: new Date() / 1, // 进入页面的时间
        immediately: false,
      })
      this.data.is_payment = false
      // 判断是否存在全局sku,存在sku则默认选中该sku
      let global_sku_item = globalData.sku_default_Item
      if (global_sku_item && global_sku_item.sku_id) {
        this.data.sku_id = global_sku_item.sku_id
      }
      this.setData({
        cartCover: false,
      })
      this.getGoodsDetail()
    }
  },
  // formid 收集
  sendFormId,
  // 显示分享弹框
  goShare () {
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
      seckill_id: self.data.seckill_id,
      name: self.data.goodsInfo.goods_name + self.data.skuInfo,
      origin_price: self.data.skuItem.sku_price,
      price: self.data.skuItem.limit_price,
      image_url: self.data.skuItem.sku_pics[0],
    }
    // console.log(info, 'XXXXX')
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=2&seckill=1',
    })
  },
  // 倒计时
  getTimeLimit () {
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('timeLimitGoodsDetail') === -1){
      return false
    }
    let self = this
    if(self.data.end_time>0){
      countDown(self.data.end_time)
      let left_time = countDown(self.data.end_time)
      let date_array = []
      let date_day = 0
      if (left_time){
        date_array = left_time.split(":")
        if (date_array[0].indexOf('天') != -1){
          date_day = date_array[0].split('天')[0]
          date_array[0] = date_array[0].split('天')[1]
        }
      }
      self.setData({
        seckill_time_line: date_array,
        seckill_time_line_day: date_day,
      })
      if(countDown(self.data.end_time) === '00天00:00:00' || countDown(self.data.end_time) === '00:00:00') {
        if (self.data.isOpen === 2) {
          self.setData({
            count_down: false,
          })
          clearTimeout(self.data.timer)
          return false
        } else {
          self.getGoodsDetail()
          self.setData({
            count_down: true,
            immediately: false,
            type: 2
          })
        }
      } 
    } else {
      clearTimeout(self.data.timer)
    }
    self.data.timer = setTimeout(function () {
      self.getTimeLimit()
    },1000)
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
      seckill_id: this.data.seckill_id,
      spu_id: this.data.spu_id,
      sku_id: this.data.sku_id,
    }
    try {
      const {statusCode, data, message, code} = await getSpikeGoodsDetailApi(params)
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
          data.limit_price = (data.limit_price / 100).toFixed(2)
          data.goods_price = (data.goods_price / 100).toFixed(2)
          let skuItem = {
            sku_pics: [data.sku_default_img],
            sku_price: data.goods_price,
            limit_price: data.limit_price,
            contents: [],
            sku_id: self.data.sku_id,
            spu_id: self.data.spu_id
          }
          // 倒计时的状态
          let isOpen = 0
          let nowDate = new Date() / 1000
          if (data.start_time > nowDate) {
            isOpen = 1
          } else if (data.start_time < nowDate && data.end_time > nowDate) {
            isOpen = 2
          } else if (data.end_time < nowDate) {
            isOpen = 3
          }
          // 抢购状态 type=1/2 距离结束时间  type=3 距离开始时间
          let end_time = ''
          if (isOpen === 1) {
            end_time = data.start_time
          } else if (isOpen === 2) {
            end_time = data.end_time
          } else {
            end_time = 0
          }
          self.setData({
            isOpen: isOpen,
            end_time: end_time,
            num_limit: data.limit_number,
            goodsInfo: data,
            skuItem: skuItem,
            skuInfo: data.sku_default,
            sku_default: data.sku_default.split(' ')
          })
          // 获取sku数据
          self.getSkuDetail()
          self.getTimeLimit()         
        } else{
          self.setData({
            isShowDefault: true,
          })
          if (parseInt(code) === 10011022) {
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
      seckill_id: this.data.seckill_id,
      spu_id: this.data.spu_id,
      sku_id: this.data.sku_id,
    }
    try {
      const {statusCode, data, message, code} = await getSpikeGoodsSkuApi(params)
      if (statusCode === 200) {
        if (parseInt(code) === 0) {
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
  
          // 过滤不必要的 sku
          let sku_lib = []
          data.sku_data.forEach(item => {
            if(item.is_enabled == 1) {
              sku_lib.push(item.attribute_item_ids)
            }
            if (parseInt(item.sku_id) === parseInt(self.data.sku_id)) {
              self.setData({
                skuItem: item,
              })
            }
          })
  
          // 匹配默认的sku值
          data.sku_data.forEach(item => {
            item.limit_price = (item.limit_price / 100).toFixed(2)
            item.sku_price = (item.sku_price / 100).toFixed(2)
            if (parseInt(item.sku_id) === parseInt(self.data.skuItem.sku_id)) {
              self.setData({
                skuItem: item,
                immediately: true
              })
            }
          })
          goodsInfo.sku_data = data.sku_data
          self.setData({
            goodsInfo: goodsInfo,
            sku_lib_all: sku_lib,
          })
          this.formatSkuLib(sku_lib)
        }
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

  // 图片预览
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

  /********************选取规格浮层**********************/
  /*******
   * @sku浮层开关
   * place 判断是从立即下单进来或是选规格进入
   * button_copy 判断显示确定还是立即下单字段
   */
  chooseSku (e) {
    if(parseInt(e.currentTarget.dataset.place) === 1) {
      this.setData({
        skuCoverType: e.currentTarget.dataset.type?e.currentTarget.dataset.type:1,
        cartCover: !this.data.cartCover,
        button_copy: false
      })
    } else {
      this.setData({
        skuCoverType: e.currentTarget.dataset.type?e.currentTarget.dataset.type:1,
        cartCover: !this.data.cartCover,
        button_copy: true
      })
    }
    this.initAttr()
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

  // 修改商品、服务数量
  changeItemNum(e) {
    let _num_limit = this.data.num_limit // 限制数量
    if(_num_limit !== 0){
      if (e.currentTarget.dataset.number < 0 && this.data.quantity <= 1) {
        this.setData({
          quantity: 1,
        })
        return false
      }
      this.setData({
        quantity: this.data.quantity + parseInt(e.currentTarget.dataset.number),
      })
      if (this.data.quantity >= _num_limit) {
        this.setData({
          quantity: _num_limit,
        })
        wx.showToast({
          title: '限购'+_num_limit+'件',
          icon: 'none',
          duration: 2000
        })
        return false
      }
    } else {
      if (e.currentTarget.dataset.number<0 && this.data.quantity<=1) {
        this.setData({
          quantity: 1,
        })
        return false
      }
      this.setData({
        quantity: this.data.quantity+parseInt(e.currentTarget.dataset.number),
      })
    }
  },
  // 关闭弹层
  closeCartCover() {
    this.setData({
      cartCover: !this.data.cartCover
    })
  },

  // 立即下单
  async createOrder(e) {
    // console.log('防止多次进入立即下单之前')
    // 防止多次进入立即下单
    if (this.data.is_payment) {
      return false
    } else {
      this.data.is_payment = true
      setTimeout(() => {
        this.data.is_payment = false
      }, 600)
    }

    // console.log('判断用户身份之前')
    // 判断用户身份
    var res = await this.getUserRegister()
    // console.log('判断用户身份之后', this.data.show_sku_err)
    if(!res || this.data.show_sku_err){
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
      unit_price: this.data.skuItem.limit_price*100,
      sku_detail: this.data.skuInfo,
    }
    let params = {
      offered: 1, // 区分拼团-秒杀的字段 秒杀1-拼团2
      activity_id: this.data.seckill_id,
      payment_channel: 1,
      total_amount: this.data.skuItem.limit_price * 100 * this.data.quantity,
      final_amount: this.data.skuItem.limit_price * 100 * this.data.quantity,
      original_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
      type: 1,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        sku_id: this.data.skuItem.sku_id,
        quantity: this.data.quantity,
        unit_price: this.data.skuItem.limit_price*100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 1
      }],
      from_type: this.data.from_type, // 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
      from_id: this.data.from_id, // 来源id
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    clearTimeout(this.data.timer)
    // 确认订单
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
          showHome: true, 
        })
        this.data.from_type = option.from_type // 海报进入, 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
        this.data.from_id = option.from_id // 海报进入, 来源id
        this.data.spu_id = option.spu_id - 0
        this.data.sku_id = option.sku_id - 0
        this.data.go_type = null
        this.data.seckill_id = option.seckill_id - 0
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
  },
  // 页面分享设置
  onShareAppMessage() {
    let self = this
    let url = 'pages/spilkeGroup/timeLimitGoodsDetail/timeLimitGoodsDetail?spu_id='+this.data.spu_id+'&sku_id='+this.data.skuItem.sku_id+'&seckill_id='+this.data.seckill_id+'&share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    return {
      title: `限时价${self.data.goodsInfo.limit_price}元，“${self.data.goodsInfo.goods_name}”快来抢！`,
      path: url,
      success: function() {
        // self.shareHasGift()
      }
    };
  },

  /**
   * 记录访客访问详情及来源
   */
  // visitorStatistics () {
  //   let params = {
  //     from_type: this.data.from_type, // 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
  //     from_id: this.data.from_id, // 来源id
  //     item_type: 1, //关联项目类型 0-无 1-秒杀
  //     item_id: this.data.seckill_id, //关联项目id
  //     customer_id: globalData.userInfo.customer_id || 0, //用户id
  //   }
  //   // 统计无需理会回调
  //   visitorStatisticsApi(params)
  // }
});
