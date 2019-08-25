const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('seckill')

// 秒杀spu列表
export function getSpikeListApi (data) {
  return request('list', {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 秒杀sku列表
export function getSpikeSkuListApi (data) {
  return request('list_new', {
    method: 'POST',
    data: {
      ...data
    }
  })
}

// 秒杀商品详情
export function getSpikeGoodsDetailApi (data) {
  return request('goods_detail', {
    method: 'POST', 
    data: {
      ...data
    }
  })
}

// 秒杀商品(sku)详情
export function getSpikeGoodsSkuApi (data) {
  return request('sku_detail', {
    method: 'POST', 
    data: {
      ...data
    }
  })
}

// 秒杀服务详情
export function getSpikeServiceDetailApi (data) {
  return request('service_detail', {
    method: 'POST', 
    data: {
      ...data
    }
  })
}

// 秒杀养护卡详情
export function getSpikeCardDetailApi (data) {
  return request('upkeep_detail', {
    method: 'POST',
    data: {
      ...data
    }
  })
}