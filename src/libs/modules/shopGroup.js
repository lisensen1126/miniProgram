const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest()

// 拼团spu列表
export function groupGoodsList(data) {
  return request(`group/list`, {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 拼团spu+sku列表
export function groupGoodsSkuList(data) {
  return request(`group/sku-list`, {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 拼团商品详情
export function groupGoodsDetail(data) {
  return request('group/goods-detail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 拼团sku属性
export function groupSkuDetail(data) {
  return request('group/sku-detail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 拼团服务详情
export function groupServiceDetail(data) {
  return request('group/service-detail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 拼团养护卡详情
export function groupCardDetail(data) {
  return request('group/card-detail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 镜像拼团养护卡详情
export function groupIsoCardDetail(data) {
  return request('group/card-detail-iso', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 所参团的状态
export function groupState(data) {
  return request('group/state', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

//  商品详情可参与拼团数据
export function groupJoinData(data) {
  return request('group/recommend', {
    method: 'GET',
    data:{
      ...data
    }
  })
}
// 参团人员详情
export function groupUserDetail(data) {
  return request('group/user-detail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}
