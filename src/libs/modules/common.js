const {
  createModuleRequest,request
} = require('../../utils/request.js')
const requestAppointment = createModuleRequest('common')

// 海报背景参数
export function getParamsApi(data) {
  return request('poster/get_param', {
    method: 'GET',
    data,
  })
}


// 技师详情
export function getTechDetailApi(data) {
  return request('technicians/detail', {
    method: 'GET',
    data,
  })
}

// 公共模块 - 保存特定页面访问数据
// export function VisitorCreate(data) {
//   return requestAppointment(`visit_create`, {
//     method: 'POST',
//     data,
//   })
// }

// export function visitorStatisticsApi(data) {
//   return request(`common/visitor`, {
//     method: 'POST',
//     data,
//   })
// }

// 聚合小程序 - 用户行为记录
export function statisticsInsert(data) {
  return request(`statistics/insert`, {
    method: 'POST',
    data,
  })
}

// 根据relation获取门店详情
export function getStoreByRelation(data) {
  return request(`store/get_store_by_relation`, {
    method: 'GET',
    data,
  })
}
// 保存form_id接口
export function getFormIdApi (data) {
  return request('mini_message/form/create', {
    method: 'POST',
    data
  })
}
// 保存form_id, 并推送消息(注册成功)
export function getFormIdAndSendInfoApi (data) {
  return request('mini_message/register_send', {
    method: 'POST',
    data
  })
}

// 获取accessId
export function getAccessIdApi (data) {
  return request('common/access', {
    method: 'POST',
    data
  })
}