// 获取全局应用程序实例对象
import { shopCar, engineOil, oilList, filterList, gearBoxListApi } from '@/libs/modules/intelligent'
const {
	showMessage, globalData
} = getApp()
import checkBtnActive from '../../../images/intelligent/tick.png'
import checkBtn from '../../../images/intelligent/check-btn.png'
import { sendFormId } from '@/utils/formid'
// 创建页面实例对象
Page({
	// 页面的初始数据
	data: {
		indexInfo: null,										// 车辆信息
		showView: [{ "status": true }, { "status": true }, { "status": true }],			// 机油是否展示
		articleInfo: [{}, {}, {}],								// 机油列表展示
		images: {												// 选中状态
			checkBtn: checkBtn,
			checkBtnActive: checkBtnActive,
		},
		allCheckd: true,										// 全选
		// isTick: [{"status":false},{"status":true}],				// 单个选中
		totalMoney: 0,											// 总价
		totalMum: 0,											// 数量
		bill: {},												// 传入全局变量
		islogin: false, 										// 是否登录flag
		pageShow: false,										// 显示缺省页
		pageShow2: false,
		pageShow3: false,
    showHome: false,
		isShowTip: false,				// 是否显示信息不完善的提示框
		hasViecle:1,					// 是否有完善的信息，1：是的，2：无车，3：有车但信息不完善
    top_height: 0, // padding高度
  },
  
  onLoad() {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		wx.hideShareMenu()
	},

	async onShow() {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    }) 		
		wx.showLoading({
			title: '加载中',
			mask: true,
		})
		// // 判断用户身份，未注册跳转注册授权
		// if(globalData.is_registered === 0) {
		// 	wx.navigateTo({
		// 		url: '/pages/register/registerPhone/registerPhone',
		// 	})
		// 	return
		// }
		
		await this.getCarData()
		// 上个页面返回得值
		var pages = getCurrentPages();
		var currPage = pages[pages.length - 1]; //当前页面
		if (!currPage.data.go_type) {
			// await this.getEngineOilData()
			await this.getOilList()
			await this.getFilterList()
			await this.getGearBoxList()
			this.setData({
				allCheckd: true
			})
			// 防止进入下一页后，点击返回按钮后又调接口，影响本页面的已选数据展示
			this.setData({
				go_type: 1
			})
			return
		} else {
			// 从机油列表返回后，不允许刷新其他的数据且要更新总价
			if (currPage.data.type === 1) {
				this.setData({
					[`articleInfo[0].list`]: currPage.data.item.list,
					[`articleInfo[0].price`]: currPage.data.item.money,
					totalMoney: currPage.data.item.money + this.data.articleInfo[1].price,
				})
				wx.hideLoading()
			} else if (currPage.data.type === 2) {
				this.setData({
					[`articleInfo[1].list`]: currPage.data.item.item,
					[`articleInfo[1].price`]: currPage.data.item.money,
					totalMoney: currPage.data.item.money + this.data.articleInfo[0].price,
				})
				wx.hideLoading()
			} else if (currPage.data.type === 3) {
				this.setData({
					[`articleInfo[2].list`]: currPage.data.item.list,
					[`articleInfo[2].price`]: currPage.data.item.money,
					totalMoney: currPage.data.item.money + this.data.articleInfo[0].price + this.data.articleInfo[1].price,
				})
				wx.hideLoading()
			}
		}
		this.changeTotal()
  },
	// 返回
  goBack(){
		wx.navigateBack()
	},
	// 去往完善车辆的页面
	goMaintence(){
		// 2表示没有车，跳到添加车辆的页面
		if(this.data.hasViecle===2){
			wx.navigateTo({
      	url: '/pages/vehicle/vehicleAdd/vehicleAdd?is_first=1',
    	})
		}else if(this.data.hasViecle===3){
			// 3表示有车，但是信息不够完善，跳到编辑该车的页面
			wx.setStorageSync('car_info', this.data.indexInfo)
			wx.navigateTo({
      	url: '/pages/vehicle/VehicleEdit/VehicleEdit',
    	})
		}
	},
	/*** 车辆信息部分 ***/
	// 获取车辆信息
	async getCarData() {
		this.setData({
			indexInfo:{}
		})
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {statusCode, data, code, message } = await shopCar()
			if (statusCode ===200 && code === 0) {
				this.setData({
					indexInfo: data.carInfo
				})
				wx.hideLoading()
				if (this.data.indexInfo === false) {
					this.setData({
						pageShow: false
					})
				} else {
					this.setData({
						pageShow: true
					})
				}
				let hasViecle = 1
				if(data.carInfo===false){
					hasViecle = 2
				}else if(data.carInfo.carpart_vehicle_id===""){
					hasViecle = 3
				}
				// 车型信息未填写完整时，弹框提示
				if (!data.carInfo.carpart_vehicle_id) {					
					this.setData({
						isShowTip: true,
						hasViecle: hasViecle    // 1信息完善，2无车，3有车但信息不完善
					})
				}else{
					this.setData({
						isShowTip: false,
						hasViecle: hasViecle    // 1信息完善，2无车，3有车但信息不完善
					})
				}
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取车辆信息失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-getCarData', err)
		}
		wx.hideLoading()
	},

	// 跳转添加车辆
	async goAddcar(e) {
		wx.navigateTo({
			url: '../../vehicle/vehicleAdd/vehicleAdd?index=true&is_first=1'
		})
	},

	// 跳转管理车辆
	async goManagecar(e) {
		wx.navigateTo({
			url: '../../vehicle/vehiclesMultiple/vehiclesMultiple'
		})
	},

	/*** 机油列表部分 ***/
	// 获取机油列表
	async getOilList() {
		this.setData({
			pageShow: false
		})
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {statusCode, data, code, message,} = await oilList()
			if (statusCode ===200 && code === 0) {
				data.forEach(function (e) {
					e.isCheck = true
				})
				let dataList = this.data.articleInfo
        dataList[0] = data[0]
				this.setData({
					articleInfo: dataList,
        })
				if (this.data.allCheckd === true) {
					this.changeTotal()
				}
				wx.hideLoading()
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取项目列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-getOilList', err)
		}
		this.setData({
			pageShow: true
		})
		wx.hideLoading()
	},
	// 获取滤清器列表
	async getFilterList() {
		this.setData({
			pageShow2: false
		})
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode, data, code, message, meta } = await filterList()
			if (statusCode ===200 && code === 0) {
				data.forEach(function (e) {
					e.isCheck = true
				})
				let dataList = this.data.articleInfo
				dataList[1] = data[0]
				this.setData({
					articleInfo: dataList,
				})
				if (this.data.allCheckd === true) {
					this.changeTotal()
				}
				wx.hideLoading()
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取项目列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-getFilterList', err)
		}
		this.setData({
			pageShow2: true
		})
		wx.hideLoading()
	},
	// 获取变速箱油列表
	async getGearBoxList() {
		this.setData({
			pageShow3: false
		})
		wx.showLoading({
			title: '加载中'
		})
		try {
			const {
				statusCode, data, code, message, meta } = await gearBoxListApi()
			if (statusCode ===200 && code === 0) {
				data.forEach(function (e) {
					e.isCheck = true
				})
				let dataList = this.data.articleInfo
				dataList[2] = data[0]
				this.setData({
					articleInfo: dataList,
				})
				if (this.data.allCheckd === true) {
					this.changeTotal()
				}
				wx.hideLoading()
			} else {
				wx.hideLoading()
				showMessage({
					title: '获取项目列表失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('智能保养-getGearBoxList', err)
		}
		this.setData({
			pageShow3: true
		})
		wx.hideLoading()
	},

	// 单选
	async checkedSingle(e) {
		let index = e.target.dataset.index
		let check = this.data.articleInfo[index].isCheck
		this.setData({
			[`articleInfo[${index}].isCheck`]: !check,
			[`showView[${index}].status`]: !check
		})
		let allCheckd = this.data.allCheckd
		this.data.articleInfo.forEach(function (e, i) {
			if (e.isCheck === false) {
				allCheckd = false
			}
		})
		if (this.data.articleInfo[0].isCheck === true && this.data.articleInfo[1].isCheck === true && this.data.articleInfo[2].isCheck === true) {
			allCheckd = true
		}
		this.setData({
			allCheckd: allCheckd
		})
		this.changeTotal()
  },
  
  	/**
	 * 全选（反选）
	 * @check 全选状态
	 * @list 列表数据
	 */
	async checkedAll() {
    let self = this
		this.setData({
			allCheckd: !this.data.allCheckd,
		})
		let check = this.data.allCheckd
		let list = this.data.articleInfo
		list.forEach(function (e, i) {
      e.isCheck = check
      // 全选控制商品是否显示
      if (e.list.length && !e.reference_amount) {
        return
      }
      self.setData({
        [`showView[${i}].status`]: e.isCheck
      })
		})
		this.setData({
			articleInfo: list
    })
		this.changeTotal()
	},

	// 更新价格总数
	changeTotal() {
		let totalMoney = 0
		let totalMum = 0
		let workingTime = 0
		this.data.articleInfo.forEach(function (e, i) {
      // 如果机油的参考用量为0, 不计算价格
      if (e.name === '机油' && !Number(e.reference_amount)) {
        return
      } else {
        if (e.isCheck === true) {
          e.list.forEach(function (j) {
            totalMum += j.quantity
            totalMoney += j.quantity * j.unit_price
          })
          if (e.list.length > 0 && e.maintenance_fee.is_valid == 'on') {
            workingTime += e.maintenance_fee.value * 1
          }
        }
      }
    })
    let wholeMoney = (totalMoney / 100 + workingTime / 100).toFixed(2)
		this.setData({
			totalMoney: totalMoney,
			totalMum: totalMum,
      workingTime: workingTime,
      wholeMoney: wholeMoney,
		})
	},

	// 跳转手册或参数
	async skipTab(e) {
		wx.navigateTo({
			url: '../modelParameters/modelParameters?tab=' + e.currentTarget.dataset.tab
		})
	},

	// 跳转机油列表
	async skipChange(e) {
		wx.navigateTo({
			url: '../change/replacement?type=' + e.target.dataset.type
		})
	},

	// 跳转商品（机油/滤清器）详情
	async goGoodsDetail(e) {
		let spu = e.currentTarget.dataset.spu
		let sku = e.currentTarget.dataset.sku
		wx.navigateTo({
			url: `/pages/mall/goodsDetail/goodsDetail?spu_id=${spu}&sku_id=${sku}`
		})
	},

	/*** 结算部分 ***/
	/**
	 * 跳转结算页面
	 * @goDetail 判断是否有未上架的产品
	 * @isReturn 判断是否中止循环
	 * @isTick 判断是否显示错误提示
	 */
	async goSettlement(e) {
		if (this.data.totalMum == 0) {
			return
		} else {
			let item = []
			let go_detail = false							// 判断是否有未上架的产品
			let is_tick = true
			let is_return = true								// 判断是否中止循环
			this.data.articleInfo.forEach(function (e) {
        // 如果机油的参考用量为0, 不在订单详情里显示
        if (e.name === '机油' && !Number(e.reference_amount)) {
          return
        } else {
          if (e.isCheck === true && is_tick === true && is_return === true) {
            e.list.forEach(function (j) {
              j.biz_product_id = j.spu_id   // listItem.biz_product_id/listItem.biz_product_idcategory_id获取可使用优惠
              if (j.is_sale === 1 && is_return === true) {
                let itemSon = {
                  item_id: j.product_id,
                  quantity: j.quantity,
                  unit_price: j.unit_price,
                  sku_id: j.basic_sku_id,
                  type: 1,
                  category_id: e.parent_id,
                  listItem: j,
                  is_sale: j.is_sale,
                }
                item.push(itemSon)
                go_detail = true
                is_tick = true
              } else {
                go_detail = false
                is_tick = false
                is_return = false
                return false;
              }
            })
          } else {
            return false
          } 
        }
			})
			if (is_return === false) {
				showMessage({
					title: '温馨提示',
					content: '智能保养中含有未上架商品，无法购买！'
				})
			}
			this.data.bill.total_amount = this.data.totalMoney
			this.data.bill.final_amount = this.data.totalMoney
			this.data.bill.working_time = this.data.workingTime
			this.data.bill.order_type = 2
			this.data.bill.item = item
      globalData.orderItem = this.data.bill			// 存入全局变量
      console.log(globalData.orderItem)
			if (go_detail === true) {
				globalData.is_choose_coupon = false
				globalData.cc_id = null
				wx.navigateTo({
					url: '../../order/confirmOrder/confirmOrder'
				})
			}
		}
  },
  
  // formid 收集
  sendFormId,
});
