import {
  getCardGoodsList
} from '@/libs/modules/mycard'
import {
  getSpikeCardDetailApi
} from '@/libs/modules/spike'
import { 
  getParamsApi, 
  // visitorStatisticsApi
} from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
// 解码二维码scene
import queryScene from '@/utils/queryScene'
const {
	showMessage,
  isRegistered,
  globalData,
  countDown,
  queryURL,
  getAccessId,
} = getApp()
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
    info: {},                 // 卡详情
    card_id: null,            // 卡ID
    seckill_id: null,         // 秒杀活动ID
    list: [],                 // 指定商品列表
    page_show: false,         // 页面渲染
    activation_length: 0,     // 免激活项目数量
    is_show_default: false,   // 是否展示缺省
    isOpen: 0,                // 活动状态
    count_down: true,         // 倒计时控制商品是否抢光
    seckill_time_line: [],    // 倒计时时间
    seckill_time_line_day: 0, // 倒计时天数
    end_time: '',             // 结束时间
    immediately: false,       // 控制下单的显隐
    is_payment: false,        // 是否下单中
    go_share: false,
    from_type: 0, // 海报进入, 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
    from_id: 0, // 海报进入, 来源id
  },

  // 生命周期函数--监听页面加载
  async onLoad(option) {
    if (option.scene) {
      const scene = decodeURIComponent(option.scene)
      if (scene.indexOf('?') !== -1) {
        let obj = queryURL(scene)
        if (obj.s) wx.setStorageSync('current_store_id', obj.s)
        await this.getParams(obj.o)
      }
      
    } else {
      this.setData({
        topbarHeight: globalData.topbarHeight
      })
      this.data.card_id = parseInt(option.card_id)
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
      let pages = getCurrentPages();
      if (pages.length === 1) {
        this.setData({
          showHome: true
        })
      }
    }
    // 记录访客访问详情及来源
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
    // this.visitorStatistics()
  },
  onShow() {
    if (this.data.seckill_id) {
      this.getCardDetail()
      this.getDataInfo()
    }
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
        this.data.card_id = option.card_id - 0
        this.data.seckill_id = option.seckill_id - 0
        this.data.from_type = option.from_type, // 海报进入, 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
        this.data.from_id = option.from_id, // 海报进入, 来源id
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
  },
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
      id: self.data.card_id,
      name: self.data.info.name,
      price: self.data.info.mini_price,
      origin_price: self.data.info.origin_price,
      image_url: self.data.info.image_url,
      seckill_id: self.data.seckill_id,
    }
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=5&seckill=1',
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

  // formid 收集
  sendFormId,
	/**
   * 获取购卡详情
   */ 
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
      } = await getSpikeCardDetailApi({
        spu_id: this.data.card_id,
        seckill_id: this.data.seckill_id,
      })
      if (statusCode === 200) {
				if (code === 0) {
          // 秒杀价
          data.mini_price = (data.mini_price / 100).toFixed(2)
          // 卡售价
          data.price = (data.price / 100).toFixed(2)
          // 门市价
          data.origin_price = (data.origin_price / 100).toFixed(2)
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
          } else {
            end_time = data.end_time
          }
          let activation = 0
          if (data.type === 1) {
            activation = data.list.filter(element => element.type === 2).length
          }
          this.setData({
            info: data,
            isOpen: isOpen,
            activation_length: activation,
            page_show: true,
          })
          this.data.end_time = end_time
          // 启动秒杀的倒计时
          this.getTimeLimit()
				} else{
          this.setData({
            is_show_default: true,
            page_show: true,
            err_tip: '获取购卡详情失败'
          })
        }
      } else {
        showMessage({
          title: '获取购卡详情失败',
          content: `${message}`,
        })
        this.setData({
          page_show: true
        })
      }
    } catch (err) {
      console.error('购卡详情-getCardDetail', err)
      this.setData({
        is_show_default: true,
        page_show: true,
        err_tip: '获取购卡详情失败'
      })
    }
    wx.hideLoading()
  },

  // 获取卡指定商品列表
  async getDataInfo() {

    let params = {
      upkeep_info_id: this.data.card_id
    }

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
      } = await getCardGoodsList(params)
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

  // 倒计时
  getTimeLimit () {
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('timeLimitPurchaseDetail') === -1){
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
            count_down: false
          })
          clearTimeout(self.data.timer)
          return false
        } else {
          self.getCardDetail()
          self.setData({
            count_down: true,
            type: 2
          })
          this.data.immediately = false
        }
      }
    } else {
      clearTimeout(self.data.timer)
    }
    self.data.timer = setTimeout(function () {
      self.getTimeLimit()
    },1000)
  },

  // 立即下单
  async placeOrder(e) {
    // 判断用户身份，未注册跳转注册授权
    var res = await this.getUserRegister()
    if(!res){
      return
    }
    // 防止多次进入立即下单
    if (this.data.is_payment) {
      return false
    } else {
      this.data.is_payment = true
      setTimeout(() => {
        this.data.is_payment = false
      }, 600)
    }
    
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let params = {
      final_amount: this.data.info.mini_price*100,    // 订单总价
      active_price: this.data.info.mini_price,    // 订单总价
      seckill_id: this.data.seckill_id, // 秒杀活动ID
      card_id: this.data.card_id,       // 卡ID
      offered: 1,                       // 类型：秒杀1 拼团2
      info: this.data.info,                    // 订单详情
      from_type: this.data.from_type, // 来源类型 0-无 1-爆款推荐海报,2-活动宣传海报，3-爆款推荐爆炸贴
      from_id: this.data.from_id, // 来源id
    }
    globalData.orderItem = null
    globalData.orderItem = params
    clearTimeout(this.data.timer)
    
    wx.navigateTo({
			url: `/pages/spilkeGroup/purchaseOrder/purchaseOrder`
    })
  },

  // 跳转指定商品列表
  productMore() {
    wx.navigateTo({
      url: `/pages/card/relationGoods/relationGoods?id=${this.data.card_id}&type=1`
    })
  },

  // 页面分享设置
  onShareAppMessage() {
    let self = this
    let url = 'pages/spilkeGroup/timeLimitPurchaseDetail/timeLimitPurchaseDetail?card_id='+this.data.card_id+'&seckill_id='+this.data.seckill_id+'&share=1'
    // 有门店id,则分享带上门店id
    let current_store_id = wx.getStorageSync('current_store_id')
    if (current_store_id) {
      url = url + '&current_store_id=' + current_store_id
    }
    return {
      title: `限时价${self.data.info.mini_price}元，“${self.data.info.name}”快来抢！`,
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
  //     customer_id: globalData.userInfo ? globalData.userInfo.customer_id : 0, //用户id
  //   }
  //   // 统计无需理会回调
  //   visitorStatisticsApi(params)
  // }
});