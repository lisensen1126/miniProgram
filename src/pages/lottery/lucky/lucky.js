// 创建页面实例对象
import {doLottery, doShare, getLotteryCoupons, getLotteryList} from '@/libs/modules/lottery'

const {showMessage, globalData, isRegistered } = getApp()

Page({
  data: {
    dialFlag: true, // 转盘背景灯光
    btnUP: false, // 按钮按下状态
    giftBarFlag: false, // 是否弹出获取卡券面板
    fastRotate: 100, // 高速旋转速度
    index: 0, // 匀加速index
    current: null, // 当前选中的礼券
    target: 0, // 目标礼券
    speed: 120, // 加速度
    luckNum: 0, // 可用抽奖次数
    canLottery: true, // 是否可抽奖
    reLottery: true, // 能否点击抽奖
    activity_id: 0, // 活动id
    coupons: [], // 奖品列表初始化
    gift: '', // 被抽中的奖品初始化
    records: [], // 中奖名单初始化
    animationData: {},
    animationDataB: {},
    rotateOrder: [0, 1, 2, 3, 4, 5], // 转盘旋转顺序
    recordsA: false,
    hasUserProfile: false, // 是否填写用户信息
    sharePage: false,
    isLotterying: false, // 是否正在请求抽奖接口
  },
  // 抽奖转盘高速转动动画
  rotateFast () {
    let self = this
    let rotateNum = 0
    let index = 0
    let coupons = self.data.coupons
    let rotate = self.data.rotateOrder
    let tempTimer = setInterval(function () {
      for (let i = 0, len = coupons.length; i < len; i++) {
        coupons[i].check = 0
      }
      let coupon = coupons[rotate[index]]
      coupon.check = 1
      self.setData({coupons: coupons})
      if (rotateNum >= 2) {
        clearInterval(tempTimer)
        self.rotateLow(120)
      }
      if (index === 5) {
        index = 0
        rotateNum += 1
      } else {
        index++
      }
    }, self.data.fastRotate)
  },
  // 抽奖转盘初始转动动画
  rotateInit (speed) {
    let self = this
    let speeds = speed
    let coupons = self.data.coupons
    let rotate = self.data.rotateOrder
    let tempTimer = setInterval(function () {
      for (let i = 0, len = coupons.length; i < len; i++) {
        coupons[i].check = 0
      }
      let coupon = coupons[rotate[self.data.index]]
      coupon.check = 1
      self.setData({coupons: coupons})
      if (self.data.index === 5) {
        // index = 0
        clearInterval(tempTimer)
        self.rotateFast()
      } else {
        clearInterval(tempTimer)
        speeds += -30
        self.setData({index: self.data.index + 1})
        self.rotateInit(speeds)
      }
    }, speeds)
  },
  // 抽奖转盘减速转动动画
  rotateLow (speed) {
    let self = this
    let index = 0
    let speeds = speed
    let coupons = self.data.coupons
    let rotate = self.data.rotateOrder
    let tempTimer = setInterval(function () {
      for (let i = 0, len = coupons.length; i < len; i++) {
        coupons[i].check = 0
      }
      let coupon = coupons[rotate[index]]
      coupon.check = 1
      self.data.current = coupon.id
      // self.data.current = 2//coupon.id
      self.setData({coupons: coupons})
      if (speeds > 260 && (self.data.target === self.data.current)) {
        clearInterval(tempTimer)
        setTimeout(function () {
          for (let i = 0, len = coupons.length; i < len; i++) {
            coupons[i].check = 0
          }
          self.setData({coupons: coupons})
          self.data.reLottery = true
          // self.setData({reLottery: true})
          self.setData({giftBarFlag: true})
          self.data.speed = 120
          // self.setData({speed: 120})
          self.setData({index: 0})
          self.data.current = null
          // self.setData({current: null})
          self.getLotteryList()
        }, 600)
        return
      }
      if (index === 5) {
        index = 0
        speeds += self.data.speed
        self.data.speed += 20
        clearInterval(tempTimer)
        self.rotateLow(speeds)
      } else {
        index++
      }
    }, speeds)
  },
  // 按下抽奖
  async start () {
    let self = this
    // 写入storage
    let formUrl = `/pages/lottery/lucky/lucky?activity_id=${self.data.activity_id}&share=1`
    wx.setStorageSync('lottery', true)
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    // 已注册
    if (self.data.reLottery) {
      self.data.btnUP = !self.data.btnUP
      // self.setData({btnUP: !self.data.btnUP})
      self.lottery()
    }
  },
  // 抽奖弹起
  end () {
    let self = this
    setTimeout(function () {
      self.data.btnUP = !self.data.btnUP
      // self.setData({btnUP: !self.data.btnUP})
    }, 300)
  },
  // 转盘闪烁灯
  flicker() {
    let self = this
    self.setData({dialFlag: !self.data.dialFlag})
  },
  // 转盘闪烁开始 || 结束
  filckerControl(flag) {
    let self = this
    let start = setInterval(function () {
        self.flicker()
    }, 200)
    if (flag) {
        clearInterval(start)
    }
  },  
  // 关闭礼品获取面板
  close () {
    let self = this
    self.setData({giftBarFlag: false})
  },
  // 跳转抽奖说明页面
  goHelp (e) {
    wx.navigateTo({
      url: '/pages/lottery/luckyHelp/luckyHelp?' + 'activity_id=' + this.data.activity_id + '&share=' + (this.data.sharePage ? 1 : 0),
    })
  },
  // 跳转优惠券列表
  lookLottery (e) {
    wx.navigateTo({
      url: '/pages/coupon/my/myCoupon',
    })
  },
  // 获取礼券列表
  async getCoupons () {
    let self = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    let res = await getLotteryCoupons(self.data.activity_id)
    // 活动不存在或已下架
    if (!(res.data) || res.code === 4004 || res.code === 1001 || res.code === 1015) {
      wx.redirectTo({
        url: '/pages/lottery/defaultPage/defaultPage?code=' + res.code + '&share=' + (this.data.sharePage ? 1 : 0),
      })
      return
    }
    if (res.statusCode === 200 && res.code === 0) {
      res.data.lottery_item.length = 6
      for (let i = 0, len = res.data.lottery_item.length; i < len; i++) {
        res.data.lottery_item[i].check = 0
      }
      // res.data.lottery_item.splice(res.data.lottery_item.length / 2, 0, { id: -1, check: 0, name: '开始' })
      self.setData({
        coupons: res.data.lottery_item,
        luckNum: res.data.lottery_count,
        isRegister: res.data.lottery_count, // 这个是为了分享回调的是否注册判断，存值，-1代表未注册
        share_nums: res.data.share_nums, // 活动创建是否勾选了分享送一次机会，0：已勾选，1：已勾选
        user_share: res.data.user_share, // 用户是否分享过这个活动，0：未分享，1：已分享
      })
      if (res.data.lottery_count === 0) {
        self.setData({canLottery: false})
      } else if (res.data.lottery_count === -1) { // -1：未注册，置为true,目的让用户去点击抽奖，登录
        self.setData({canLottery: true})
        self.setData({luckNum: 1})
      }
      self.getLotteryList()
    } else {
      // 活动不存在或已下架
      if (res.code === 4004 || res.code === 1001) {
        wx.redirectTo({
          url: '/pages/lottery/defaultPage/defaultPage?code=' + res.code + '&share=' + (this.data.sharePage ? 1 : 0),
        })
        return
      }
      showMessage({
        title: '你的网络好像罢工了',
        content: '我不喜欢网络罢工，快去检查下吧',
      })
    }
    wx.hideLoading()
  },
  // 抽奖
  async lottery () {
    let self = this
    let resultTime = false
    if (self.data.isLotterying === true) {
      return false
    }
    self.data.isLotterying = true
    // self.setData({
    //   isLotterying: true,
    // })
    let resultTimeFun = setTimeout(() => {
      showMessage({
        title: '你的网络好像罢工了',
        content: '我不喜欢网络罢工，快去检查下吧',
        resolve: function () {
          resultTime = true
          self.data.isLotterying = false
          // self.setData({
          //   isLotterying: false,
          // })
        },
      })
    }, 11000)
    let res = await doLottery(self.data.activity_id)
    if (res.statusCode === 200 && res.code === 0) {
      clearTimeout(resultTimeFun)
      self.rotateInit(300)
      for (let i = 0, len = self.data.coupons.length; i < len; i++) {
        if (self.data.coupons[i].id === res.data.id) {
          self.setData({ gift: self.data.coupons[i] })
        }
      }
      self.setData({luckNum: res.data.count})
      self.setData({target: res.data.id})
      self.data.reLottery = false
      // self.setData({reLottery: false})
      if (self.data.luckNum <= 0) {
        self.setData({canLottery: false})
      } else {
        self.setData({canLottery: true})
      }
      self.data.isLotterying = false
      // self.setData({
      //   isLotterying: false,
      // })
    } else {
      clearTimeout(resultTimeFun)
      if (resultTime) {
        showMessage({
          title: '你的网络好像罢工了',
          content: '我不喜欢网络罢工，快去检查下吧',
        })
      } else {
        showMessage({
          title: '抽奖失败',
          content: `${res.message}`,
        })
      }
      self.data.isLotterying = false
      // self.setData({
      //   isLotterying: false,
      // })
    }
  },
  // 再次抽奖
  lotteryAgain () {
    let self = this
    self.close()
    if (self.data.luckNum > 0) {
      setTimeout(function () {
        self.start()
      }, 0)
    }
  },
  // 获取中奖名单
  async getLotteryList () {
    let self = this
    let res = await getLotteryList(self.data.activity_id)
    if (res.statusCode === 200 && res.code === 0) {
      // 页面设置8条数据以上，轮播启动，如果列表数量少于8，名单显示样式有问题，所以要加上空对象，凑够8个
      if (res.data && res.data.length > 0 && res.data.length < 8) {
        let length = res.data.length
        for (let i = length; i < 8; i++) {
          res.data[i] = {}
        }
      }
      if (res.data) {
        self.setData({records: res.data})
      }
    } else {
      showMessage({
        title: '获取中奖名单列表失败',
        content: `${res.message}`,
      })
    }
  },
  // 分享 回调
  async startShare () {
    let self = this
    let res = await doShare(self.data.activity_id)
    self.setData({
      luckNum: res.count,
    })
    if (self.data.share_nums === 1 && self.data.user_share === 1 && self.data.isRegister != -1) {
      showMessage({
        title: '已分享',
        content: '你在本次活动已获得过一次抽奖机会！',
      })
    } else {
      wx.showToast({
        title: '分享成功',
        icon: 'none',
        duration: 500,
        mask: true,
      })
    }
    if (self.data.count <= 0) {
      self.setData({canLottery: false})
    } else {
      self.setData({canLottery: true})
    }
  },
  // 分享
  onShareAppMessage () {
    let self = this
    if (!this.data.id) {
      // todo 返回默认分享信息，比如小程序首页
    }
    self.startShare()
    let url = '/pages/lottery/lucky/lucky?share=1&activity_id='+ self.data.activity_id
    // 有门店id,则分享带上门店id
		let current_store_id = wx.getStorageSync('current_store_id')
		if (current_store_id) {
			url = url + '&current_store_id=' + current_store_id
    }
    // 分享带上用户id,分享参数上报
    if (globalData.current_customer_id) {
      url = url + '&share_from_id=' + globalData.current_customer_id
    }
		// 分享带上门店名称,用参数上报
		if (globalData.ep_store_name) {
			url = url + '&current_store_name=' + globalData.ep_store_name
		}     
    return {
      title: '快来参与抽奖吧！',
      path: url,
    }
  },
  async onLoad (option) {
    wx.hideShareMenu()
    let self = this
    this.setData({
      topbarHeight: globalData.topbarHeight, // 获取自定义导航栏高度，修改页面顶部的样式
    }) 
    if (parseInt(option.share) === 1) {
      self.setData({sharePage: true})
    }
    if (globalData.is_registered === 2) {
      await isRegistered()
    }
    self.data.activity_id = parseInt(option.activity_id)
  },
  async onShow () {
    var self = this
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间，上报用
    })     
    // 跑马灯控制方法
    self.filckerControl()
    // 获取优惠券详情
    self.getCoupons()
  },
})
