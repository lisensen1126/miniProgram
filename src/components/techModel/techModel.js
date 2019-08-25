import {
	getTechDetailApi
} from '@/libs/modules/common'
import {
	recommendTechnician
} from '@/libs/modules/store'
const {
  showMessage,
  changeDateTime,
  globalData
} = getApp();
Component({
  properties: {
    techId: String,
  },
  data: {
    tech_detail: null,
    is_like: 1,
    surplus: 5,
    errMsg: '暂无评价',
  },
  ready() {
    this.getDetail()
  },
  methods: {

    /**
     * 推荐技师
     * @techniciansid   技师ID
     */
    async recommendTechnician(e) {
      if(globalData.is_registered === 0) {
        wx.navigateTo({
          url: '/pages/register/registerPhone/registerPhone',
        })
        return
      }
      let is_like = this.data.tech_detail.is_like
      let self = this

      // is_like 1表示可以推荐  2表示不可推荐
      if(is_like === 2 || self.data.surplus === 0) {
        wx.showToast({
          title: '最多只能点赞5次哟～',
          icon: 'none',
          duration: 2000,
          mask: true,
        })
        return
      }
      try {
        const {
          statusCode,
          code,
          data,
          message
        } = await recommendTechnician({
          technicians_id: self.data.techId
        })
        if (statusCode === 200 && code === 0) {
          console.log(data, '数据')
          let detail = self.data.tech_detail
          detail.recommend_num += 1
          self.setData({
            tech_detail: detail,
            surplus: data.surplus,
          })
          wx.showToast({
            title: '推荐+1',
            icon: 'none',
            duration: 1000,
            mask: true,
          })
        } else if (code === 10010011) {
          showMessage({
            title: '推荐失败',
            content: `${message}`,
          })
        } else {
          showMessage({
            title: '推荐失败',
            content: `${message}`,
          })
        }
      } catch (err) {
        console.error('弹框-recommendTechnician:', err)
      }
    },
    /**
     * 点击图片放大
     * @index  图片下标
     * @imgArr 图片集合
     */
    previewImage(e) {
      this.data.preImgStatus = true
      let index = e.currentTarget.dataset.index
      let imgArr = e.currentTarget.dataset.arr.map(x => x.image_url)
      wx.previewImage({
        urls: imgArr,
        current: imgArr[index],
        success: (res) => {},
        fail: (err) => {}
      })
    },
    async getDetail () {
      let _this = this
      wx.showLoading({
        title: '加载中...',
        mask: true,
      })
      let params = {
        technicians_id: _this.data.techId
      }
      try {
        const {
          statusCode,
          code,
          message,
          data
        } = await getTechDetailApi(params)
        if (statusCode === 200 && code === 0) {
          if (data.list.length > 0) {
            data.list.forEach(ele => {
              ele.created_at = changeDateTime(ele.created_at)
            })
          }
          _this.setData({
            tech_detail: data,
            is_like: data.is_like,
          })
          wx.hideLoading()
        } else {
          showMessage({
            title: '查询技师详情失败',
            content: `${message}`,
          })
        }
      } catch (err) {
        console.error('查询技师详情失败-getTechDetailApi:', err)
      }
    },
    close () {
      this.triggerEvent('close')
    },
  },
})