const {
  createModuleRequest
} = require('../../utils/request.js')
const requestContents = createModuleRequest('contents')


// 获取内容信息
export function getContent(data) {
  return requestContents(`info`, {
    method: 'GET',
    data,
  })
}

// 平台内容报名操作
export function contentJoin(data) {
  return requestContents(`user`, {
    method: 'POST',
    data,
  })
}
