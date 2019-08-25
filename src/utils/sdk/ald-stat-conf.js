// 获取当前小程序的ext.josn配置
const extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
// 当前域名初始化
let current_host = ''
if (Object.keys(extConfig).length) {
  current_host = extConfig.host
} else {
  current_host = process.env.HOST
}
if (current_host == 'https://app.chedianai.com') {
  exports.app_key = "1d4e70ce33a05d39256198a90e4d2382"; //C版key值，请在此行填写从阿拉丁后台获取的appkey
} else {
  exports.app_key = "e1c91bad6a13093213fdc893e85ccbf2"; //请在此行填写从阿拉丁后台获取的appkey
}
exports.getLocation = false; //默认不获取用户坐标位置
exports.plugin = false;  //您的小程序中是否使用了插件。根据是否启用插件会有不同的接入方式，请参考文档文档。

