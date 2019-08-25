const {request} = require('../../utils/request.js')

// 我的 - 用户中心-首页-用户信息
export function myBasic () {
  return request('my_basic', {
    method: 'GET',
  })
}

// 我的 - 用户中心-编辑用户信息
export function updateUserInfo (data) {
  return request('user_info/update', {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 我的 - 用户中心-首页-今日预约
export function myTodayReserve () {
  return request('my_today_reserve', {
    method: 'GET',
  })
}

// 我的 - 用户中心-首页-其他字段
export function myOther () {
  return request('my_other', {
    method: 'GET',
  })
}

// 我的 - 用户中心-首页-订单数量
export function myOrderCount () {
  return request('my_order_count', {
    method: 'GET',
  })
}