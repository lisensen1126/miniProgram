const {
  createModuleRequest
} = require('../../utils/request.js')
const requestAppointment = createModuleRequest('coupons')
const requestAppointment2 = createModuleRequest()


// 获取可领取优惠券列表
export function getCouponsLists(data) {
  return requestAppointment('list', {
    method: 'POST',
    data,
  })
}

// 立即领取优惠券
export function getCoupon(data) {
  return requestAppointment('receive', {
    method: 'POST',
    data,
  })
}
// 我的优惠券列表 /coupons/mylist
export function getMyCouponLIst(data) {
  return requestAppointment('mylist', {
    method: 'POST',
    data,
  })
}

// 优惠券适用的商品/服务列表
export function getApplicableList (data) {
  return requestAppointment('coupon-products', {
    data,
  })
}

// 推送优惠券列表
export function getCouponStateApi (data) {
  return requestAppointment('couponState', {
    method: 'POST',
    data,
  })
}

// 优惠券全场通用的商品
export function getApplicaAllApi (data) {
  return requestAppointment('shop-product-upkeep', {
    method: 'POST',
    data,
  })
}

// 优惠券适用的养护卡的商品
export function getApplicaCardApi (data) {
  return requestAppointment('coupon-upkeep', {
    method: 'GET',
    data,
  })
}
