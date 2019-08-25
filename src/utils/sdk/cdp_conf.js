const extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
let current_host = '' // 当前小程序的接口访问域名
let current_appid = '' // 当前小程序的appid
let serverUrl = '' // 数据接收地址
if (Object.keys(extConfig).length) {
    current_host = extConfig.host  
    current_appid = extConfig.appId ? extConfig.appId : '' 
} else {
    current_host = process.env.HOST
    current_appid = process.env.APPID ? process.env.APPID : ''
}
if (current_host == 'https://app.chedianai.com') {
    // serverUrl = "https://cdp.vchangyi.com/cgi-bin"
    serverUrl = "https://cdp-test.vchangyi.com/cgi-bin"
} else {
    serverUrl = "https://cdp-test.vchangyi.com/cgi-bin"
}
var conf =  {
    /**
     * 注册在APP全局函数中的变量名，在非app.js中可以通过getApp().sensors(你这里定义的名字来使用)
     */
    name: "cdp",
    /**
     * 应用标识
     */
    appKey: "shell",

    /**
     * 应用密钥
     */
    secretKey: "vchangyi@2019",

    /**
     * 小程序APPID
     */
    appId: current_appid,

    /**
     * 是否打印日志
     *
     * */
    showLog: false,

    /**
     * 是否上报
     */
    isReport:true,


    /**
     *  数据接收地址
     */
    serverUrl: serverUrl,
};

module.exports = conf;