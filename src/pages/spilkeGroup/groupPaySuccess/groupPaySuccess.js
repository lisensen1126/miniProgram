// 获取全局应用程序实例对象
import { groupUserDetail} from '@/libs/modules/shopGroup'
import {OrderpaySuccess} from '@/libs/modules/order'
import {getCouponStateApi} from '@/libs/modules/coupon'
import { sendFormId } from '@/utils/formid'
const {showMessage, countDown, globalData } = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		group_detail: null,// 拼团的详情
    group_end_time_line:['00', '00', '00'],// 拼团结束倒计时
    group_end_time_line_day: 1,// 限时购倒计时天
    order_id: 0,// 订单ID
    order_no: 0,// 订单编号
    group_log_id: 0,// 团的主键ID
		spu_id: 0,// 商品ID
		type: 0,// 只有养护卡时有用
    is_loading: false,//   是否请求接口
    isShowCoupon: false,      // 有礼页面展示
    recommend_coupon: [],     // 推荐的优惠券列表数据
    from_type: '', // 用于区分养护卡是否从订单支付跳转
  },
  // formid 收集
  sendFormId,

  /**
   * 生命周期函数--监听页面加载
   * @param option 页面传参
   */
  onLoad(option) {
    console.log('支付状态', option)
    // TODO: onLoad
    if (option){
      this.setData({
        // 获取自定义导航栏高度，修改页面顶部的样式
        topbarHeight: globalData.topbarHeight,
        // 拼团类型 商品1，服务2 养护卡 3
        type: option.type,
      })
      this.data.from_type = option.from_type || ''
      this.data.card_id = option.card_id // 养护卡ID
      this.data.order_id = option.order_id // 订单ID
      this.data.order_no = option.order_no // 订单编号
      this.data.spu_id = option.spu_id // spu_id
      this.data.sku_id = option.sku_id // sku_id
      this.data.group_log_id = option.group_log_id // 拼团主键ID
    }
  },

  onShow() {
    this.setData({
      enter_page_date: new Date() / 1, // 进入页面的时间
    })
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    // 延时三秒
    setTimeout(async () => {
      this.getOrderDetail()
      this.getGroupDetail()
    }, 3000)
  },
  goPoster () {
    let poster = wx.getStorageSync('poster-info')
    let self = this
    let info = {
      card_id: self.data.card_id || '',
      spu_id: self.data.spu_id || '',
      sku_id: self.data.sku_id || '',
      group_product_id: self.data.group_log_id,
      from_type: self.data.from_type || '',
      order_no: self.data.order_no,
    }
    console.log(info)
    wx.setStorageSync('poster', info)
    let url = '/pages/poster/poster?'
    // 商品
    if (self.data.type == 1) {
      url += 'type=2&share=1'
    }
    // 秒杀
    if (self.data.type == 2) {
      url += 'type=1&share=1'
    }
    // 养护卡
    if (self.data.type == 3) {
      url += 'type=5&share=1'
    }
    wx.navigateTo({
      url: url,
    })
  },
  // 获取订单详情-判断是否存在下单有礼
  async getOrderDetail() {
    let self = this
    wx.showLoading({
      title: "加载中",
      mask: true,
    })
    self.setData({
      detail_load: true
    })
    try {
      const {statusCode,code, message, data} = await OrderpaySuccess({
        trade_order_no: self.data.order_no
      })
      if (statusCode === 200 && code === 0) {
        self.setData({
          detail_load: false
        })
        if (data.is_first === 1) self.fetchCouponList()
      } else {
        wx.hideLoading()
        showMessage({
          title: '获取订单支付信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('支付成功-getOrderDetail:', err)
    }
  },

  // 获取拼团详情
  async getGroupDetail () {
    let self = this
    // 请求接口
    this.data.is_loading = true
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    // 拼团详情延时3秒
    try{
      const{statusCode, data, code, message} = await groupUserDetail({
        group_log_id: this.data.group_log_id
      })
      if(statusCode === 200) {
        if (code === 0){
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
      // 结束请求接口
      this.data.is_loading = false
    }catch(err){
      // 结束请求接口
      this.data.is_loading = false
      if(err.error === "ERROR") {
        console.error('支付成功-getGroupDetail:', err)
      }
    }
    wx.hideLoading()
  },

  // 获取结束时间段
  getEndTimeLine () {
    let self = this
    // 跳出当前页后倒计时停止
    let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
    if (current_route.indexOf('groupPaySuccess') === -1){
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

  // 查看订单详情
  goOrderDetail(e){
		wx.redirectTo({
			url: '/pages/order/orderDetail/orderDetail?number='+this.data.order_id+'&activity_id='+this.data.id+'&group_log_id='+this.data.group_log_id,
    });   
	},

  // 查看卡详情
  goCardDetail(){
    wx.redirectTo({
    url: `/pages/card/myCardDetail/myCardDetail?order_no=${this.data.order_no}`
    })
	},

  // 继续逛逛
  goGroupCategoryList(e){
		wx.redirectTo({
			url: '/pages/spilkeGroup/groupCategoryList/groupCategoryList',
    });   
	},

  // 页面分享设置
  onShareAppMessage() {
    let url = 'pages/spilkeGroup/groupSharePage/groupSharePage?share=1&spu_id='+(this.data.spu_id?this.data.spu_id:this.data.card_id)+'&sku_id='+this.data.sku_id+'&order_no='+this.data.order_no+'&group_log_id='+this.data.group_log_id+'&type='+this.data.type
    if (this.data.from_type) url+= '&from_type=order'
    return {
      title: '这有一个超高性价比的好东西，就差你的一臂之力了！',
      path: url,
    };
  },

  // 关闭分享有礼
  couponCancel(params) {
    this.setData({
      isShowCoupon: false
    })
  },

  // 下单有礼数据
	async fetchCouponList () {
		try {
      const {statusCode, data, code,} = await getCouponStateApi({
				from_type: 4
			})
      if (statusCode === 200 && code === 0) {
				if (data.length > 0) {
					this.setData({
						isShowCoupon: true,
						recommend_coupon: data,
					})
				}
			} else {
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      console.error('支付成功-fetchCouponList:', err)
    }
	},
});
