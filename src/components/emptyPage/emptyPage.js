Component({
  properties: {
    slogan: String,
    icon: String,
  },
  data: {
    background_image: '',
  },
  methods: {
    getStyle() {
      switch(this.data.icon) {
        case 'comment':   // 没有技师评论
          this.setData({
            background_image: 'https://oss1.chedianai.com/wechat/no-commment.png',
          })
          break;
        case 'testimg':
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/mini_program/washing/redpack-empty.svg',
          })
          break;
        case 'maintain':   // 暂无匹配保养内容
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-maintain-1.png',
          })
          break;
        case 'integral':   // 暂无积分
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-integral.png',
          })
          break;
        case 'carmodel':    // 暂无该车型数据
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-carmodel-1.png',
          })
          break;
        case 'nosearch':   // 搜索暂无内容
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-nosearch-1.png',
          })
          break;
        case 'shopcar':    // 购物车是空的
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-shopcar-1.png',
          })
          break;
        case 'technician':    // 暂未发布技师信息
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-technician-1.png',
          })
          break;
        case 'nostore':    // 暂无门店评价
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-nostore-1.png',
          })
          break;
        case 'nocoupon':    // 暂无优惠券
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-nocoupon-1.png',
          })
          break;
        case 'noorder':    // 暂无订单
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-noorder-1.png',
          })
          break;
        case 'nodating':    // 暂无预约
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-nodating-1.png',
          })
          break;
        case 'nolovecar':    // 快来添加你的爱车
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-nolovecar-1.png',
          })
          break;
        case 'lottery':    // 抽奖结束
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/defatultPage_lottery_2.png',
          })
          break;
        case 'vipcard':    // 没有会员卡
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-vipcard-1.png',
          })
          break;
        case 'consumption':    // 没有消费记录
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-consumption-1.png',
          })
          break;
        case 'carreport':    // 没有车间报告
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-carreport-1.png',
          })
          break;
        case 'novideotape':    // 没有施工录像
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-novideotape-1.png',
          })
          break;
        case 'nophoto':    // 没有图册
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/empty-icon-nophoto-1.png',
          })
          break;
        case 'nogoods':    // 删除商品
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/goods_delete.png',
          })
          break;
        case 'goodsdown':    // 商品下架
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/goods_down.png',
          })
          break;
        case 'nocard':    // 没有养护卡
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/no-card-upkeep.png',
          })
          break;
        case 'nocardrecord':   // 没有核销记录
          this.setData({
            background_image: 'https://oss1.chedianai.com/images/assets/no-card.png',
          })
          break;
      }
      console.log(this.data.icon)
    }
  },
  ready() {
    this.getStyle()
  }
})
