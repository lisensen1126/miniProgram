const {
  globalData,
} = getApp()
Component({
  properties: {
    /**
     * 列表循环时的索引值
     */
    index: {
      type: Number,
    },
    /**
     * 用于我的优惠券，展示不同颜色的按钮
     * 1:待使用，2:已使用，3:已过期
     */
    status: {
      type: Number,
      value: 1,
    },
    /**
     * 优惠券类型
     * mine ---- 我的优惠券
     * center -- 领券中心
     * select -- 选择优惠券
     */
    type: {
      type: String,
    },
    /**
     * 是否显示右侧按钮
     */
    showBtn: {
      type: Boolean,
      value: true,
    },
    /**
     * 是否选中
     */
    isSelect: {
      type: Boolean,
      value: false,
    },
    /**
     * 优惠券对象
     */
    coupon: {
      type: Object,
      observer(nv, ov, path) {
        let range = ""
        switch (nv.coupon_use_type) {
          case 1:
            range = '全场商品/服务可用'
            break
          case 2:
            range = '指定分类可用'
            break
          case 3:
            range = '指定商品/服务可用'
            break
          case 4:
            range = '指定养护卡可用'
            break
        }
        // 兑换券
        if (nv.coupon_type === 2) range = '适用于商品/服务兑换'
        if (nv.coupon_type === 4 && nv.coupon_use_type === 1) {
          range = '全场商品/服务通用'
        }
        let fu = [{
          v: '￥',
          c: 'unit'
        }, {
          v: nv.discount_amount / 100,
          c: 'font'
        }]
        // 折扣券
        if (nv.coupon_type === 4) {
          let val = (
            this.properties.type == 'select' && `${nv.discount_amount_discount}` ?
            nv.discount_amount_discount : nv.discount_amount
          ) / 100
          fu = [{
              v: val,
              c: 'font'
            },
            {
              v: '折',
              c: 'unit'
            }
          ]
        }

        // 折扣信息
        let _condition = nv.condition_value == 0 ? '无限制' : `满${nv.condition_value / 100}元可用`

        /** ************************* 【 处理有效期限 】 ************************* **/
        let effective_time = ''
        if (nv.effective_type == 2) effective_time = `领券后${nv.effective_days}天内有效`
        else if (nv.effective_type == 3 || nv.end_time == 0) effective_time = '无有效期限制'
        else effective_time = `${this.data.formatDate(nv.start_time)} - ${this.data.formatDate(nv.end_time)}`

        this.setData({
          c_name: nv.coupon_name, // 名称
          c_effective_time: effective_time,
          c_price_info: fu,
          c_condition: _condition,
          c_status: nv.status || '',
          c_type: nv.coupon_type,
          c_range: range,
          c_remark: nv.remark || '',
          c_write_off_code: nv.coupon_code || '',
          c_receive_status: nv.receive_status || '',
          c_use_type: nv.coupon_use_type,
        })
      },
    },
  },
  data: {
    // 优惠券
    c_name: '', // 名称
    c_effective_time: '', // 有效时间
    c_price_info: [], // 金额或者折扣
    c_condition: '', // 使用条件信息
    c_status: '', // 使用状态：1:待使用 2:已使用 3:已过期
    c_type: '', // 优惠券类型:1代金券,2兑换券,3满减券,4折扣券
    c_receive_status: '', // 领取按钮状态 1：立即领取 2：继续领取  3: 不能领取
    c_range: '', // 使用范围
    c_remark: '', // 备注
    c_write_off_code: '', // 核销码
    c_use_type: '', // 优惠券使用范围类型:1=通用, 2=指定分类，3=指定商品服务

    show_code_cover: false, // 核销码 弹窗
    is_show_more_desc: false, // 备注展示状态
    formatDate: (timestamp) => {
      if (typeof timestamp === 'number') {
        let time = new Date(timestamp * 1000)
        return `${time.getFullYear()}.${time.getMonth() + 1}.${time.getDate()}`
      }
      return timestamp
    },
  },
  methods: {
    /**
     * 展示更多描述
     */
    shouwMoreDesc() {
      this.setData({
        is_show_more_desc: !this.data.is_show_more_desc,
      })
    },
    /**
     * 领取 优惠券
     */
    receive() {
      this.triggerEvent('receive', {
        coupon: this.data.coupon,
        index: this.data.index,
      })
    },
    /**
     * 去使用
     */
    toUse() {
      console.log(this.data.c_type)
      if (this.data.c_type == 2) {
        this.showCodeCover()
      } else {
        this.triggerEvent('toUse', {
          coupon: this.data.coupon,
          index: this.data.index,
        })
      }
    },
    /**
     * 核销码 弹窗
     */
    async showCodeCover() {
      this.setData({
        show_code_cover: !this.data.show_code_cover,
        qrcode_url: globalData.host + globalData.apiRoot + 'order/qrcode?write_off_code=' + this.data.c_write_off_code
      })
    },
  },
})