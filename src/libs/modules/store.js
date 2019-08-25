const {createModuleRequest, request} = require('../../utils/request.js')

const requestTechnicians = createModuleRequest('technicians')

// 门店信息
export function getStoreInfo (data) {
  return request('store', {
    method: 'GET',
    data,
  })
}
// 获取最近门店
export function getLatelyStore (data) {
  return request('store/store_id', {
    method: 'GET',
    data,
  })
}
// 切换门店列表
export function getStoreList (data) {
  return request('store/list', {
    method: 'GET',
    data,
  })
}

// 技师
export function getTechnician (data) {
  return requestTechnicians('list', {
    method: 'POST',
    data: {
      ...data,
    },
  })
}

// 推荐技师
export function recommendTechnician (data) {
  return requestTechnicians('recommend', {
    method: 'POST',
    data: {
      ...data,
    },
  })
}

// 获取评价列表
export function getCommentListApi () {
  return request('comment/comment_label', {
    method: 'POST',
  })
}
