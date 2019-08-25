// 获取全局应用程序实例对象
const {countDown} = getApp()
Component({
  properties: {
    // 列表循环时的索引值
    index: {
      type: Number,
    },
    // 养护卡对象
    groupCategory: {
      type: Object,
      observer(nv, ov, path) {
        let goods_price = (nv.goods_price / 100).toFixed(2)
        let group_price = (nv.group_price / 100).toFixed(2)

        this.setData({
          type: nv.type,
          goods_img: nv.goods_img,
          goods_name: nv.goods_name,
          goods_price: goods_price,
          group_price: group_price,
          group_product_id: nv.group_product_id,
          num: nv.num,
          sku_id: nv.sku_id,
          spu_id: nv.spu_id,
          content_type: nv.content_type,
        })
      }
    }
  },
  data: {
    type: '',
    goods_img: '',
    goods_name: '',
    goods_price: '',
    group_price: '',
    group_product_id: '',
    num: '',
    sku_id: '',
    spu_id: '',
    content_type: '',
  },
  methods: {
    // 跳转详情
    goDetail(e) {
      let content_type = e.currentTarget.dataset.contentType
      let group_product_id = e.currentTarget.dataset.groupProductId
      let spu_id = e.currentTarget.dataset.spuId
      let sku_id = e.currentTarget.dataset.skuId		
      // 1:商品 2:服务 3壳养护卡 4养护卡 5次卡
      if (parseInt(content_type) === 1){
        // 拼团商品详情
        wx.navigateTo({
          url: `/pages/spilkeGroup/groupGoodsDetail/groupGoodsDetail?spu_id=${spu_id}&group_product_id=${group_product_id}&sku_id=${sku_id}`
        })    
      } else if (parseInt(content_type) === 2){
        // 服务详情
        wx.navigateTo({
          url: `/pages/spilkeGroup/groupServiceDetail/groupServiceDetail?spu_id=${spu_id}&group_product_id=${group_product_id}`
        })    
      } else if (parseInt(content_type) >= 3){
        // 卡详情
        wx.navigateTo({
          url: `/pages/spilkeGroup/groupPurchaseDetail/groupPurchaseDetail?card_id=${spu_id}&group_product_id=${group_product_id}`
        })
      }
    },
  },
  ready() {

  },
})