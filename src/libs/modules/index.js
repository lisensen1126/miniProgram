const {createModuleRequest, request} = require('../../utils/request.js')
const requestShop = createModuleRequest('shop')
const requestCommon = createModuleRequest('common')
const requestCoupons = createModuleRequest('coupons')
// 海报二维码信息
export function getPosterDetailApi (data) {
  return request('poster/qrcode', {
    method: 'GET',
    data,
  })
}

// 图片转换
export function changeImgAPi(data) {
  return request('common/get_photo', {
    method: 'GET',
    data,
  })
}

// 车辆信息
export function shopHome () {
  return requestShop('home', {
    method: 'GET',
  })
}

// 爆款推荐

export function getHot (data) {
  return requestShop('hot', {
    method: 'GET',
    data
  })
}

// 优惠券
export function isCoupons () {
  return requestCoupons('couponState', {
    method: 'POST',
  })
}

// 轮播、品牌日
export function getAd (data) {
  return requestShop('ad', {
    data
  })
}

// 开机大屏
export function getOpenConfigApi () {
  return requestCommon('get_def')
}

// 天气
export function getWeather (data) {
  return request('weather', {
    data
  })
}

// 品牌专区
export function getBrands (data) {
  return requestShop('brand-interval', {
    data
  })
}

// 品牌专区-列表
export function allBrands (data) {
  return request('brand_house_copy', {
    data
  })
}

// 保养建议
export function maintainSuggestApi (data) {
  return requestShop('maintain-mileage-proposal', {
    data
  })
}

// 小贴士-列表
export function tipsListApi (data) {
  return requestShop('tips', {
    data
  })
}

// 新轮播图
export function rotationImageApi (data) {
  return requestShop('rotation-image', {
    data
  })
}

// 默认车辆
export function indexCarApi () {
  return requestShop('default_car')
}