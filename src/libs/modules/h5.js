const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest()

//  获取跳转h5需要的参数
export function autioshopRedirect (params) {
  return request('worry/add', {
    method: 'POST',
    data: params,
  })
}
