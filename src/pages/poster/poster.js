
// 获取全局应用程序实例对象
import {
  getPosterDetailApi,
  changeImgAPi,
} from '@/libs/modules/index'
const {globalData, showMessage, isRegistered} = getApp()
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    page_title: '生成海报',
    card_url: '',
    canClick: true,
    showHome: true,
    info: {
      img_pic: '',
      name: '',
      type: 1,
      price: '',
      limit_price: '',
      num: '',
    }, // 商品信息
    qy_icon: '',
    phone_icon: 'https://oss1.chedianai.com/phone-icon.png',
    local_icon: 'https://oss1.chedianai.com/local-icon.png',
    bg_pic: '',
    store_name: '',
    address: '',
    phone: '0',
    type: 1,
    is_loading: false,
    url: globalData.host + globalData.apiRoot + 'common/get_photo?url='
  },
  async onLoad (options) {
    console.log(options, '11111')
    let params = {}
    let poster = wx.getStorageSync('poster')
    // 分享
    if (options.share && options.share == 1) {
      let info = wx.getStorageSync('poster-info')
      info.img_pic = info.image_url
      info.limit_price = info.price
      info.price = info.origin_price
      if (options.type == 5) {
        // 养护卡
        params = {
          card_id: poster.card_id,
          group_product_id: poster.group_product_id,
          type: 2,
          path: 'pages/spilkeGroup/groupSharePage/groupSharePage',
          from_type: poster.from_type,
          order_no: poster.order_no,
          serve_type: 3,
        }
        info.type = 3
      }
      if (options.type == 1) {
        // 服务
        params = {
          spu_id: poster.spu_id,
          group_product_id: poster.group_product_id,
          serve_type: 2,
          type: 2,
          from_type: poster.from_type,
          order_no: poster.order_no,
          path: 'pages/spilkeGroup/groupSharePage/groupSharePage',
        }
        info.type = 2
      }
      if (options.type == 2) {
        // 商品
        params = {
          spu_id: poster.spu_id,
          sku_id: poster.sku_id,
          group_product_id: poster.group_product_id,
          from_type: poster.from_type,
          order_no: poster.order_no,
          serve_type: 1,
          type: 2,
          path: 'pages/spilkeGroup/groupSharePage/groupSharePage',
        }
        info.type = 1
      }
      this.setData({
        top_height: globalData.topbarHeight,
        info: info,
        type: 2,
      })
    } else  {
      // 养护卡
      if (options.type == 5) {
        if (options.seckill && options.seckill == 1) {
          // 秒杀
          params = {
            card_id: poster.id,
            seckill_id: poster.seckill_id,
            type: 1, // 参数秒杀海报
            path: 'pages/spilkeGroup/timeLimitPurchaseDetail/timeLimitPurchaseDetail',
            serve_type: 3,
          }
          let info = {
            type: 3, // 1商品 2服务 3养护卡 图片的tip
            name: poster.name,
            limit_price: poster.price,
            price: poster.origin_price,
            img_pic: poster.image_url,
          }
          this.setData({
            top_height: globalData.topbarHeight,
            info: info,
            type: 1, // 1秒杀 2 拼团 5 养护卡
          })
        } else if(options.group && options.group == 1){
          // 拼团
          params = {
            card_id: poster.card_id,
            group_product_id: poster.group_product_id,
            type: 2,
            path: 'pages/spilkeGroup/groupPurchaseDetail/groupPurchaseDetail',
            serve_type: 3,
          }
          let info = {
            type: 3,
            name: poster.name,
            limit_price: poster.price,
            price: poster.origin_price,
            img_pic: poster.image_url,
            num: poster.num
          }
          this.setData({
            top_height: globalData.topbarHeight,
            info: info,
            type: 2,
          })
        } else{
          // 普通
          params = {
            card_id: poster.id,
            type: 5,
            path: 'pages/card/purchaseDetails/purchaseDetails',
            serve_type: 3,
          }
          let info = {
            type: 3,
            name: poster.name,
            limit_price: poster.price,
            price: poster.origin_price,
            img_pic: poster.image_url,
          }
          this.setData({
            top_height: globalData.topbarHeight,
            info: info,
            type: 5,
          })
        }
      }
      // 商品
      if (options.type == 2) {
        // 秒杀
        let info = {
          type: 1,
          name: poster.name,
          limit_price: poster.price,
          price: poster.origin_price,
          img_pic: poster.image_url,
          num: poster.num || '',
        }
        let type = 2 // 拼团 2 秒杀 1
        if (options.seckill && options.seckill == 1) {
          params = {
            spu_id: poster.spu_id,
            sku_id: poster.sku_id,
            seckill_id: poster.seckill_id,
            serve_type: 1,
            type: 1,
            path: 'pages/spilkeGroup/timeLimitGoodsDetail/timeLimitGoodsDetail',
          }
          type = 1 // 秒杀
        }
        // 拼团
        if (options.group && options.group == 1) {
          params = {
            spu_id: poster.spu_id,
            sku_id: poster.sku_id,
            group_product_id: poster.group_product_id,
            serve_type: 1,
            type: 2,
            path: 'pages/spilkeGroup/groupGoodsDetail/groupGoodsDetail',
          }
        }
        this.setData({
          top_height: globalData.topbarHeight,
          info: info,
          type: type,
        })
      }   
      // 服务
      if (options.type == 1) {
        let info = {
          num: poster.num || '',
          type: 2,
          name: poster.name,
          limit_price: poster.price,
          price: poster.origin_price,
          img_pic: poster.image_url,
        }
        let type = 2
        // 秒杀
        if (options.seckill && options.seckill == 1) {
          params = {
            spu_id: poster.spu_id,
            seckill_id: poster.seckill_id,
            serve_type: 2,
            type: 1,
            path: 'pages/spilkeGroup/timeLimitServiceDetail/timeLimitServiceDetail',
          }
          type = 1
        }
        // 拼团
        if (options.group && options.group == 1) {
          params = {
            spu_id: poster.spu_id,
            group_product_id: poster.group_product_id,
            serve_type: 2,
            type: 2,
            path: 'pages/spilkeGroup/groupServiceDetail/groupServiceDetail',
          }
        }
        this.setData({
          top_height: globalData.topbarHeight,
          info: info,
          type: type,
        })
      }
    }
    this.getDetail(params)
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 2) {
      await isRegistered()
    }
  },
  onShow () {
  },
  /**
   * 获取二维码
   * @param {请求参数} params 
   */
  async getDetail (params) {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {
        statusCode,
        data,
        code,
        message,
      } = await getPosterDetailApi(params)
      if (statusCode === 200 && code === 0) {
        this.setData({
          store_name: data.store.data.store_name,
          address: data.store.data.address,
          phone: data.store.data.business_phone,
          qy_icon: data.qr_code,
          bg_pic: data.poster,
          is_loading: true,
        })
        this.createShareImage()
      } else {
        showMessage({
          title: '获取二维码背景详情失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购卡详情-getCardDetail', err)
    }
    wx.hideLoading()
  },
  // // 查看大图
  // lookImg () {
  //   if (!this.data.card_url) {
  //     wx.showToast({
  //       title: '图片生成中...,请稍后再点击尝试',
  //       icon: 'none',
  //       duration: 1000,
  //       mask: true,
  //     })
  //     return
  //   }
  //   wx.previewImage({
  //     current: this.data.card_url, // 当前显示图片的http链接
  //     urls: [this.data.card_url], // 需要预览的图片http链接列表
  //   })
  // },
  // 生成分享图
  createShareImage () {
    let self = this
    let p = []
    p.push(self.wxGetImageInfo(self.data.info.img_pic)) // 商品图片
    p.push(self.wxGetImageInfo(self.data.qy_icon)) // 小程序二维码
    p.push(self.wxGetImageInfo(self.data.bg_pic)) // 背景图
    p.push(self.wxGetImageInfo(self.data.phone_icon)) // 电话icon
    p.push(self.wxGetImageInfo(self.data.local_icon)) // 地点icon
    self.data.info.type === 2 ? p.push(self.wxGetImageInfo('https://oss1.chedianai.com/images/assets/service-icon.png')) : self.data.info.type === 1 ? p.push(self.wxGetImageInfo('https://oss1.chedianai.com/images/assets/goods-icon.png')) : p.push(self.wxGetImageInfo('https://oss1.chedianai.com/images/assets/card-icon.png')) // 商品icon
    Promise.all(p)
      .then(res => {
        // 开始绘画
        const ctx = wx.createCanvasContext('myCanvas')
        // 文字排版格式
        ctx.setTextBaseline('top')
        // bac
        if (res[2].path) ctx.drawImage(res[2].path, 0, 0, 690, 980)
        // 小程序二维码
        if (res[1].path) {
          ctx.drawImage(res[1].path, 540, 830, 120, 120)
        }
        // 商品图片
        if (res[0].path) {
          ctx.drawImage(res[0].path, 60, 308, 214, 134)
        }
        // 商品的类型
        if (res[5].path) {
          ctx.drawImage(res[5].path, 218, 304, 60, 22)
        }
        // 地址icon
        if (res[4].path) {
          ctx.drawImage(res[4].path, 30, 896, 24, 24)
        }
        // // 电话icon
        if (res[3].path) {
          ctx.drawImage(res[3].path, 30, 926, 24, 24)
        }
        // 商品的名称
        ctx.fillStyle = '#404040'
        ctx.font = '22px sans-serif'
        if (self.data.info.name) {
          if (self.data.info.name.length > 18) {
            let name1 = self.data.info.name.substr(0, 18)
            let name2 = ''
            if (self.data.info.name.length > 36) {
              name2 = self.data.info.name.substr(18, 18) + '...'
            } else {
              name2 = self.data.info.name.substr(18)
            }
            ctx.fillText(name1 + '', 290, 308)
            ctx.fillText(name2 + '', 290, 342)
          } else {
            ctx.fillText(self.data.info.name + '', 290, 308)
          }
        }
        // 折扣价 1 拼团 2秒杀 3 养护卡
        let text = self.data.type === 2 ? '拼团价：¥' + self.data.info.limit_price : self.data.type === 1 ? '秒杀价：¥' + self.data.info.limit_price : '¥' + self.data.info.limit_price
        let width1 = ctx.measureText(text).width
        ctx.fillStyle = '#E50113'
        ctx.font = '26px sans-serif'
        ctx.fillText(text, 290 - 0.5, 412)
        ctx.fillText(text, 290, 412 - 0.5)
        ctx.fillText(text, 290 + 0.5, 412)
        ctx.fillText(text, 290, 412 + 0.5)
        // // 原价
        ctx.font = '18px sans-serif'
        ctx.fillStyle = '#A6A6A6'
        let text2 = '¥' + self.data.info.price
        if (self.data.type == 5) text2 = '门市价：' + text2
        let w = 290 + width1 + 30
        let width2 = ctx.measureText(text2).width
        ctx.fillText(text2, w, 420)
        // 原价中间线
        ctx.beginPath()
        ctx.moveTo(w - 2, 429)
        ctx.lineTo(w + width2 + 2, 429)
        // 设置画线的颜色
        ctx.strokeStyle = '#A6A6A6'
        ctx.lineWidth = 2
        // 沿着坐标点顺序的路径绘制直线
        ctx.stroke()
        // 关闭当前的绘制路径
        ctx.closePath()
        // 门店的名称
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '32px sans-serif'
        // 加粗
        ctx.fillText(self.data.store_name, 30 - 0.5, 842)
        ctx.fillText(self.data.store_name, 30 , 842 - 0.5)
        ctx.fillText(self.data.store_name, 30 + 0.5, 842)
        ctx.fillText(self.data.store_name, 30 , 842 + 0.5)
        // 地址
        ctx.font = '20px sans-serif'
        ctx.fillText(self.data.address, 58, 894)
        // 电话
        ctx.fillText(self.data.phone, 58, 926)
        // 是否为拼团
        if (self.data.type === 2) {
          ctx.strokeStyle = '#E30414'
          ctx.strokeRect(290, 376, 53, 23)
          ctx.fillStyle = '#DD1D21'
          ctx.font = '16px sans-serif'
          ctx.fillText(self.data.info.num + '人团', 294, 378)
        }
        ctx.draw()
        setTimeout(() => {
          self.exportImg('myCanvas', 690, 980)
        }, 1300)
      })
      .catch((err) => {
        console.log(err)
        wx.showToast({
          title: '分享图生成失败！',
          icon: 'none',
          duration: 1000,
          mask: true,
        })
      })
  },
  // 导出图片
  exportImg (idn, w, h) {
    let self = this
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: w,
      height: h,
      destWidth: w,
      destHeight: h,
      canvasId: idn,
      success: function (res) {
        wx.getImageInfo({
          src: res.tempFilePath,
          success: function (res) {
            self.setData({
              card_url: res.path,
            })
          },
        })
      },
      fail (err) {
        console.error('ShareBill组件-exportImg', err)
      },
      complete (res) {},
    })
  },
  // 保存到相册
  savesharePicture () {
    if (!this.data.card_url) {
      wx.showToast({
        title: '图片生成中...,请稍后再点击尝试',
        icon: 'none',
        duration: 1000,
        mask: true,
      })
      return
    }
    let self = this
    if (self.data.canClick) {
      self.data.canClick = false
      wx.saveImageToPhotosAlbum({
        filePath: self.data.card_url,
        success (res) {
          wx.showToast({
            title: '保存成功',
            duration: 2000,
          })
        },
        fail (res) {
          console.log(res, '拒绝')
          // 判断是否获得了用户保存相册授权
          wx.getSetting({
            success: res => {
              if (!res.authSetting['scope.writePhotosAlbum']) {
                self.openConfirm()
              }
            },
          })
          self.data.canClick = true
        },
      })
    }
  },
  openConfirm () {
    let self = this
    wx.showModal({
      content: '检测到您没打开保存图片到相册的权限，是否去设置打开？',
      confirmText: '确认',
      cancelText: '取消',
      success: function (res) {
        // 点击“确认”时打开设置页面
        if (res.confirm) {
          wx.openSetting({
            success (res) {
              // 设置成功直接下载
              if (!!res.authSetting && res.authSetting['scope.writePhotosAlbum']) {
                self.savesharePicture()
              }
            },
          })
        }
      },
    })
  },
  // 获取图片
  wxGetImageInfo (url) {
    if (url.indexOf('https') === -1) {
      url = url.replace("http:", "https:")
    }
    return new Promise(resolve => {
      wx.getImageInfo({
        src: url,
        success: function (res) {
          resolve(res)
        },
        fail: function () {
          wx.showToast({
            title: '获取图片信息失败！',
            icon: 'none',
            duration: 1000,
            mask: true,
          })
          throw new Error(url)
        },
      })
    })
  },
})
