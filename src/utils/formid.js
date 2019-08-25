import {getFormIdApi} from '@/libs/modules/common'

/**
 * formId 埋点
 * @param {*} e form 表单提交数据
 */
const sendFormId = e => {
   console.log('formId.js', e.detail.formId)
  if(e.detail.formId !== 'the formId is a mock one') {
    getFormIdApi({form_id: e.detail.formId}).then(res => {
      console.log('formid', res)
    })
  }
}
export {sendFormId}