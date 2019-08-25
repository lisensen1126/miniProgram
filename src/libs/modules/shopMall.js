const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest()
const requestShopOrder = createModuleRequest('shop')

// 商品（不推荐）、服务列表
export function shopList(data) {
  return request('shop', {
    data: {
      ...data
    }
  })
}

// 商品推荐列表
export function shopRecommendList(data) {
  return request('smart_maintain/recommend', {
    data: {
      ...data
    }
  })
}

// 品牌列表
export function brandList(data) {
  return requestShopOrder(`brand`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 服务分类列表
export function categoryList(data) {
  return requestShopOrder(`categorycache/${data.type}`, {
    method: 'GET',
  })
}

// 商品详情
export function goodsDetail(data) {
  return requestShopOrder('detail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// sku、属性列表
export function skudetail(data) {
  return requestShopOrder('skudetail', {
    method: 'GET',
    data:{
      ...data
    }
  })
}


// 服务详情
export function serviceDetail(data) {
  return requestShopOrder('service', {
    method: 'GET',
    data:{
      ...data
    }
  })
}

// 加购物车
export function addShop(data) {
  return request(`shopCar/addShop`,  {
    method: 'POST',
    data: {
      ...data
    }
  })
}

/**
 * 商品详情 - 优惠券列表
 * 
 * @param {Object} data 请求参数
 */
export function getUpkeepCouponList(data) {
  return request('upkeep/info/coupon' , { data })
}
/**
 * 养护卡详情 - 优惠券列表
 * 
 * @param {Object} data 请求参数
 */
export function getGoodsCouponList(data) {
  return requestShopOrder('detail/coupon' , { data })
}

/**
 * 服务详情 - 优惠券列表
 * 
 * @param {Object} data 请求参数
 */
export function getServiceCouponList(data) {
  return requestShopOrder('service/coupon' , { data })
}
