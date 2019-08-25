import {fetchBrands, fetchModels} from '@/libs/modules/vehicle'

const {globalData, showMessage,cdpReport } = getApp()

Page({
  data: {
    hotBrands: [],
    list: [],
    alphabet: ['#', 'A', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'],
    scrollPosition: 'hot',
    currentPosition: '#',
    activePositions: ['#'],
    models: [],
    models_list: [],
    brandSelection: null,
    brandSelecting: false,
    pannelShow: false,
    modelSelection: null,
    search_text: ''
  },

  // event handle
  scrollTo (positionId) {
    if (this.data.activePositions.indexOf(positionId) > -1) {
      wx.showToast({
        title: positionId,
        icon: 'none',
        duration: 600,
      })
      this.setData({
        scrollPosition: positionId !== '#' ? positionId : 'hot',
        currentPosition: positionId,
      })
    }
  },
  tend (e) {
    const letterPosition = Math.ceil((e.changedTouches[0].pageY - 120) / 16 - 1)
    const positionId = this.data.alphabet[letterPosition]
    this.scrollTo(positionId)
  },
  tmove (e) {
    const letterPosition = Math.ceil((e.changedTouches[0].pageY - 120) / 16 - 1)
    const positionId = this.data.alphabet[letterPosition]
    if (positionId !== this.data.currentPosition) {
      this.scrollTo(positionId)
    }
  },
  changeaAlphabet (e) {
    const positionId = e.currentTarget.dataset.position
    this.scrollTo(positionId)
  },
  selectBrand (e) {
    this.setData({
      brandSelecting: true,
      brandSelection: {
        id: e.currentTarget.dataset.selectionId,
        name: e.currentTarget.dataset.selectionName,
        logo_url: e.currentTarget.dataset.selectionLogo,
      },
    })
    setTimeout(() => {
      this.setData({
        pannelShow: true,
      })
    })
    this.fetchModelList(this.data.brandSelection.id)
  },
  hideBrandPannel () {
    this.setData({
      pannelShow: false,
      brandSelection: {},
    })
    setTimeout(() => {
      this.setData({
        brandSelecting: false,
      })
    }, 300)
  },
  prevent (e) {
    return false
  },
  async fetchModelList (id) {
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await fetchModels(id)
      if (statusCode === 200 && code === 0) {
        data.forEach((item, index, list) => {
          item.isFirstOfFactory = this.isFirstOfFactory(index, list)
        })
        this.setData({
          models: data,
          models_list: data,
        })
      } else {
        showMessage({
          title: '获取车型列表失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('选择车型-fetchModelList:', err)
    }
    wx.hideLoading()
  },
  selectModel (e) {
    const index = e.currentTarget.dataset.modelIndex
    const model = this.data.models[index]
    model.logo = this.data.brandSelection.logo_url
    model.brand_name = this.data.brandSelection.name
    globalData.modelSelection = model
    this.setData({
      modelSelection: e.currentTarget.dataset.modelId,
    })
    wx.navigateTo({
      url: `../vehicleTypeSelector/vehicleTypeSelector?modelId=${this.data.modelSelection}`,
    })
    // cdp-点击跳转页面事件
    let customize = {
      modelId: e.currentTarget.dataset.modelId ? parseInt(e.currentTarget.dataset.modelId) : '',
    }     
    let target = {
      url: 'pages/vehicle/vehicleTypeSelector/vehicleTypeSelector',
    }
    cdpReport(1, e.currentTarget.dataset.cdp, 99, customize, '', target, this.data.enter_page_date)
  },
  // 确认车型选择---只选择了车型的品牌
  async subBrand () {
    let data = {
      carpart_brand_id: this.data.brandSelection.id,
      brand_name: this.data.brandSelection.name,
      brand_logo_url: this.data.brandSelection.logo_url,
    }
    globalData.vehicleSelection = data
    wx.navigateBack({
      delta: 1,
    })
  },
  // utils
  isFirstOfGroup (index, list) {
    const initial = this.getInitial(list[index])
    return !index || initial !== this.getInitial(list[index - 1])
  },
  getInitial (candidate) {
    if (candidate.pinyin) {
      const initial = candidate.pinyin.charAt(0).toUpperCase()
      return candidate.pinyin && (/[A-Z]/.test(initial) ? initial : '#')
    } else {
      return '#'
    }
  },
  isFirstOfFactory (index, list) {
    return !index || list[index].factory.name !== list[index - 1].factory.name
  },
  // 获取输入框的value
  getValue (e) {
    this.setData({
      search_text: e.detail.value
    })
    if (this.data.search_text.length === 0) {
      this.setData({
        models: this.data.models_list
      })
    }
  },
  // 点击完成搜索
  searchVehicle () {
    let arr =[]
    if (this.data.search_text.length > 0) {
      this.data.models_list.forEach(ele => {
        if (ele.name.toLowerCase().indexOf(this.data.search_text) != -1) {
          arr.push(ele)
        }
      })
      this.setData({
        models: arr
      })
    } else {
      this.setData({
        models: this.data.models_list
      })
    }
  },
  async onLoad () {
    wx.hideShareMenu()
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    })     
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    try {
      const {statusCode, data, message, code} = await fetchBrands()
      if (statusCode === 200) {
        globalData.cache = data
        const positions = ['#']
        const list = data.all.map((item, index, list) => {
          item.initial = this.getInitial(item)
          item.isFirstOfGroup = this.isFirstOfGroup(index, list)
          item.isFirstOfGroup && positions.push(item.initial)
          return item
        })
        this.setData({
          hotBrands: data.hot,
          list: list,
          activePositions: positions,
          currentPosition: '#',
        })
      } else {
        showMessage({
          title: '获取品牌数据失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('选择车型-onLoad:', err)
    }
    wx.hideLoading()
  },
  onShow () {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    }) 
  }
})