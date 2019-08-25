const {
    globalData
} = getApp()
import { getFormIdAndSendInfoApi } from '@/libs/modules/common'

Component({
    properties: {
        list: Array,
        page: String,
        fromRegister: Boolean,          // 是否来自于注册页面
        fromPaySuccess: {               // 来自于线下支付成功页面
            type: Boolean,
            value: false
        },
        offlineType: {                // 线下支付成功，首单有礼&线下支付，评价有礼
            type: String,
            value: ''
        },
    },
    methods: {
        cancel(e) {
            // 获取formId 并发送消息(注册成功)
            if(e.type === "callback" && e.detail.detail.formId !== 'the formId is a mock one') {
                this.getFormIdAndSendInfo(e)
            }

            this.triggerEvent('triggercancel', {
                str: 'cancal'
            })
        },
        goList(e) {
            console.log('e', e)
            // 获取formId 并发送消息(注册成功)
            if(e.type === "callback" && e.detail.detail.formId !== 'the formId is a mock one') {
                this.getFormIdAndSendInfo(e)
            }
            if (this.data.page === 'index') {
                globalData.is_show_index_tip = true
            }
            wx.redirectTo({
                url: '/pages/coupon/my/myCoupon'
            })
        },
        // 空函数，阻止遮罩层事件穿透
        preventTouchMove() {
            return true
        },
        // 获取formId, 并发送消息(注册成功)
        getFormIdAndSendInfo(e){
            if(!this.data.fromRegister){
                console.log('coupon model return')
                return
            }
            console.log('send', e)
            getFormIdAndSendInfoApi({form_id: e.detail.detail.formId}).then(res => {
                console.log('formid', res)
            })
        }
    },
})