const {request} = require('../../utils/request.js')
// const request = createModuleRequest('common')

// 获取优惠券列表
export function getLotteryCoupons (data) {
  return request(`lottery/${data}`, {})
}

// 抽奖
export function doLottery (data) {
  return request(`lottery/${data}/run`, {
    method: 'GET',
  })
}

// 中奖名单
export function getLotteryList (data) {
  return request(`lottery/${data}/records`, {
    method: 'GET',
  })
}

// 分享
export function doShare (data) {
  return request(`lottery/${data}/share`, {
    method: 'GET',
    needToken: true,
  })
}

