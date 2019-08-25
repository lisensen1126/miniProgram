const {
  createModuleRequest
} = require('../../utils/request.js')
const http = createModuleRequest()

// 子卡赠送记录 upkeep/daughter_card_records
export function getMyRecordApi(data) {
  return http('upkeep/daughter_card_records', {
    method: 'GET',
    data,
  })
}
// 获取可领取优惠券列表
export function getMyCardListApi(data) {
  return http('upkeep/customer_card_list', {
    method: 'POST',
    data,
  })
}

// 获取可领取优惠券列表
export function getMyCardCodeApi(data) {
  return http('upkeep/qrcode', {
    method: 'GET',
    data,
  })
}

// 养护卡核销记录 
export function getMyCardWirteApi(data) {
  return http('upkeep/my_item', {
    method: 'GET',
    data,
  })
}

// 养护卡购卡中心列表
export function getCardCenterListApi(data) {
  return http('upkeep/list', {
    method: 'GET',
    data,
  })
}

// 养护卡购卡中心卡详情
export function getCardCenterDetailApi(data) {
  return http('upkeep/info', {
    method: 'GET',
    data,
  })
}

// 确认订单
export function makeSureOrderApi(data) {
  return http('order/upkeep_insert', {
    method: 'POST',
    data,
  })
}
// 养护卡详情
export function getMyCardDetailApi(data) {
  return http('upkeep/my_info', {
    method: 'GET',
    data,
  })
}

// 获取养护卡相关商品
export function getCardGoodsList(data) {
  return http(`upkeep/goods`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 获取养护卡相关商品
export function getMyCardGoodsList(data) {
  return http(`upkeep/user_goods`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 赠送列表
export function getGiveListApi(data) {
  return http(`upkeep/give_list`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 使用记录
export function getRecordListApi(data) {
  return http(`upkeep/write_off_list`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 删除卡
export function deleteMyCardApi(data) {
  return http(`upkeep/customer_card_delete`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 生成卡号
export function cardNoCreateApi() {
  return http(`upkeep/daughter_card_no_create`)
}

// 生成子卡
export function createDaughterCardApi(data) {
  return http(`upkeep/daughter_card_create`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 子卡详情
export function daughterCardDetailApi(data) {
  return http(`upkeep/daughter_card_detail`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 领取子卡
export function receiveDaughterCardApi(data) {
  return http(`upkeep/daughter_card_receive`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 赠送卡详情
export function receiveCardDetailApi(data) {
  return http(`upkeep/order_info`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 领取卡
export function receiveCardApi(data) {
  return http(`upkeep/order_gift`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 自己使用
export function selfUseApi(data) {
  return http(`upkeep/order_gift_self`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 判断是否失效
export function checkCardApi(data) {
  return http(`upkeep/give_check`, {
    method: 'POST',
    data: {
      ...data
    }
  })
}