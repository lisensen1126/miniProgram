Component({
  properties: {
    // 列表循环时的索引值
    index: {
      type: Number,
    },
    // 养护卡对象
    card: {
      type: Object,
      observer(nv, ov, path) {
        this.setData({
          id: nv.id,
          image_url: nv.image_url,
          name: nv.name,
          num: nv.num,
          origin_price: nv.origin_price,
          price: nv.price,
          sale: nv.sale,
          content_type: nv.content_type,
        })
      }
    }
  },
  data: {
    id: '',
    image_url: '',
    name: '',
    num: '',
    origin_price: '',
    price: '',
    sale: '',
    content_type: '',
  },
  methods: {
    // 跳转卡详情
    goDetail(e) {
      let id = e.currentTarget.dataset.id
      wx.navigateTo({
        url: `/pages/card/purchaseDetails/purchaseDetails?card_id=${id}`
      })
    },
  },
  ready() {
    // console.log(this.properties.card)
  },
})