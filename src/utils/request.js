
/**
 * 判断session 是否过期
 * 只服务于 request()
 * _request {function} 需要回调的方法
 * */ 
function checkSession (_request) {
  const {globalData} = getApp();
  let resolve = null
  let reject = null
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  wx.checkSession({
    success: function () {
      // 没有过期
      let code = wx.getStorageSync('tokenWx')
      let codeTimes = wx.getStorageSync('codeTimes')
      let nowTimes = new Date().getTime() - codeTimes
      if (code && nowTimes<=280000) {
        // 4分钟内, 不重新拿 code
        globalData.code = code
        _request && _request()
        resolve()
      } else {
        // 超过4分钟, 重新拿 code
        getCode().then(() => {
          // 成功拿到 code
          _request && _request()
          resolve()
        }, () => {
          // 失败
          reject()
        })
      }
    },
    fail: function () {
      // 已过期 重新拿 code
      getCode().then(() => {
        // 成功拿到 code
        _request && _request()
        resolve()
      }, () => {
        // 失败
        reject()
      })
    }
  })
  return promise
}

/**
 * 微信登陆获取 code
 * 只服务于 checkSession()
 * */ 
function getCode () {
  const {globalData, showMessage} = getApp()
  let resolve = null
  let reject = null
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  wx.login({
    success: (res) => {
      globalData.code = res.code
      // code 写缓存 保存1小时
      wx.setStorageSync('tokenWx', res.code)
      wx.setStorageSync('codeTimes', new Date().getTime())
      resolve(res)
    },
    fail: (err) => {
      console.log('wxlogin 登录失败')
      showMessage({
        title: 'Sorry！我还不知道你是谁',
        content: '快重启小程序，注册下告诉我你是谁',
      })
      reject(err)
    },
  })
  return promise
}

async function isRegistered ( _request ) {
  const {globalData} = getApp();
  let resolve = null
  let reject = null
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  if (globalData.is_registered !== 2) {
    resolve(true)
  }

  try {
    await checkSession()
    const {statusCode, data, code, message} = await request('isRegister', {
      method: 'POST',
      data: {
        'code': globalData.code,
      }
    })
    if (statusCode === 200 && parseInt(code) === 0) {
      // status(0=未注册，1=已注册)
      globalData.is_registered = data.status
      globalData.token = data.token
      globalData.userInfo = data
      // store_name公司名称
      this.globalData.ep_store_name = data.store_name
      // 获取门店后台是否开启推荐公众号功能
      this.globalData.official_is_open = data.is_open
      // 获取该用户是否关注了公众号
      this.globalData.official_is_follow = data.is_follow
      // 如果注册过 就可以自己获取个人信息

      if(data.status ==1) {
        globalData.current_customer_id = data.customer_id
        // token 失效回调
        _request && _request()
        console.log('登录成功')
      } else {
        // 防止极端情况
        wx.hideLoading()
      }
      resolve(true)
    } else{
      console.error('身份获取失败', message)
      reject('身份获取失败')
    }
  } catch (err) {
    console.error('app-isRegistered:', err)
    reject('身份获取失败')
  }
  return promise
}

/**
 * 网络状况
 * 只服务于 request()
 * */ 
function detectNetwork () {
  let resolve = null
  let reject = null
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  wx.getNetworkType({
    success (res) {
      // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
      if (res.networkType === 'none') {
        reject()
      } else {
        resolve()
      }
    },
  })
  return promise
}


/**
 * 网络请求
 * path {string} 地址
 * options {object} 参数对象
 * contentType {string} 表头, 内容类型
 * */ 
function request (path, options, contentType = 'application/json') {
  const {globalData, showMessage} = getApp();
  let resolve
  let reject
  const requesting = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  // 初始化 options
  options = {
    method: 'GET',
    header: {
      'content-type': contentType,
      'Accept': 'application/json',
    },
    data: undefined,
    needToken: true,
    ...options,
  }
  // 接口传参加入当前门店的id
  let current_store_id = wx.getStorageSync('current_store_id')
  if (options.data && current_store_id && !options.data.no_store) {
    options.data.store_id = current_store_id
  } else if (options.data && current_store_id && options.data.no_store) {
    delete(options.data['no_store']);
  } else if (current_store_id) {
    options.data = {
      store_id: current_store_id
    }
  }

  // 过滤 不存在健值的字段
  if (options.data) {
    options.data = Object.keys(options.data).reduce((result, key) => {
      if (options.data[key] !== undefined && options.data[key] !== null && (!Array.isArray(options.data[key]) || options.data[key].length) ) {
        result[key] = options.data[key]
      }
      return result
    }, {})
  }
  
  // 微信请求
  const $request = () => wx.request({
    url: globalData.host + globalData.apiRoot + path,
    data: options.data,
    method: options.method,
    header: {
      'Authorization': (globalData.token?`Bearer ${globalData.token}`:''), 
      'Shop-Hash': globalData.shopHash, 
      ...options.header
    },
    success: ({data, statusCode, header}) => {
      // 888888 = token失效,  188888 = code失效
      if (parseInt(data.code) === 888888) {
        // token 无效, 缺少token
        globalData.token = ''
        isRegistered($request)
      } else {
        resolve({
          ...data,
          statusCode,
          header,
        })
      }
    },
    fail: (err) => {
      reject(err)
    },
  })

  detectNetwork().then( _ => {
    $request()
  }).catch( _ => {
    showMessage({
      title: '你的网络好像罢工了',
      content: '我不喜欢网络罢工，快去检查下吧',
    })
  })

  return requesting
}

/**
 * 网络请求(加标示)
 * module {string} 标示
 * 
 * 实例方法
 * path {string} 地址
 * options {object} 参数对象
 * contentType {string} 表头, 内容类型
 * */ 
const createModuleRequest = module => {
  return (path, options, contentType) => {
    if (module) {
      return request(`${module}/${path}`, options, contentType)
    } else {
      return request(`${path}`, options, contentType)
    }
  }
}

export { checkSession, getCode, request, createModuleRequest, isRegistered};
