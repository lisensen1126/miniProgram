import { fetchTimeOfAppointment, createAppointment } from '@/libs/modules/appointment'
// 获取全局应用程序实例对象
const {
	globalData,
	showMessage
} = getApp()

// 创建页面实例对象
Page({
	// 页面的初始数据
	data: { 
		isShow: false,
		alreadyTime: undefined,
		isEnable: false,
		needBack: false,
		dateList: [],   //上面的date时间集合
		timeList: {  //下面的time时间集合
			am: [],
			pm: [],
		},
		reservableDate: undefined,
    reservableTime: '',
    top_height: 0, // padding高度
	},
	// 取消
	actionCancel(e) {
		wx.navigateBack()
	},
	/**
	 * 确定
	 * @param {*} e 
	 */
	actionConfirm(e) {
		if (!this.data.isEnable) return
		const chooseTime = this.data.reservableDate + ' ' + this.data.reservableTime
		const targetTime = new Date(chooseTime.replace(' ', 'T') + '+08:00').getTime()
		const currentTime = new Date().getTime()
		if (targetTime - currentTime > 0) {
			if (this.data.needBack) {
				globalData.appointment.time = chooseTime
				globalData.appointment.isChoice = true
				wx.navigateBack()
			} else {
				this.freeReserve(chooseTime)
			}
		} else {
			showMessage({
				title: '选择失败',
				content: '预约时间早于当前时间请重新选择',
			})
		}
	},
	/**
	 * 创建预约单
	 * @param {*} chooseTime 当前选择的时间
	 */
	async freeReserve(chooseTime) {	
		wx.showLoading({
			title: '加载中',
			mask: true,
		})
		try {
			const {
				statusCode,
				data,
				code,
				message
			} = await createAppointment({
				trade_order_id: this.data.trade_order_id,
				reserve_time: chooseTime,
				reserve_store_id: globalData.reserve_store_id || undefined,
			})
			if (statusCode === 200 && code === 0) {
				wx.hideLoading()
				globalData.appointmentSuccessInfo.reserveStartTime =  chooseTime
				wx.redirectTo({
					url: '/pages/appointment/appointmentSuccess/appointmentSuccess',
				})
			} else {
				wx.hideLoading()
				showMessage({
					title: '创建预约单失败',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
      console.error('选择时间-freeReserve', err)
		}
	},
	/**
	 * 选择上面的dat日期
	 * @param {*} e 
	 */
	async chooseDate(e) {
		const date = e.currentTarget.dataset.date
		const timeOfAppointment = await this.getReservableTime(date.fullDate) // 获取可预约时间
		this.serializeDate(timeOfAppointment.day_list)
		this.serializeTime(timeOfAppointment.all_periods)
		this.isEnableChange({
			reservableDate: date.fullDate,
			reservableTime: '',
		})
	},
	/**
	 * 选择下面的上午/下午time
	 * @param {*} e 
	 */
	chooseTime(e) {
		const time = e.currentTarget.dataset.time
		if (time.available) {
			this.isEnableChange({
				reservableTime: time.start,
			})
		}
	},
	/**
	 * 是否可以选择time
	 * @param {*} updateData 
	 */
	isEnableChange(updateData) {
		const isEnable = !!((updateData.reservableDate || this.data.reservableDate) && updateData.reservableTime)
		const changed = updateData.reservableDate ? {
			reservableDate: updateData.reservableDate,
			reservableTime: updateData.reservableTime,
			isEnable: isEnable,
		} : {
			reservableTime: updateData.reservableTime,
			isEnable: isEnable,
		}
		this.setData(changed)
	},
	/**
	 * 格式化date
	 * @param {*} myday 
	 */
	getDayName(myday) {
		let day = '1'
		switch (myday) {
			case 0:
				day = '周日'
				break
			case 1:
				day = '周一'
				break
			case 2:
				day = '周二'
				break
			case 3:
				day = '周三'
				break
			case 4:
				day = '周四'
				break
			case 5:
				day = '周五'
				break
			case 6:
				day = '周六'
				break
		}
		return day
	},
	// 格式化数据日期
	serializeDate(dateArray) {
		let dateList = dateArray.map(item => {
			const dateObj = new Date(item)
			const currentDate = new Date().getDate()
			const intervalDay = dateObj.getDate() - currentDate
			const date = intervalDay === 0 ? '今天' :
				intervalDay === 1 ? '明天' :
				intervalDay === 2 ? '后天' : this.getDayName(dateObj.getDay())
			return {
				day: date,
				date: dateObj.getMonth() + 1 + '-' + dateObj.getDate(),
				fullDate: item,
			}
		})
		this.setData({
			dateList: dateList,
		})
		if (!this.data.reservableDate) {
			this.setData({
				reservableDate: dateList[0].fullDate,
			})
		}
	},
	/**
	 * 格式化数据时间time 上午/下午
	 * @param {*} timeArray 
	 */
	serializeTime(timeArray) {
		let am = timeArray.filter(item => {
			return 12 - item.start.split(':')[0] > 0
		})
		let pm = timeArray.filter(item => {
			return 12 - item.start.split(':')[0] <= 0
		})
		let changed = {}
		changed['timeList.am'] = am
		changed['timeList.pm'] = pm
		this.setData(changed)
	},
	/**
	 * 获取可预约的时间
	 * @param {*} dateTime  当前时间
	 */
	async getReservableTime(dateTime) {
		wx.showLoading({
			title: '加载中',
			mask: true,
		})
		try {
			const {
				statusCode,
				data,
				code,
				message
			} = await fetchTimeOfAppointment(dateTime ? {
				date: dateTime,
				reserve_store_id: globalData.reserve_store_id || undefined,
			} : {
				reserve_store_id: globalData.reserve_store_id || undefined,
			})
			if (statusCode === 200 && code === 0) {
				wx.hideLoading()
				return data
			} else {
				showMessage({
					title: '企业门店可预约时间',
					content: `${message}`,
				})
			}
		} catch (err) {
			wx.hideLoading()
			console.error('选择时间-getReservableTime', err)
		}
		wx.hideLoading()
	},
	onLoad(option) {
    this.setData({
      top_height: globalData.topbarHeight,
    })
		wx.hideShareMenu()
		this.setData({
			needBack: option.needBack ? option.needBack : '',
			trade_order_id: option.trade_order_id,
			alreadyTime: option.alreadyTime ? option.alreadyTime : null,
		})
	},
	async onShow() {
    // 进入页面的时间
    this.setData({
      enter_page_date: new Date() / 1
    })		
		if (this.data.alreadyTime) {
			this.isEnableChange({
				reservableDate: this.data.alreadyTime.split(' ')[0],
				reservableTime: this.data.alreadyTime.split(' ')[1],
			})
		}
		// this.getReservableTime(this.data.reservableDate)
		const timeOfAppointment = await this.getReservableTime(this.data.reservableDate || null) // 获取可预约时间
		this.serializeDate(timeOfAppointment.day_list)
		this.serializeTime(timeOfAppointment.all_periods)
	},
});