import {offlinePaySuccessApi} from '@/libs/modules/order'
import {addStoreEvaluate} from '@/libs/modules/user'
import {getCouponStateApi} from '@/libs/modules/coupon'
const {showMessage, globalData, changeDateTime} = getApp()
Page({
  data: {
    list: [
      {is_select: false, name: '服务态度好！'},
      {is_select: false, name: '不错！下次还会来！'},
      {is_select: false, name: '技师专业！ 老板热情！'},
      {is_select: false, name: '服务棒！ 态度好！'},
      {is_select: false, name: '值得推荐的一家店～'},
      {is_select: false, name: '为你们的服务点赞！'}
    ],
    comment: '',
    order: {},
    tips_modal: false,
    recommend_coupon: [],
    is_first: false,   // 是否时是首次评价&首次线下支付
    is_type: '',       // is_type = 'pj'代表首次评论， is_type = 'zf'代表首次线下支付
  },

  onLoad(option) {
    this.setData({
      topbarHeight: globalData.topbarHeight,
      showHome: true,
      order_no:option.orderNo,
    })
    this.fetchDetail(option.orderNo)
  },

  // 选择评论数据
  chooseInfo(e) {
    let tempindex = e.currentTarget.dataset.index
    let curr = e.currentTarget.dataset.params
    curr.is_select ? this.setData({comment: ''}) : this.setData({comment: curr.name})
    this.data.list.forEach((v, index) => {
			if (tempindex == index) {
				v.is_select = !v.is_select
			} else {
				v.is_select = false
			}
    })
    this.setData({
			list: this.data.list,
		})
  },

  // 获取订单详情
  async fetchDetail(order) {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await offlinePaySuccessApi({
        trade_order_no: order,
      })
      if (statusCode === 200 && code === 0) {
        data.paid_at = changeDateTime(data.paid_at)
        this.setData({
          order: data,
          is_first : data.is_first == 1 ? true : false,
          is_type: 'zf',
        })
        if(this.data.is_first) this.fetchCouponList(7)      // 请求线下支付首单有礼  优惠券
      } else {
        showMessage({
          title: '获取订单详情失败',
          content: message,
        })
      }
    } catch (err) {
      console.error('订单详情-fetchDetail:', err)
    }
    wx.hideLoading()
  },

  // 评论
  async addEvaluate() {
    this.setData({
      tips_modal: false,
    })
    wx.showLoading({title: '加载中...', mask: true})
    try {
			let params = {
        comment_content: this.data.comment,
        score: 5,
        image_url: [],
        wx_uid: '',
        technicians_id: '',
      }
      // 当前时间 减去 获取access_id的时间 是否超过五分钟
      if (parseInt(new Date() / 1000 - wx.getStorageSync('access_id').time) <= 300) {
        params.access_id =  wx.getStorageSync('access_id').access_id
      }
			const {statusCode, code, message, data} = await addStoreEvaluate(params)
			if (statusCode === 200 && code === 0) {
        wx.hideLoading()
				this.setData({
          is_type: 'pj',
          is_first: data.state,
          recommend_coupon: [],
        })
        this.data.is_first ? this.fetchCouponList(2) : this.setData({tips_modal: true})  // 请求线下支付首单有礼  优惠券
			} else {
				wx.hideLoading()
				showMessage({
					title: '温馨提示',
					content: message,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('门店评价-addEvaluate:', err)
		}
  },

  // 去订单详情
  goOrderDetail(){
    wx.redirectTo({
      url: `/pages/order/orderDetail/orderDetail?order_no=${this.data.order_no}`,
    })
  },

  // 营销有礼关闭
  couponCancel() {
    this.setData({
      is_first: false,
    })
  },

  /**
   * 
   * 获取推送的优惠券
   * @param {Number, String} type  1：注册有礼，2：首评有礼，3：首次完善车辆信息有礼，4：首次下单有礼，5：首次分享有礼，6:定向推送 7：线下支付
   */
	async fetchCouponList (type) {
    wx.showLoading({title: '加载中...', mask: true})
		try {
      const {statusCode, data, code,} = await getCouponStateApi({
				from_type: type
			})
      if (statusCode === 200 && code === 0) {
        wx.hideLoading()
				if (data.length > 0) {
					this.setData({
            recommend_coupon: data,
          })
				}
			} else {
        wx.hideLoading()
				showMessage({title: '获取优惠券数据错误', content: `${message}`})
			}
    } catch (err) {
      wx.hideLoading()
      console.error('欢迎注册-fetchCouponList:', err)
    }
  },

  // 去评价
	goCreateEvaluate(e) {
		wx.navigateTo({
			url: '/pages/perevaluate/storeEvaluate/storeEvaluate'
		})
  },
  
  // 去领券中心
	goVoucher(e) {
		wx.navigateTo({
			url: '/pages/coupon/voucher/voucher',
		})			
	},
});
