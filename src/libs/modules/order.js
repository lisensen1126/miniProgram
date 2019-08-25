const {
  createModuleRequest
} = require('../../utils/request.js')
const request = createModuleRequest()
const requestOrder = createModuleRequest('order')
const requestSpikeGroupOrder = createModuleRequest('')

// 获取订单详情
export function getOrderDetail(data) {
  return requestOrder(`detail`, {
    method: 'POST',
    data,
  })
}

// 获取二维码
export function getOrcodeApi(data) {
  return requestOrder(`qrcode`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 获取订单列表
export function fetchOrderList (data) {
  return requestOrder('list_customer', {
    method: 'GET',
    data,
  })
}

// 取消预约
export function cancelReservation (data) {
  return requestOrder('un_reserve', {
    method: 'POST',
    data: {
      ...data
    }
  })
}
// 取消预约
export function cancelOrderApi (data) {
  return requestOrder('cancel', {
    method: 'POST',
    data: {
      ...data
    }
  })
}
// 获取预约详情
export function getMyReserve() {
  return requestOrder(`my_reserve`, {
    method: 'GET'
  })
}

// 订单支付
export function payment(data) {
  return requestOrder('payment_detail', {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 订单支付成功
export function OrderpaySuccess(data) {
  return requestOrder(`state`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 新增订单
export function addOrder(data) {
  return requestOrder(`insert`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 下单页面我的优惠券列表
export function myCoupon(data) {
  return requestOrder(`coupon`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 秒杀提交订单
export function spikePayment(data) {
  return requestSpikeGroupOrder(`seckill/create_order`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 拼团提交订单-开团
export function groupPayment(data) {
  return requestOrder(`add-group`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 拼团提交订单-参团
export function groupJoinPayment(data) {
  return requestOrder(`join-group`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 获取带激活养护卡
export function getOrderCardList(data) {
  return requestOrder(`upkeep`, {
    method: 'POST',
    data: {
        ...data
    }
  })
}

// 赠送卡
export function giveCardDetailApi(data) {
  return request(`upkeep/order_give`, {
    method: 'POST',
    data: {
        ...data
    }
  })
}

// 养护卡下单页面我的优惠券列表
export function myCardCouponApi(data) {
  return requestOrder(`upkeep_coupon`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 养护卡下单页面我的优惠券列表
export function myOfflineCouponApi(data) {
  return request(`offline/coupon`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 线下买单
export function offlinePayApi(data) {
  return requestOrder(`offline_insert`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 判断线下富矿是否可以使用优惠券
export function judgePayCouponApi(data) {
  return request(`offline/detail`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 线下买单支付成功获取线下支付信息
export function offlinePaySuccessApi(data) {
  return request(`order/offline_detail`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 快速开单的详情
export function quickOrderDetailApi(data) {
  return request(`order/quick_order_detail`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 线下买单 - 获取88元中奖人员列表
export function randomUserListApi(data) {
  return request('random/user_list', {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 获取立减金额
export function getRandomMoneyApi(data) {
  return request('order/random_coupon', {
    method: 'POST',
    data: {
      ...data
    }
  })
}
