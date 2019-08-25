export function scaleImage (url, mode, width, height) {
    // imageMogr2/auto-orient,是为了解决ios图片倒置90度问题，后台如果要用imageMogr2压缩图片展示，就不需要这个参数了
    if (url.indexOf('?imageMogr2/auto-orient') > -1) {
      url = url.replace('?imageMogr2/auto-orient', '')
    }
    return `${url}?imageView2/${mode}/w/${width}/h/${height}`
  }
  
  export function parseDistance (distance) {
    if (distance < 1000) {
      return parseFloat(distance).toFixed(1) + 'm'
    } else {
      return distance / 1000 > 99 ? '99+km' : (distance / 1000).toFixed(1) + 'km'
    }
  }
  
  // 定义跳转链接
  // key: fromUrl
  // fromUrl: {
  //   path: 'xxxxx',
  //   needToken: false,
  //   params: {
  //     a: 'a',
  //     b: 'b',
  //   }
  // }
  export function redirectUrl (fromUrl) {
    let url = null
    if (fromUrl) {
      url = fromUrl.params ? `${fromUrl.path}?${setParams(fromUrl.params)}` : fromUrl.path
    }
  
    const switchArr = [
      '/pages/index/index',
      '/pages/personal/personal',
      '/pages/mall/itemCategories/itemCategories',
    ]
    if (switchArr.includes(url) || !url) {
      wx.switchTab({
        url: url || '/pages/index/index', // 跳转到首页
      })
    } else {
      wx.redirectTo({
        url: url,
      })
    }
  }
  
  export function setParams (params) {
    const queries = []
    const filterParams = Object.keys(params).reduce((result, key) => {
      if (
        // not undefined
        params[key] !== undefined &&
        // not null
        params[key] !== null &&
        // not an data array
        (!Array.isArray(params[key]) || params[key].length)
      ) {
        result[key] = params[key]
      }
      return result
    }, {})
    for (let key in filterParams) {
      if (filterParams[key]) {
        queries.push(`${key}=${params[key]}`)
      }
    }
  
    return queries.join('&')
  }
  