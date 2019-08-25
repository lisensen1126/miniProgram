// 获取全局应用程序实例对象
import { groupGoodsDetail, groupCardDetail, groupServiceDetail ,groupSkuDetail, groupState, groupUserDetail, groupIsoCardDetail} from '@/libs/modules/shopGroup'
import { getCardGoodsList} from '@/libs/modules/mycard'
const {showMessage, countDown, isRegistered, globalData, queryURL } = getApp()
import {getParamsApi} from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		spu_id: 0,  //商品ID
    iso: 2,  //是否为镜像 1是、2否（默认）
    quantity: 1, // 服务数量
		group_log_id: 0,  // 拼团ID
		order_no: 0,  //订单编号
    goodsInfo: null, // 详情数据
    list: [], // 养护卡指定商品列表数据
    activation_length: 0,   // 免激活项目数量
    skuItem:{},    // 是否展示缺省页面
    isShowDefault: false,
    // sku_lib_all: [], // sku 组合库
    sku_lib: [], // sku 组合库
    // sku_def: [441, 449, 2047, 2055], // 默认的sku 组合
    sku_def: [], // 默认的sku 组合
    sku_err_tip: '', // 非法的sku错误提示
    show_sku_err: false,
    group_detail: null,
    group_end_time_line: ['00','00','00'], // 倒计时初始化数据
    group_end_time_line_day: 0, // 倒计时初始化数据
    is_loading: false, // 是否请求接口中
    group_status: 1,  // 当前团的状态
    type: 0,  //  类型  商品：1 服务：2
    cartCover: false, // sku浮层开关逻辑
    showCover: false, // 展示（拼团已结束、人员已满）弹窗
    err_tip: '获取详情失败',  // 缺省文案
    err_icon: 'nogoods', // 缺省icon
    page_show: false, //渲染页面
  },
  // 生命周期函数--监听页面加载
  async onLoad(option) {
	  if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      let obj = queryURL(scene)
      if (obj.s) wx.setStorageSync('current_store_id', obj.s)
      await this.getParams(obj.o)
    } else {
      this.setData({
        // 获取自定义导航栏高度，修改页面顶部的样式
        topbarHeight: globalData.topbarHeight,
        // 拼团类型 商品1、服务2、养护卡3
        type: parseInt(option.type),
      })
      this.data.spu_id = parseInt(option.spu_id) // 拼团商品ID
      this.data.iso = option.from_type?1:2 // 分享来源
      this.data.group_log_id = parseInt(option.group_log_id) // 团主键ID
      this.data.order_no = parseInt(option.order_no) // 团主键ID
    }
    // TODO: onLoad
    wx.hideShareMenu()
    // 初始化全局sku
    globalData.sku_default_Item = null
  },

  async onShow() {
    if (this.data.topbarHeight) {
      // 判断是否判断过注册
      if (globalData.is_registered === 2){
        await isRegistered()
      }
      this.setData({
        enter_page_date: new Date() / 1, // 进入页面的时间
        cartCover: false,
        quantity: 1,
        page_show: false
      })
      if(this.data.type === 1){
        this.getGoodsDetail()
      } else if(this.data.type === 2){
        this.getServiceDetail()
      } else if(this.data.type === 3){
        if (this.data.iso === 1){
          this.getIsoCardDetail()
        } else {
          this.getCardDetail()
        }
        this.getDataInfo()
      }
      this.getGroupDetail()
    }
  },
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
          type: option.serve_type - 0,
          showHome: true,
        })
        this.data.spu_id = option.spu_id || option.card_id
        this.data.sku_id = option.sku_id - 0 || ''
        this.data.iso = option.from_type ? 1: 2
        this.data.group_log_id = parseInt(option.group_product_id)
        this.data.order_no = parseInt(option.order_no)
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
  },
  // 商品详情
  async getGoodsDetail () {
    let self = this
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
      sku_id: this.data.sku_id,
      order_no: this.data.order_no,
    }
    try {
      const {statusCode, data, message, code} = await groupGoodsDetail(params)
      if(statusCode === 200) {
        if (code === 0) {
          // 格式化商品金额(接口返回的数据单位：分)
          data.goods_price = data.goods_price/100
          data.group_price = data.group_price/100
          let skuItem = {
            sku_pics: [data.sku_default_img],
            sku_id: data.sku_id,
            sku_price: data.goods_price,
            group_price: data.group_price,
            contents: []
          }
          self.setData({
            goodsInfo: data,
            skuItem: skuItem,
            skuInfo: data.sku_default,
            sku_default: data.sku_default.split(' '),
            page_show: true,
          })
          // 获取sku数据
          self.getSkuDetail()
        } else {
          self.setData({
            err_tip: message,
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }
      }else{
        showMessage({
          title: '获取商品详情失败',
          content: message,
        })
      }
    }catch(err){
      this.setData({
        err_tip: '获取商品详情失败',
        isShowDefault: true,
      })
      if (err.code === 200107) {
        this.setData({
          err_tip: '商品已下架',
          err_icon: 'nodata',
        })
      } else if(err.error === "ERROR") {
        console.error('好友邀你来参团-getGoodsDetail:', err)
      }

    }
    wx.hideLoading()
    this.setData({
      page_show: true,
    })
    this.data.is_loading = false
  },

  // sku详情
  async getSkuDetail () {
    let self = this
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
      sku_id: this.data.goodsInfo.sku_id
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
          item.sku_price = item.sku_price/100
          item.group_price = item.group_price/100
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
      console.error('好友邀你来参团-getSkuDetail:', err)
    }
    wx.hideLoading()
    this.data.is_loading = false
  },


  // 服务详情
  async getServiceDetail () {
    let self = this
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      spu_id: this.data.spu_id,
      order_no: this.data.order_no,
    }
    try {
      const {statusCode, data, message, code} = await groupServiceDetail(params)
      wx.hideLoading()
      if (statusCode === 200) {
        if(parseInt(code) === 0) {
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
          data.goods_price = (data.goods_price/100).toFixed(2)
          data.group_price = (data.group_price/100).toFixed(2)
          // 展示页面数据
          self.setData({
            is_loading: false,
            goodsInfo: data,
            page_show: true
          })
          this.data.is_loading = false
        } else {
          self.setData({
            err_tip: message,
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }
      } else {
        self.setData({
          err_tip: '获取服务详情失败',
          err_icon: 'nogoods',
          isShowDefault: true,
        })
      }
    } catch (err) {
      console.error('好友邀你来参团-getServiceDetail:', err)
    }
    wx.hideLoading()
    this.setData({
      page_show: true,
    })
    this.data.is_loading = false
  },

  // 获取养护卡详情
  async getCardDetail() {
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
      } = await groupCardDetail({
        id: this.data.spu_id,
        order_no: this.data.order_no,
      })
      if (statusCode === 200) {
        if (code === 0) {
          data.price = (data.price / 100).toFixed(2)
          data.origin_price = (data.origin_price / 100).toFixed(2)
          data.group_price = (data.group_price / 100).toFixed(2)
          // 倒计时的状态
          let activation = 0
          if (data.type === 1) {
            activation = data.list.filter(element => element.type === 2).length
          }
          this.setData({
            goodsInfo: data,
            page_show: true,
            activation_length: activation
          })
        } else {
          this.setData({
            err_tip: message,
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }
      } else {
        showMessage({
          title: '获取购卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('拼团邀请-getCardDetail', err)
    }
    this.setData({
      page_show: true,
    })
    wx.hideLoading()
  },

  // 获取镜像养护卡详情
  async getIsoCardDetail() {
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
      } = await groupIsoCardDetail({
        id: this.data.spu_id,
        order_no: this.data.order_no,
      })
      if (statusCode === 200) {
        if (code === 0) {
          data.price = (data.price / 100).toFixed(2)
          data.origin_price = (data.origin_price / 100).toFixed(2)
          data.group_price = (data.group_price / 100).toFixed(2)
          // 倒计时的状态
          let activation = 0
          if (data.type === 1) {
            activation = data.list.filter(element => element.type === 2).length
          }
          this.setData({
            goodsInfo: data,
            page_show: true,
            activation_length: activation
          })
        } else {
          this.setData({
            err_tip: message,
            err_icon: 'nogoods',
            isShowDefault: true,
          })
        }
      } else {
        showMessage({
          title: '获取购卡详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('拼团邀请-getCardDetail', err)
    }
    this.setData({
      page_show: true,
    })
    wx.hideLoading()
  },

  // 获取养护卡指定商品列表
  async getDataInfo() {
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
      } = await getCardGoodsList({
        upkeep_info_id: this.data.spu_id
      })
      if (statusCode === 200) {
        if (code === 0){
          this.setData({
            list: data
          })
        }
      } else {
        showMessage({
          title: '获取养护卡关联商品失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购卡详情-getDataInfo', err)
    }
    wx.hideLoading()
  },

  /************************************页面数据处理的方法********************************************/
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
   * @param  e =>event对象
   * @returns {boolean}
   */
  chooseSku (e) {
    // 商品已经下架后，拼团人数已满、已结束、已经过参团的用户不支持展示sku浮层
    if (this.data.goodsInfo.is_sale == 2 || this.data.group_detail.group_lack_num <= 0 || parseInt(this.data.group_detail.is_join) === 1 || parseInt(this.data.group_detail.group_status) !== 1){
      return false
    }
    // 进入sku浮层类型
    this.setData({
      // sku浮层开关
      cartCover: !this.data.cartCover,
    })
    // 初始化商品数量 = 1
    if(this.data.cartCover){
      this.setData({
        quantity: 1
      })
    }
    // 初始化 sku规格参数
    this.initAttr()
  },

  /**
   * sku选择属性
   * @param e =>event对象
   * @returns {Promise<void>}
   */
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


    this.setData({
      sku_def: sku_def
    })
    // 格式化属性参数
    this.initAttr()

    // 重置 sku
    this.selectSku()
  },

  // 修改商品、服务数量
  changeItemNum(e) {
    if (e.currentTarget.dataset.quantity<0 && this.data.quantity<=1) {
      this.setData({
        quantity: 1,
      })
      return false
    }
    this.setData({
      quantity: this.data.quantity+parseInt(e.currentTarget.dataset.quantity),
    })
  },

  // 关闭弹层
  closeCartCover() {
    // 针对服务类型----已下架，拼团人员已满、已结束、已参团的用户不展示修改数量浮层
    if (this.data.type === 2 && (this.data.goodsInfo.is_sale == 2 || this.data.group_detail.group_lack_num <= 0 || parseInt(this.data.group_detail.is_join) === 1 || parseInt(this.data.group_detail.group_status)!== 1) && !this.data.cartCover){
      return false
    }
    this.setData({
      cartCover: !this.data.cartCover
    })
    //  如果当前团不可拼（已满、时间已到）刷新详情接口，重新获取可参团的数据详情
    if (this.data.group_detail.group_status != 1){
      this.getGroupDetail()
    }
  },

  // 判断是否可团
  async isCanJoinGroup (e) {
    console.log(this.data.goodsInfo)
    console.log(1)
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res || this.data.show_sku_err){
      return
    }
    // 商品、服务已经下架后，拼团人数已满、已结束、已经过参团的用户不支持展示sku浮层
    if (this.data.goodsInfo.is_sale == 2 || this.data.group_detail.group_lack_num <= 0 || parseInt(this.data.group_detail.is_join) === 1 || parseInt(this.data.group_detail.group_status) !== 1){
      return false
    }
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })

    try{
      const{statusCode, data, code, message} = await groupState({
        group_log_id: this.data.group_log_id,
      })

      if(statusCode === 200) {
        if (code === 0){
          // 当前详情展示的团的状态，1可参团，2已拼满，3拼团时间到
          let status = 'group_detail.group_status'
          this.setData({
            [status]: data.status
          })
          if(parseInt(data.status) === 1){

            console.log(2)
            // 参团确认订单
            this.createGroupOrder(e)
          }
          if(parseInt(data.status) > 1){
            this.setData({
              showCover: true
            })
          }
        } else {
          showMessage({
            title: '参团失败',
            content: message,
          })
        }

      } else{
        showMessage({
          title: '拼团失败',
          content: message,
        })
      }
    }catch(err){
      this.setData({
        err_tip: '拼团失败',
        isShowDefault: true,
      })
      if(err.error === "ERROR") {
        console.error('好友邀你来参团-isCanJoinGroup:', err)
      }

    }
    wx.hideLoading()
    this.data.is_loading = false
  },

  // 获取拼团详情
  async getGroupDetail () {
    let self = this
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try{
      const{statusCode, data, code, message} = await groupUserDetail({
        group_log_id: this.data.group_log_id
      })
      if(statusCode === 200) {
        if (code === 0) {
          console.log(data, "拼团数据")
          self.setData({
            group_detail: data,
          })
          // 正在拼团，调用倒计时方法
          if (parseInt(data.group_status) === 1){
            this.getEndTimeLine()
          }
        } else {
          showMessage({
            title: '获取拼团详情失败',
            content: message,
          })
        }
      }else{
        showMessage({
          title: '获取拼团详情失败',
          content: message,
        })
      }
    }catch(err){
      if(err.error === "ERROR") {
        console.error('好友邀你来参团-getGroupDetail:', err)
      }
    }
    wx.hideLoading()
  },

  // 获取结束时间段
  getEndTimeLine () {
    let self = this
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('groupSharePage') === -1){
      return false
    }
    let left_time = countDown(self.data.group_detail.group_end_time)
    let date_array = []
    let date_day = 0
    if (left_time){
      date_array = left_time.split(":")
      if (date_array[0].indexOf('天') != -1){
        date_day = date_array[0].split('天')[0]
        date_array[0] = date_array[0].split('天')[1]
      }
    } else {
      // let group_detail = self.data.group_detail
      // group_detail.group_status = 3
      self.setData({
        // group_detail: group_detail,
        group_end_time_line: ['00', '00', '00'],
        group_end_time_line_day: 0
      })
      return false
    }
    self.setData({
      group_end_time_line: date_array,
      group_end_time_line_day: date_day
    })
    setTimeout(function () {
      self.getEndTimeLine()
    },1000)
  },


  // 立即下单-参团
  async createGroupOrder(e) {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 接口返回sku_data和attribute_data数据时，更新sku数据
    // if (this.data.goodsInfo.sku_data && this.data.goodsInfo.attribute_data) {
    //   await this.selectSku()
    // }
    let listItem = {}
    let params = {}
    if (this.data.goodsInfo.type === 1 && this.data.type === 1){
      // 海报图片
      let poster_info = {
        name: this.data.goodsInfo.goods_name + this.data.skuInfo,
        num: this.data.goodsInfo.num,
        origin_price: this.data.goodsInfo.goods_price,
        price: this.data.skuItem.group_price,
        image_url: this.data.skuItem.sku_pics[0],
      }
      wx.setStorageSync('poster-info', poster_info)
      // 商品
      listItem = {
        type: 1,
        image_url: this.data.skuItem.sku_pics[0],
        item_title: this.data.goodsInfo.goods_name,
        unit_price: this.data.skuItem.group_price*100,
        sku_detail: this.data.skuInfo,
        parent_id: this.data.goodsInfo.category_parent_id
      }
      params = {
        payment_channel: 1,
        // 拼团商品ID
        id: this.data.goodsInfo.id,
        total_amount: this.data.skuItem.group_price * 100 * this.data.quantity,
        final_amount: this.data.skuItem.group_price * 100 * this.data.quantity,
        activity_id: this.data.group_log_id,
        offered: 2,
        // 拼团类型：开团group_type=1、参团group_type=2
        group_type: 2,
        original_amount: this.data.skuItem.sku_price * 100 * this.data.quantity,
        type: 1,
        item: [{
          item_id: this.data.goodsInfo.spu_id,
          sku_id: this.data.skuItem.sku_id,
          quantity: this.data.quantity,
          unit_price: this.data.skuItem.group_price*100,
          listItem: listItem,
          type: 1,
          parent_id: this.data.goodsInfo.category_parent_id
        }],
      }
    } else if (this.data.goodsInfo.type === 2 && this.data.type === 2){
      // 海报图片
      let poster_info = {
        name: this.data.goodsInfo.goods_name,
        num: this.data.goodsInfo.num,
        origin_price: (this.data.goodsInfo.goods_price / 100).toFixed(2),
        price: (this.data.goodsInfo.group_price / 100).toFixed(2),
        image_url: this.data.goodsInfo.goods_imgs[0],
      }
      wx.setStorageSync('poster-info', poster_info)
      // 服务
      listItem = {
        image_url: this.data.goodsInfo.goods_imgs[0],
        item_title: this.data.goodsInfo.goods_name,
        unit_price: this.data.goodsInfo.group_price*100,
        type: 2
      }
      params = {
        payment_channel: 1,
        total_amount: this.data.goodsInfo.group_price*100*this.data.quantity,
        final_amount: this.data.goodsInfo.group_price*100*this.data.quantity,
        offered: 2,
        // 拼团类型：开团group_type=1、参团group_type=2
        group_type: 2,
        // 拼团类型：开团 activity_id：拼团商品主键ID、参团 activity_id所参团的group_log_id
        activity_id: parseInt(this.data.group_log_id),
        original_amount: this.data.goodsInfo.goods_price * 100,
        type: 2,
        item: [{
          item_id: this.data.goodsInfo.spu_id,
          quantity: this.data.quantity,
          unit_price: this.data.goodsInfo.group_price*100,
          listItem: listItem,
          category_id: this.data.goodsInfo.category_parent_ids,
          type: 2
        }]
      }
    } else if (this.data.type >= 3){
      // 海报图片
      let poster_info = {
        name: this.data.goodsInfo.name,
        num: this.data.goodsInfo.group_num,
        origin_price: this.data.goodsInfo.origin_price,
        price: this.data.goodsInfo.group_price,
        image_url: this.data.goodsInfo.image_url,
      }
      wx.setStorageSync('poster-info', poster_info)
      params = {
        final_amount: this.data.goodsInfo.group_price*100,   // 订单总价
        active_price: this.data.goodsInfo.group_price,       // 订单总价
        card_id: this.data.spu_id,                           // 卡ID
        offered: 2,                                          // 类型：秒杀1 拼团2
        group_type: 2,                                       // 拼团类型：开团group_type=1、参团group_type=2
        group_log_id: this.data.group_log_id,                // 参团ID
        info: this.data.goodsInfo                            // 订单详情
      }
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    // 商品、服务
    let url = `/pages/spilkeGroup/groupSpilkeConfirmOrder/groupSpilkeConfirmOrder`
    // 养护卡
    if (this.data.type >= 3){
      url = `/pages/spilkeGroup/purchaseOrder/purchaseOrder`
    }
    // 确认订单
    wx.navigateTo({
      url: url,
    })
  },

  // 判断用户是否授权
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

  // 关闭状态浮层
  closeStatus() {
    // 初始化拼团状态
    this.setData({
      showCover: false
    })
  },

  // 跳转拼团列表
  goGroupList(e) {
    wx.navigateTo({
      url: `/pages/spilkeGroup/groupCategoryList/groupCategoryList`,
    })
  },
  // formid 收集
  sendFormId,
});
