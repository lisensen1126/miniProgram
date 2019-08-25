const {
  createModuleRequest
} = require('../../utils/request.js')
const requestAppointment = createModuleRequest('order')


// 获取预约信息
export function fetchInfoOfAppointment(data) {
  return requestAppointment(`reserve_info`, {
    method: 'GET',
    data,
  })
}

// 获取可预约时间
export function fetchTimeOfAppointment (date) {
  return requestAppointment(`reserve_date`, {
    method: 'GET',
    data: {
      ...date
    },
  })
}

// 创建预约单
export function createAppointment(query) {
  return requestAppointment('insert_reserve', {
    method: 'POST',
    data: {
      ...query,
    },
  })
}