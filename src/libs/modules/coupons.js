const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('coupons')
const {showMessage} = require('../../utils/request.js')

// 获取优惠券列表
export function fetchCoupons (data, needToken) {
  return request('list', {
    data,
    needToken,
  })
}

// 获取用户优惠券列表
export function fetchUserCoupons (data) {
  return request('mylist', {
    data,
  })
}

// 领取优惠券
export function receiveCoupon (id) {
  return request('receive', {
    coupon_id: id,
    method: 'POST',
  })
}

// h获取商品可用优惠券
export function fetchItemCoupons (data) {
  return request('customer_coupons/choice', {
    data,
  })
}

// l领取优惠券
export async function requestToGetCoupon (id, resolve) {
  wx.showLoading({
    title: '领取中...',
    mask: true,
  })
  try {
    const {statusCode, code, message} = await receiveCoupon(id)
    if (statusCode === 200) {
      showMessage({
        content: '领取优惠券成功！',
      })
      resolve && resolve()
    } else {
      showMessage({
        title: '领取优惠券失败',
        content: `${message}`,
      })
    }
  } catch (err) {
    console.error('领取优惠券组件-requestToGetCoupon', err)
    wx.hideLoading()
  }
  wx.hideLoading()
}
