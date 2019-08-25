
const {
    globalData,
    cdpReport
} = getApp();

Component({
    properties: {
        img: String,
        url: String,
        type: Number,       
    },
    methods: {
        cancel() {
          globalData.is_show_open = false
          this.triggerEvent('triggercancel', {str: 'cancal'})
        },
        skip(e) {
            globalData.is_show_open = false
            // 首页引用支持-----如果其他页面引用请通知舒玲利，切记切记
            globalData.is_show_index_tip = true
            if (this.data.type === 14) {
                this.cancel()
            } else if (this.data.type === 7 || this.data.type === 13) {
                if (globalData.is_registered === 0) {
                    wx.navigateTo({
                        url: '/pages/register/registerPhone/registerPhone',
                    })
                    return
                }
                wx.navigateTo({
                    url: this.data.url
                })
            } else {
                wx.navigateTo({
                    url: this.data.url
                })                 
            }   
        }
    },
})