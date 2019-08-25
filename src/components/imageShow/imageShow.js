const { globalData } = getApp()
Component({
  properties: {
    // 路径
    src: {
      type: String,
      value: '',
      observer: ''
    },
    width: {
      type: String,
      value: '',
    },
    height: {
      type: String,
      value: '',
    },
    quality: { // 新图的图片质量。取值范围为1-100，默认75
      type: String,
      value: '75',
    },
    format: { // 图片格式。支持jpg、gif、png、webp等
      type: String,
      value: '',
    },
    mode: { // 图片格式。支持jpg、gif、png、webp等
      type: String,
      value: 'scaleToFill',
    },
  },
  data: {
    url: ''
  },
  methods: {
    /**
     * 图片格式化
     * url 图片路径
     * w、h 裁剪的宽、高
     * q 压缩图片质量(1-100) 默认为 75
     * f 是否把图片转为 jpg, 默认为 true
     */
    image (url, w, h, q = 75, f = 'jpg') {
      // 格式化路径
      let path = url.split('?')[0] + '?imageMogr2/auto-orient/gravity/center'
      // 屏幕宽度
      let screenW = globalData.systemInfo.screenWidth
      /**
       * 1 缩放
       * 无宽, 有高, 一般宽为100%, 按屏幕宽度等比缩放
       * 有宽, 无高, 按给的宽等比缩放
       * 有宽, 有高, 不用废话
       *  */

      if (!w && h)  path += `/thumbnail/${screenW - 20}x`
      if (w && !h)  path += `/thumbnail/${w}x`
      if (w && h)   path += `/thumbnail/${w}x${h}`

      /**
       * 2 裁剪
       * 无宽, 有高, 一般宽为100%, 按屏幕宽度等比缩放
       * 有宽, 无高, 按给的宽等比缩放
       * 有宽, 有高, 不用废话
       *  */

      if (!w && h)  path += `/crop/x${h}`
      if (w && !h)  path += `/crop/${w}x`
      if (w && h)   path += `/crop/${w}x${h}`

      /**
       * 3 压缩
       *  */
      if (q)  path += `/quality/${q}`

      /**
       * 4 格式
       * 默认是要转为 jpg, 缩小图片大小
       * 如果不用 f 传值 false
       *  */
      if (f)  path += `/format/${f}`

      return path
    }
  },
  // 在组件实例进入页面节点树时执行
  // attached () {
  //   const url = this.image(this.data.src, this.data.width, this.data.height, this.data.quality, this.data.format)
  //   this.setData({
  //     url: url
  //   })
  // },
})
