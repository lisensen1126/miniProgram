const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('shop')

// 获取推广
export function fetchSpreads (data) {
  return request('spread', {
    ...data,
  })
}
