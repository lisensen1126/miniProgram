// 获取全局应用程序实例对象
const {
  showMessage,
  globalData,
  changeDateTime,
} = getApp()

// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    write_off_data: [],
  },

  // 生命周期函数--监听页面加载
  onLoad(option) {
    wx.getStorage({
      key: 'writeoff',
      success: (res) => {
        let write_off_data = res.data.map(item => {
          item.creat_time = changeDateTime(item.write_off_at)
          item.write_off_item.map(cell => {
            if (cell.item.item_type === 1) {
              let str = ''
              cell.item.sku_attribute.map(x => {
                str += `${x} `
              })
              cell.item.item_title += ` ${str}`
            }
          })
          return item
        })

        this.setData({
          write_off_data,
        })
      }
    })
    this.setData({
      topbarHeight: globalData.topbarHeight
    })
  },
});