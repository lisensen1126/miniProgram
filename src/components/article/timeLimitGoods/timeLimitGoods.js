// 获取全局应用程序实例对象
const {countDown} = getApp()
Component({
  properties: {
    // 列表循环时的索引值
    index: {
      type: Number,
    },
    // 养护卡对象
    timeLimitGoods: {
      type: Object,
      observer(nv, ov, path) {
        let seckill_sku_price = (nv.seckill_sku_price / 100).toFixed(2)
        let sku_price = (nv.sku_price / 100).toFixed(2)

        // 判断是否已开启(isOpen=1-即将开始，isOpen=2-已开始，isOpen=3-已结束)
        let isOpen = 0
        let nowDate = new Date() / 1000
        if (nv.start_time > nowDate) {
          isOpen = 1
        } else if (nv.start_time < nowDate && nv.end_time > nowDate) {
          isOpen = 2
        } else if (nv.end_time < nowDate) {
          isOpen = 3
        }
        // 抢购状态 type=1/2 距离结束时间  type=3 距离开始时间
        let end_time = ''
        if (isOpen === 1) {
          end_time = nv.start_time
        } else if (isOpen === 2) {
          end_time = nv.end_time
        } else {
          end_time = 0
        }

        // console.log(nv)
        this.getTimeLimit()

        this.setData({
          type: nv.type,
          end_time: end_time,
          inventory_total: nv.inventory_total,
          mini_price: nv.mini_price,
          mini_price_sku: nv.mini_price_sku,
          name: nv.name,
          pic: nv.pic,
          sales_total: nv.sales_total,
          seckill_id: nv.seckill_id,
          seckill_sku_price: seckill_sku_price,
          sku_id: nv.sku_id,
          sku_price: sku_price,
          spu_id: nv.spu_id,
          start_time: nv.start_time,
          content_type: nv.content_type,
          isOpen: isOpen,
        })
      }
    }
  },
  data: {
    type: '',
    end_time: '', // 据优惠结束/开始时间
    inventory_total: '',
    mini_price: '',
    mini_price_sku: '',
    name: '',
    pic: '',
    sales_total: '',
    seckill_id: '',
    seckill_sku_price: '',
    sku_id: '',
    sku_price: '',
    spu_id: '',
    start_time: '',
    content_type: '',
    isOpen: 0, // 倒计时状态
    seckill_time_line: [], // 倒计时时间
    seckill_time_line_day: 0, // 倒计时天数
    timer: '',  // 倒计时值
    count_down: true, // 倒计时控制商品是否抢光
  },
  methods: {
    // 倒计时
    getTimeLimit () {
      // 跳出当前页后倒计时停止
      // let current_route = getCurrentPages()[(getCurrentPages().length)-1].route
      // console.log(current_route)
      // if (current_route.indexOf('timeLimitGoodsDetail') === -1){
      //   return false
      // }
      let self = this
      if(self.data.end_time>0){
        countDown(self.data.end_time)
        let left_time = countDown(self.data.end_time)
        let date_array = []
        let date_day = 0
        if (left_time){
          date_array = left_time.split(":")
          if (date_array[0].indexOf('天') != -1){
            date_day = date_array[0].split('天')[0]
            date_array[0] = date_array[0].split('天')[1]
          }
        }
        self.setData({
          seckill_time_line: date_array,
          seckill_time_line_day: date_day,
        })
        // console.log(this.data)
        // console.log(this.data.seckill_time_line_day)
        if(countDown(self.data.end_time) === '00天00:00:00' || countDown(self.data.end_time) === '00:00:00') {
          if (self.data.isOpen === 2) {
            self.setData({
              count_down: false,
            })
            clearTimeout(self.data.timer)
            return false
          } else {
            // self.getGoodsDetail()
            self.setData({
              count_down: true,
              immediately: false,
              type: 2
            })
          }
        } 
      } else {
        clearTimeout(self.data.timer)
      }
      self.data.timer = setTimeout(function () {
        self.getTimeLimit()
      },1000)
    },
    // 跳转详情
    goDetail(e) {
      let content_type = e.currentTarget.dataset.contentType
      let seckill_id = e.currentTarget.dataset.seckillId
      let spu_id = e.currentTarget.dataset.spuId
      let sku_id = e.currentTarget.dataset.skuId		
      if(parseInt(content_type) === 1) {
        wx.navigateTo({
          url: `/pages/spilkeGroup/timeLimitGoodsDetail/timeLimitGoodsDetail?seckill_id=${seckill_id}&sku_id=${sku_id}&spu_id=${spu_id}`
        });
        // clearTimeout(this.data.timer)
      } else if(parseInt(content_type) === 2) {
        wx.navigateTo({
          url: `/pages/spilkeGroup/timeLimitServiceDetail/timeLimitServiceDetail?seckill_id=${seckill_id}&spu_id=${spu_id}`,
        });
        // clearTimeout(this.data.timer)
      } else if(parseInt(content_type) === 3 || parseInt(content_type) === 4 || parseInt(content_type) === 5) {
        wx.navigateTo({
          url: `/pages/spilkeGroup/timeLimitPurchaseDetail/timeLimitPurchaseDetail?seckill_id=${seckill_id}&card_id=${spu_id}`,
        });
        // clearTimeout(this.data.timer)
      }
    },
  },
  ready() {
    // console.log(111)
  },
})