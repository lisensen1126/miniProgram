const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('shopCar')



// 修改购物车商品
export function editShop (data) {
  return request('editShop', {
    data,
    method: 'POST',
  })
}

// 删除购物车商品
export function deleteShop (data) {
  return request('deleteShop', {
    data,
    method: 'POST',
  })
}

// 添加商品
export function addShop (data) {
  return request('addShop', {
    data,
    method: 'POST',
  })
}

// 购物车列表
export function shopList (data) {
  return request('shopList', {
    data,
  })
}


// 商品选中/取消选中
export function shopSelected (data) {
  return request('selected', {
    data,
    method: 'POST'
  })
}

