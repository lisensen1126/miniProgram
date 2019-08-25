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
        let price = (nv.goods_price / 100).toFixed(2)
        this.setData({
          goods_img: nv.goods_img,
          goods_name: nv.goods_name,
          goods_price: price,
          is_recommend: nv.is_recommend,
          sales: nv.sales,
          shop_id: nv.shop_id,
          sku_id: nv.sku_id,
          source: nv.source,
          spu_id: nv.spu_id,
          store_id: nv.store_id,
          content_type: nv.content_type,
        })
      }
    }
  },
  data: {
    goods_img: '',
    goods_name: '',
    goods_price: '',
    is_recommend: '',
    sales: '',
    shop_id: '',
    sku_id: '',
    source: '',
    spu_id: '',
    store_id: '',
    content_type: '',
  },
  methods: {
    // 跳转详情
    goDetail(e) {
      let type = parseInt(e.currentTarget.dataset.type)
      if (type === 1) {
        wx.navigateTo({
          url: '/pages/mall/goodsDetail/goodsDetail?spu_id='+e.currentTarget.dataset.spuId+'&sku_id='+e.currentTarget.dataset.skuId
        })
      }
      if (type === 2) {
        wx.navigateTo({
          url: '/pages/mall/serviceDetail/serviceDetail?spu_id='+e.currentTarget.dataset.spuId
        })
      }
    },
  },
  ready() {
    // console.log(this.properties.card)
  },
})