const {
    createModuleRequest
} = require('../../utils/request.js')
const requestShell = createModuleRequest('')

// 获取列表信息
export function getMaintainList(data) {
    return requestShell(`brand_house_copy/${data.id}`, {
        method: 'GET',
    })
}
