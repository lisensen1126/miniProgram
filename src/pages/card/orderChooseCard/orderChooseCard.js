const { globalData } = getApp();

Page({
	// 页面的初始数据
	data: {
    card_list: [],
    current_card_index: 0, // 默认选中 index
    current_card: [] ,// 当前选中卡片的项目列表
    choosed_card: null, // 选中的卡
    choosed_item: null, // 选中的 item
  },
  /**
   * swiper 改变触发
   * @param {*} e 
   */
  swiperChange(e) {
    let index = e.detail.current
    this.setData({
      current_card: this.data.card_list[index]
    })
  },
  /**
   * 选中项目
   * @param {*} e 选中项目
   */
  chooseItem(e) {
    let choose_item = e.currentTarget.dataset.item
    // 如果该项目使用完了
    if(choose_item.num == choose_item.used_num && choose_item.num != 0){
      return
    }
    // 如果未激活
    if(choose_item.is_activation != 1) {
      return
    }
    // 如果点击的已选中 =》 清空id, 否则 赋值id
    if(this.data.choosed_item && this.data.choosed_item.id == choose_item.id && this.data.choosed_card.upkeep_no == this.data.current_card.upkeep_no){
      this.setData({
        choosed_card: null,
        choosed_item: null,
      })
    }else{
      this.setData({
        choosed_card: this.data.current_card,
        choosed_item: choose_item
      })
    }
  },
  // 确定选中
  chooseItemIsOk (){
    wx.setStorageSync('CARD_CARD', this.data.choosed_card)
    wx.setStorageSync('CARD_ITEM', this.data.choosed_item)
    wx.navigateBack({
      delta: 1
    })
  },
  // 跳转购卡页面
  goBuyCard (e) {
    wx.navigateTo({
      url: '/pages/card/cardCenter/cardCenter',
    })
  },
	onLoad() {
    this.setData({
			topbarHeight: globalData.topbarHeight
		})
    wx.hideShareMenu()
	},
	onShow() {
    let card_list = wx.getStorageSync('CARDLIST')
    let choosed_card = wx.getStorageSync('CARD_CARD')
    let choosed_item = wx.getStorageSync('CARD_ITEM')
    let index = 0
    if(choosed_card){
      card_list.forEach((card, i) => {
        if(card.upkeep_no == choosed_card.upkeep_no){
          index = i
        }
      });
    }
    this.setData({
      card_list: card_list,
      choosed_card: choosed_card,
      choosed_item: choosed_item,
      current_card_index: index,
      current_card: card_list[index]
    })
  }
})