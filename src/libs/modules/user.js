const {createModuleRequest, request: normalRequest} = require('../../utils/request.js')
let request = createModuleRequest('')

// 添加车辆有礼金额
export function getCouponTotalApi(data) {
  return request('vehicle_info_check', {
    method: 'GET',
    data,
  })
}
// 用户添加车辆详情
export function userCarDetailApi(data) {
  return request('car/has_vehicle_info', {
    method: 'GET',
    data,
  })
}
// 车检列表
export function inspectListApi(data) {
  return request('inspect/new_list', {
    method: 'GET',
    data,
  })
}
// 车检列表
export function inspectDetailApi(data) {
  return request('inspect/new_detail', {
    method: 'GET',
    data,
  })
}
// 获取用户信息
export function fetchUserInfo () {
  return request('user/me')
}

// 更新
export function updateUserInfo (data) {
  return request('customers/update', {
    method: 'PUT',
    data,
  })
}

// 获取车辆详情
export function fetchVehicleInfo (id) {
  return request(`customer_vehicles/${id}`)
}
// 获取车辆列表
export function getCarList () {
  return request('car')
}
export function settingDefault (data) {
  return request(`car/${data.vehicle_id}`, {
    method: 'POST',
    data,
  })
}

// 更新车辆信息
export function updateVehicleInfo (data) {
  return request(`car/${data.vehicle_id}`, {
    method: 'POST',
    data,
  })
}
// 添加车辆信息
export function addCarInfo (data) {
  return request('car', {
    method: 'POST',
    data,
  })
}
// 我的最近预约
// export function fetchRecentReservations () {
//   return request('reservations/recent')
// }

// 我的预约信息
export function fetchRecentReservation (query) {
  return request('recent/reservation', {
    data: {
      ...query,
    },
  })
}

// 个人中心数据合计
export function fetchStatistics () {
  return request('user/center/statistics')
}

// 获取短信验证码
export function fetchSmsCode (data) {
  return normalRequest('sms', {
    data,
    needToken: false,
  })
}

// 注册用户
export function registerUser (data) {
  return normalRequest('register', {
    method: 'POST',
    data,
    needToken: false,
  })
}

// 获取省简写
export function attrProvince () {
  return request('common/province', {
    method: 'POST',
  })
}

// 获取待评价列表
export function getComment (data) {
  return request('comment/center', {
    data: data,
    method: 'GET',
  })
}

// 评价详情
export function commentDetail (data) {
  return request('order/detail', {
    data: data,
    method: 'GET',
    needToken: false,
  })
}

// 上传图片
export function upImg (data) {
  return request('image', {
    data: data,
    method: 'POST',
    needToken: false,
  })
}

// 添加评论
export function addCommen (data) {
  return request('comment/insert', {
    data: data,
    method: 'POST',
    needToken: false,
  })
}

// 个人中心
export function my (data) {
  return request('my', {
    data: data,
  })
}

// 获取可用优惠券的数量
export function myCouponsNumber (data) {
  return request('coupons/myCouponsNumber', {
    data: data,
    method: 'POST',
    needToken: false,
  })
}

// (门店评论) 获取门店信息 store/basic_detail
export function storeInfo (data) {
  return request('store/basic_detail', {
    data: data,
    method: 'GET',
  })
}

// (门店评论) 添加评论 comment/store_insert
export function addStoreEvaluate (data) {
  return request('comment/store_insert', {
    data: data,
    method: 'POST',
  })
}
// (门店评价) 技师列表 /technician/update
export function technicianList (data) {
  return request('technicians/list', {
    data: data,
    method: 'POST',
  })
}
// (个人中心) 获取门店扩展配置
export function extendConfig () {
  return request('store/get_extend', {
    method: 'GET',
  })
}
// (个人中心) 分享有礼
export function shareGift () {
  return request('share/receive', {
    method: 'POST',
  })
}
// (个人中心) 获取会员卡
export function getVipCard () {
  return request('third_data/get_coupon_and_card_count', {
  })
}

// 删除用户车辆
export function deleteApi(params) {
  return request('car/delete', {
    method: 'POST',
    data: {
      ...params
    }
  })
}