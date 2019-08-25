import { getFormIdApi } from '@/libs/modules/common'

Component({
  methods: {
    // 发送 formid
    sendFormId (e) {
      if (e.detail.formId !== 'the formId is a mock one') {
        getFormIdApi({form_id: e.detail.formId}).then(res => {
          console.log('formid', res)
        })
      }
      // 回调外层方法
      this.triggerEvent("callback", e);
    },
  }
})
