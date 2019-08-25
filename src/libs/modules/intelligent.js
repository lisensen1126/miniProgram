const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('smart_maintain')

// 默认车辆
export function shopCar () {
  return request('my_car_info', {
    method: 'GET',
  })
}

// 项目（机油）列表
export function engineOil () {
  return request('item_list', {
    method: 'GET',
  })
}

// 机油更换列表
export function changeOil (data) {
  return request('list', {
    method: 'GET',
    data
  })
}

// 更换机油提交参数
export function commitParam (data) {
  return request('oil_list', {
    method: 'POST',
    data
  })
}

// 保养手册
export function maintain () {
  return request('manual', {
    method: 'GET',
  })
}
// 车型参数
export function carParament () {
  return request('param', {
    method: 'GET',
  })
}
// 获取更换列表
export function getChangeList (data) {
  return request('recommend_list', {
    method: 'GET',
    data
  })
}
// 更换机油提交参数
export function changeOil2 (data) {
  return request('oil_change', {
    method: 'POST',
    data
  })
}
// 更换变速箱油提交参数
export function changeGearBoxOil2 (data) {
  return request('transmission_oil_change', {
    method: 'POST',
    data
  })
}
// 机油列表
export function oilList () {
  return request('engine_oil_list', {
    method: 'GET',
  })
}
// 滤清器列表
export function filterList () {
  return request('oil_filter_list', {
    method: 'GET',
  })
}

// 变速箱油列表
export function gearBoxListApi () {
  return request('transmission_oil_list', {
    method: 'GET',
  })
}

