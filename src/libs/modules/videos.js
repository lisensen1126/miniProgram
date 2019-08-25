const {createModuleRequest} = require('../../utils/request.js')
const request = createModuleRequest('')

// 获取录播列表
export function fetchVideoRecord (params) {
  return request('video/record', {
    data: params,
  })
}

// 获取录播d地址
export function fetchVideoRecordDetail (data) {
  return request(`video/recordUrl`, {
    method: 'GET',
    data: {
      ...data
    }
  })
}

// 获取直播地址信息
export function fetchLiveUrl (params) {
  return request('video/url')
}

// 获取直播状态
export function fetchLiveStatus (params) {
  return request('video/status')
}
