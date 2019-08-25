import {getSpikeServiceDetailApi} from '@/libs/modules/spike'

// 获取全局应用程序实例对象
const {showMessage, isRegistered, globalData, countDown, queryURL, getAccessId } = getApp()
import { getParamsApi,
  //  visitorStatisticsApi
  } from '@/libs/modules/common'
import { sendFormId } from '@/utils/formid'
import queryScene from '../../../utils/queryScene';
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    goodsInfo: {}, // 服务详情
    quantity: 1, // 购买数量
    limit_number: 0, // 限制数量
    pageShow: false,
    isShowCoupon: false,
    showHome: false,
    // 是否展示缺省页面
    isShowDefault: false,
    err_tip: '获取服务详情失败', // 缺省文案
    err_icon: 'nosearch', // 缺省icon
    go_type: null, // 跳转进入类型，首页进入=index和门店进入=store
    // 秒杀
    count_down: true, // 倒计时控制商品是否抢光
    seckill_id: "", // 秒杀id
    isOpen: 0, // 活动状态
    end_time: '', // 据优惠结束/开始时间
    seckill_time_line: [], // 倒计时时间
    seckill_time_line_day: 0, // 倒计时天数
    inventory_total: 0, // 总库存
    timer: '',  // 倒计时值
    immediately: false, // 控制下单的显隐
    is_payment: false, // 防止多次点击立即下单的flag
    scene: true,
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
      let pages = getCurrentPages();
      this.setData({
        topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
        spu_id: parseInt(option.spu_id),
        sku_id: parseInt(option.sku_id),
        showHome: parseInt(option.share) === 1 ? true : false,
      })
      this.data.go_type = option.go_type ? option.go_type : null
      this.data.seckill_id = parseInt(option.seckill_id)
      this.data.scene = false
      // 没有scene值，则为普通方式进入，统计访问量
      let params = {
        from_id: this.data.seckill_id,
        from_type: 0,
        is_cache: false,
        scene: {
          seckill_id: this.data.seckill_id,
        }
      }
      getAccessId(params)
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
    // 记录访客访问详情及来源
    // this.visitorStatistics()
  },
  async onShow() {
    if (this.data.seckill_id) {
      this.setData({
        enter_page_date: new Date() / 1, // 进入页面的时间
      })
      this.data.immediately = false
      this.getServiceDetail()
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
      seckill_id: self.data.seckill_id,
      name: self.data.goodsInfo.goods_name,
      origin_price: self.data.goodsInfo.goods_price,
      price: self.data.goodsInfo.limit_price,
      image_url: self.data.goodsInfo.goods_imgs[0],
    }
    wx.setStorageSync('poster', info)
    wx.navigateTo({
      url: '/pages/poster/poster?type=1&seckill=1',
    })
  },
  // formid 收集
  sendFormId,
  // 倒计时
  getTimeLimit () {
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('timeLimitServiceDetail') === -1){
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
          self.getServiceDetail()
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

  // 服务详情
  async getServiceDetail () {
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
      seckill_id: this.data.seckill_id
    }
    try {
      const {statusCode, data, message, code} = await getSpikeServiceDetailApi(params)
      wx.hideLoading()
      let err_code_arr = [30306, 10011021, 10011022, 10011023]
      self.setData({
        pageShow: true
      })
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
          data.limit_price = (data.limit_price/100).toFixed(2)
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
          // 展示页面数据
          self.setData({
            end_time: end_time,
            isOpen: isOpen,
            is_loading: false,
            goodsInfo: data,
            limit_number: data.limit_number,
            pageShow: true
          })
          self.getTimeLimit()         
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
      console.error('服务详情-getServiceDetail:', err)
    }
    wx.hideLoading()
    this.setData({
      is_loading: false,
    })
  },

  // 修改商品、服务数量
  changeItemNum(e) {
    let _limit_number = this.data.limit_number // 限制数量
    if(_limit_number !== 0){
      if (e.currentTarget.dataset.number < 0 && this.data.quantity <= 1) {
        this.setData({
          quantity: 1,
        })
        return false
      }
      this.setData({
        quantity: this.data.quantity + parseInt(e.currentTarget.dataset.number),
      })
      // 超出限购，toast提示
      if (this.data.quantity > _limit_number) {
        wx.showToast({
          title: '限购'+_limit_number+'件',
          icon: 'none',
          duration: 2000
        })
      }

      if (this.data.quantity >= _limit_number) {
        this.setData({
          quantity: _limit_number,
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

  // 立即下单
  async createOrder(e) {
    // 防止多次进入立即下单
    if (this.data.is_payment) {
      return false
    } else {
      this.data.is_payment = true
      setTimeout(() => {
        this.data.is_payment = false
      }, 600)
    }
    
    // 判断用户身份
    var res = await this.getUserRegister()
    if(!res){
      return
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let listItem = {
      image_url: this.data.goodsInfo.goods_imgs[0],
      item_title: this.data.goodsInfo.goods_name,
      unit_price: this.data.goodsInfo.limit_price*100
    }
    let params = {
      offered: 1, // 区分拼团-秒杀的字段 秒杀1-拼团2
      activity_id: this.data.seckill_id,
      payment_channel: 1,
      total_amount: this.data.goodsInfo.limit_price * 100 * this.data.quantity,
      final_amount: this.data.goodsInfo.limit_price * 100 * this.data.quantity,
      original_amount: this.data.goodsInfo.goods_price * 100 * this.data.quantity,
      type: 2,
      item: [{
        item_id: this.data.goodsInfo.spu_id,
        quantity: this.data.quantity,
        unit_price: this.data.goodsInfo.limit_price*100,
        listItem: listItem,
        category_id: this.data.goodsInfo.category_parent_ids,
        type: 2
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

  // 页面分享设置
  onShareAppMessage() {
    let self = this
    let url = 'pages/spilkeGroup/timeLimitServiceDetail/timeLimitServiceDetail?spu_id='+this.data.spu_id+'&seckill_id='+this.data.seckill_id+'&share=1'
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
  // 关闭分享有礼
  couponCancel(params) {
    this.data.isShowCoupon = false
  },
  async getParams (id, obj) {
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
          sku_id: null,
          showHome: true,
        })
        this.data.go_type = null
        this.data.seckill_id = option.seckill_id - 0
        this.data.from_type = option.from_type
        this.data.from_id = option.from_id
        this.onShow()
      }
    } catch (err) {
      console.error('请求参数-getParams:', err)
    }
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
