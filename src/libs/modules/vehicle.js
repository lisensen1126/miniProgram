const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('')

// 车辆品牌列表
export function fetchBrands () {
  return request('vehicles/brands')
}
// 车型列表
export function fetchModels (data) {
  return request('vehicles/models/' + data)
}
// 车型具体销售版本
export function fetchVehcileTypes (data) {
  return request('vehicles/vehicles/' + data)
}
// 车型具体销售版本详情
export function fetchVehcileTypeDetail (data) {
  return request('vehicles/detail/' + data)
}
