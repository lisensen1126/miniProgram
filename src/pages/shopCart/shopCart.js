import {shopList, editShop, deleteShop, shopSelected} from '@/libs/modules/shopCart'
import checkBtnActive from '../../images/shopCart/check-btn-active.png'
import checkBtn from '../../images/shopCart/check-btn.png'
import invalid from '../../images/shopCart/invalid.png'


// 获取全局应用程序实例对象
const {showMessage, globalData } = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		// 图片
		images: {
      checkBtn: checkBtn,
      checkBtnActive: checkBtnActive,
      invalid: invalid,
      top_height: 0, // padding高度
		},
    // 全选
    all_check: 2,
    // 编辑
    isEdit: 1,
    // 删除
    isDelete: false,
		// 列表
		list: [],
		limit: 10,
		page: 1,
    isAllLoaded: false,
    sumProductNum: 0,
    // 订单总价
    total_money: '0.00',
    pageShow: false,
    showHome: false,
	},

  /*****************购物车列表*/
  async getShopList () {
    let self = this
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message, meta} = await shopList({
        limit: self.data.limit,
        page: self.data.page,
      })
      if (statusCode === 200 && parseInt(code) === 0) {
        const lastData = this.data.list
        data.forEach(function (item) {
          // 格式化商品金额(接口返回的数据单位：分)
          item.unit_price = item.unit_price/100
        })
        lastData.splice(lastData.length, 0, ...data)
        let all_checked = 1
        lastData.forEach((v)=>{
          if (v.selected === 2){
            all_checked = 2
          }
        })
        this.setData({
          list: lastData,
          all_check: all_checked,         
          meta,
        })
        this.data.limit = 10
        this.data.page = meta.current_page+1
        this.data.isAllLoaded = lastData.length >= parseInt(meta.total)
        this.changeTotalMoney()
      } else {
        showMessage({
          title: '获取购物车列表失败',
          content: `${message}`,
        })
      }
      wx.hideLoading()
    } catch (err) {
      console.error('购物车-getShopList:', err)
    }
    wx.hideLoading()
    this.setData({
      pageShow: true
    })
  },

  // 修改商品、服务选中状态
  changeItemState(e) {
	  let is_invalid = parseInt(e.currentTarget.dataset.item.is_invalid)
    // 失效的商品，结算不可点击
    if (is_invalid === 2 && this.data.isEdit === 1) {
	    return false
    }
    // 查询当前项
    function checkItem(item) {
      return item.shop_car_id === e.currentTarget.dataset.item.shop_car_id
    }
    let index = this.data.list.findIndex(checkItem)
    let item = "list["+index+"].selected"
    this.setData({
      [item]: (e.currentTarget.dataset.item.selected === 1 ? 2 : 1),
    })

    this.isAllCheck()
    this.changeTotalMoney()
    // 更新商品选中状态
    this.shopSelected([this.data.list[index].shop_car_id], this.data.list[index].selected)
  },

  // 动态勾选全选
  isAllCheck() {
    // console.log(this.data.isEdit, '编辑')
    let list = this.data.list
    if (this.data.isEdit === 1) {
      list = this.data.list.filter((ele) => {
        return ele.is_invalid !== 2
      })
    }
    let all_check = 1
	  list.forEach(function (listItem) {
      if (listItem.selected === 2) {
        all_check = 2
        return false
      }
    })
    this.setData({
      all_check: all_check
    })
  },

  /****************顶部按钮操作*/
  // 全选操作
  allCheck() {
    let self = this
    this.setData({
      all_check: self.data.all_check === 1 ? 2 : 1
    })
    this.changeAllCheck()
    let ids = []
    this.data.list.forEach(v => {
      ids.push(v.shop_car_id)
    })
    this.shopSelected(ids, this.data.all_check)

  },
  changeAllCheck() {
    let self = this
    let changeListState = this.data.list
    let total_amount = 0
    let sumProductNum = 0
    changeListState.forEach(function (item) {
      if (self.data.isEdit === 2) {
        item.selected = self.data.all_check
      } else if (self.data.isEdit === 1 && item.is_invalid === 1) {
        item.selected = self.data.all_check
      }
      // 被选中的未失效的商品、服务
      if (item.selected === 1 && item.is_invalid === 1) {
        total_amount += item.quantity * item.unit_price
        sumProductNum += parseInt(item.quantity)
      }
    })
    this.setData({
      list: changeListState,
      total_money: total_amount.toFixed(2),
      sumProductNum: sumProductNum
    })
  },
  // 编辑、完成按钮操作
  editFun() {
    let self = this
    // 清空全选和每一项的选中状态
    this.setData({
      isEdit: self.data.isEdit === 1 ? 2 : 1,
    })
    let list = this.data.list
    let total_amount = 0
    this.setData({
      list: list,
      total_money: total_amount.toFixed(2),
      sumProductNum: self.data.all_check === 2 ? this.data.list.length : 0
    })
    this.isAllCheck()
    // 非编辑状态时更新时总价重新计算
    if (this.data.isEdit === 1){
      this.changeTotalMoney()
    }
  },

  /****************修改购物车商品*/
	// 修改商品、服务数量
  changeItemNum(e) {
    // 查询当前项
    function checkItem(item) {
      return item.shop_car_id === e.currentTarget.dataset.item.shop_car_id
    }
		let index = this.data.list.findIndex(checkItem)
    let item = "list["+index+"].quantity"
    // 处于最大值且加状态不处理
    if(this.data.list[index].quantity === 999 && e.currentTarget.dataset.number > 0){
      return false
    }
    if (e.currentTarget.dataset.number<0 && this.data.list[index].quantity<=1) {
      this.setData({
        [item]: 1,
      })
      return false
    } else if(e.currentTarget.dataset.number>0){
      this.setData({
        [item]: this.data.list[index].quantity<999?this.data.list[index].quantity+e.currentTarget.dataset.number:999,
      })
    } else if(e.currentTarget.dataset.number<0){
      this.setData({
        [item]: this.data.list[index].quantity+e.currentTarget.dataset.number
      })
    }
    this.changeTotalMoney()
    // 修改购物车商品数量---请求接口
    if (this.data.list[index].quantity > 0) {
      this.editShopCart(e, index)
    }
  },

  // 修改商品、服务数量--失去焦点
  blurItemNumInput(e) {
    let shop_car_id = e.currentTarget.dataset.item.shop_car_id
    // 查询当前项
    function checkItem(item) {
      return item.shop_car_id === shop_car_id
    }
    let index = this.data.list.findIndex(checkItem)
    let item = "list["+index+"].quantity"
    if (e.detail.value<=1 || !e.detail.value) {
      this.setData({
        [item]: 1,
      })
    }
    this.changeTotalMoney()
  },

	// 修改商品、服务数量--input
  changeItemNumInput(e) {
    let shop_car_id = e.currentTarget.dataset.item.shop_car_id
    // 查询当前项
    function checkItem(item) {
      return item.shop_car_id === shop_car_id
    }
		let index = this.data.list.findIndex(checkItem)
    let item = "list["+index+"].quantity"
    if (e.detail.value == 0) {
      e.detail.value = ''
    } else if (e.detail.value > 999){
      e.detail.value = 999
    }
    this.setData({
      [item]: parseInt(e.detail.value),
    })
    this.changeTotalMoney()
    // 修改购物车商品数量---请求接口
    if (this.data.list[index].quantity > 0) {
      this.editShopCart(e, index)
    }
  },

	// 修改商品、服务数量
  changeTotalMoney() {
    let total_money = 0
    let sumProductNum = 0
    this.data.list.forEach(function (item) {
      if (item.selected === 1 && item.is_invalid === 1) {
        total_money += item.quantity * item.unit_price
        sumProductNum += parseInt(item.quantity)
      }
    })
    this.setData({
		  total_money: (total_money).toFixed(2),
      sumProductNum: sumProductNum,
	  })
  },

  // 修改购物车商品
  async editShopCart (e, index) {
    try {
      let item = {
        shop_car_id: e.currentTarget.dataset.item.shop_car_id,
        quantity: this.data.list[index].quantity,
        unit_price: e.currentTarget.dataset.item.unit_price*100,
      }      
      wx.showLoading({
        title: '加载中...',
        mask: true,
      })
      const {statusCode, data, code, message} = await editShop(item)
      if (statusCode === 200 && parseInt(code) === 0) {
        if (message === 'success') {
          wx.hideLoading()
        }
      } else {
        showMessage({
          title: '更新购物车商品失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购物车-editShopCart:', err)
    }
    wx.hideLoading()
  },

  /**
   * 取消、选择购物车商品状态
   * @param ids 对应项集合
   * @param selected 选中状态
   * @returns {Promise<void>}
   */
  async shopSelected (ids, selected) {
    try {
      let params = {
        ids: ids,
        selected: selected
      }
      wx.showLoading({
        title: '加载中...',
        mask: true,
      })
      const {statusCode, code, message} = await shopSelected(params)
      if (statusCode === 200 && parseInt(code) === 0) {
        if (message === 'success') {
          wx.hideLoading()
        }
      } else {
        showMessage({
          title: '更新购物车商品选择状态失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购物车-shopSelected:', err)
    }
    wx.hideLoading()
  },

  /****************删除商品*/
  // 删除弹窗
  goDelete() {
    let isCanDelete = false
    this.data.list.forEach(function (listItem) {
      if (parseInt(listItem.selected) === 1) {
        isCanDelete = true
        return false
      }
    })
    let delete_cart_num = 0
    this.data.list.forEach(function (listItem) {
      if (parseInt(listItem.selected) === 1) {
        delete_cart_num ++
      }
    })
    if (isCanDelete) {
      this.setData({
        isDelete: !this.data.isDelete,
        delete_cart_num: delete_cart_num
      })
    } else {
      wx.showToast({
        title: '暂无可删除项',
        icon: 'none',
      })
    }
  },
	// 删除弹窗的回调
  deleteItem() {
    this.setData({
      isDelete: !this.data.isDelete
    })
    let shop_cart_ids = []
    // 获取选中项id
    this.data.list.forEach(function (listItem) {
      if (parseInt(listItem.selected) === 1) {
        shop_cart_ids.push(listItem.shop_car_id)
      }
    })
    let currentList = this.data.list
    for(let i = 0; i<currentList.length; i++){
      shop_cart_ids.forEach(function (id) {
        if (currentList[i].shop_car_id === id) {
          currentList.splice(i,1)
        }
      })
    }
    this.setData({
      list: currentList
    })
    this.deleteShopCart(shop_cart_ids)
  },
	// 删除购物车商品
  async deleteShopCart (shop_cart_ids) {
    let self = this
    let item = {
      shop_car_id: shop_cart_ids
    }
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await deleteShop(item)
      if (statusCode === 200 && parseInt(code) === 0) {
        if (message === 'success') {
          wx.showToast({
            title: '删除操作成功',
            icon: 'success',
          })
          let total = 'meta.total'
          self.setData({
            [total]: this.data.meta.total-shop_cart_ids.length
          })
        }
      } else {
        showMessage({
          title: '删除操作失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('购物车-deleteShopCart:', err)
    }
    wx.hideLoading()
  },


  /****************新增订单*/
	// 新增订单--请求接口
  async addOrderSubmit (e) {
    let params = {
      total_amount: this.data.total_money*100,
      final_amount: this.data.total_money*100,
      item: []
    }
    // 整理商品、服务参数
    this.data.list.forEach(function (listItem) {
      if (listItem.selected === 1 && listItem.is_invalid === 1) {
        listItem.unit_price = listItem.unit_price*100
        listItem.sku_detail = listItem.content
        let itemSon = {
          category_id: listItem.category_parent_ids,
          item_id: listItem.product_id,
          quantity: listItem.quantity,
          unit_price: listItem.unit_price*100,
          sku_id: listItem.item_id ? listItem.item_id : 0,
          shop_car_id: listItem.shop_car_id,
          type: listItem.type,
          listItem: listItem,              // listItem.biz_product_id/listItem.biz_product_idcategory_id获取可使用优惠券所需参数
          sku_detail: listItem.content
        }
        params.item.push(itemSon)
      }
    })
    // 无数据不允许下单
    if (params.item.length<=0) {
      return
    }
    globalData.cc_id = null
    globalData.orderItem = null
    globalData.orderItem = params
    globalData.is_choose_coupon = false
    // 确认订单
    wx.navigateTo({
      url: `/pages/order/confirmOrder/confirmOrder`,
    })
  },

  // 上拉加载更多
  onReachBottom () {
    if (this.data.isAllLoaded) {
      return
    }
    this.getShopList()
  },
  onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
    let pages = getCurrentPages();
		if (pages.length === 1) {
      this.setData({
				showHome: true
			})
    }
    wx.hideShareMenu()
  },  
  // 页面渲染
  async onShow () {      
    // 禁止分享
    wx.hideShareMenu()
    // 判断用户身份，未注册跳转注册授权
    if(globalData.is_registered === 0) {
      wx.navigateTo({
        url: '/pages/register/registerPhone/registerPhone',
      })
      return
    }
    // 格式数据
    this.setData({
      // 图片
      images: {
        checkBtn: checkBtn,
        checkBtnActive: checkBtnActive,
        invalid: invalid,
      },
      // 全选
      all_check: 1,
      // 编辑
      isEdit: 1,
      // 删除
      isDelete: false,
      // 列表
      list: [],     
      sumProductNum: 0,
      // 订单总价
      total_money: '0.00',
    //   删除的数组
      delete_cart_num:[]
    })
    this.data.limit = 10
    this.data.page = 1
    this.data.isAllLoaded = false
    this.getShopList()
  }
});
