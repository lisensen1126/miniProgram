const {
  createModuleRequest
} = require('../../utils/request.js')
const requestComment = createModuleRequest('comment')
const requestStoreCommentList = createModuleRequest()


// 获取评论列表
export function EvaluateList(data) {
  return requestStoreCommentList(`shop/comment`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}
// 门店 - 门店评论
export function StoreCommentList(data) {
  return requestStoreCommentList(`store/comment`, {
    method: 'GET',
    data
  })
}
