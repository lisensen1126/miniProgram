import {myBasic, updateUserInfo} from '@/libs/modules/personal'
import checkBtnActive from '../../images/shopCart/check-btn-active.png'
import checkBtn from '../../images/shopCart/check-btn.png'
const {
  globalData,
  showMessage,
  changeDate,
  cdp,
} = getApp()
// 创建页面实例对象
Page({
  // 页面的初始数据
  data: {
    myInfo: {},
    // 图片
		images: {
      checkBtn: checkBtn,
      checkBtnActive: checkBtnActive,
		},
    sexlist: [
      {
        id: 1,
        name: '男',
        is_check: 0,
      },
      {
        id: 2,
        name: '女',
        is_check: 0,
      },
      {
        id: 3,
        name: '保密',
        is_check: 0,
      },
    ],
    chooseSexId: 1,
    openSex: false,
    nowDate: '',
    canClick: false, // true:允许点击上传图片;false:禁止点击上传图片 
  },
  // 打开选择性别弹框
  openSexModal () {
    this.setData({
      openSex: !this.data.openSex,
    })
  },
  // 选择性别
  changeSex (e) {
    this.setData({
      chooseSexId: e.currentTarget.dataset.id,
    })
    const list = this.data.sexlist.map((item) => {
      // 当前已选的风格数组
      if (item.id === parseInt(this.data.chooseSexId)) {
        item.is_check = 1
      } else {
        item.is_check = 0
      }
      return item
    })
    this.setData({
      sexlist: list,
      'myInfo.sex':this.data.chooseSexId,
      openSex: !this.data.openSex,
    })
    this.updateMy() // 修改个人信息数据
  },
  // 选择时间组件回调方法
  bindTimeChange: function(e) {
    this.setData({
      'myInfo.birthday': e.detail.value,
    })
    this.updateMy() // 修改个人信息数据
  },
  // 获取个人信息数据
  async getMy () {
    let self = this
    this.setData({
      isLoading: true,
    })
    wx.showLoading({
      title: '加载中...',
      mask: true,
    })
    try {
      const {statusCode, data, code, message} = await myBasic({})
      if (statusCode === 200 && code === 0) {
        data.birthday = changeDate(data.birthday)
        data.phone = data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        this.setData({
          myInfo: data,
        })
        const list = this.data.sexlist.map((item) => {
          if (item.id === parseInt(this.data.myInfo.sex)) {
            item.is_check = 1
          } else {
            item.is_check = 0
          }
          return item
        })
        this.setData({
          sexlist: list,
        })
        setTimeout(function () {
          self.setData({
            canClick: true
          })
        }, 1000)
      } else {
        showMessage({
          title: '获取个人信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('个人信息-getMy:', err)
    }
    wx.hideLoading()
    this.setData({
      isLoading: false,
    })
  },
  // (1)选择本地、拍照上传图片
	chooseImageTap: function (e) {
    let self = this;
    if (!self.data.canClick) {
      return false
    }
		wx.showActionSheet({
			itemList: ['本地上传', '拍照上传'],
			itemColor: "#000000",
			success: function (res) {
				if (!res.cancel) {
					if (res.tapIndex == 0) {
						self.chooseWxImage('album')
					} else if (res.tapIndex == 1) {
						self.chooseWxImage('camera')
					}
				}
			}
		})
  },
  // (2)图片选择后的回调方法
	chooseWxImage: function (type) {
		let self = this;
    var count = 1
		wx.chooseImage({
			count: count,
			sizeType: ['original', 'compressed'],
			sourceType: [type],
			success: function (res) {
				wx.showLoading({
					title: '图片上传中...',
					mask: true,
        })
        let str = true
        self.upImg(res.tempFilePaths[0], str)
			}
		})
  }, 
  // (3)图片选择后的,上传到服务器
	async upImg(path, str) {
		var self = this
		wx.uploadFile({
			url: globalData.host + globalData.apiRoot +'comment/image_upload',
			filePath: path,
			name: 'file',
			header: {
				'content-type': 'multipart/form-data',
				'Authorization': `Bearer ${globalData.token}`,
				'Shop-Hash': globalData.shopHash
			},
			success:function(res){
				let data = JSON.parse(res.data)
				if (data.message === 'success') {
					self.setData({
						'myInfo.avatar': data.data.image_url,
          })
          self.updateMy() // 修改个人信息数据
					if (str) {
						wx.hideLoading()
					}
				} else {
					wx.hideLoading()
					showMessage({
						title: '图片上传失败',
						content: '请重新上传！',
					})
				}
			},
			fail:function(){
				wx.hideLoading()
				showMessage({
					title: '图片上传失败',
					content: '请重新上传！',
				})
			},
		})
  },
  // 日期转时间戳方法
  dateTotimestamp (val, mulriple) {
    return new Date(val).getTime()/mulriple
  },
  // 修改个人信息数据
  async updateMy () {
    this.setData({
      isLoading: true,
    })
    let session_id = cdp.sessionId() // 获取用户sessionId
    try {
      const {statusCode, data, code, message} = await updateUserInfo({
        session_id: session_id ? session_id : '',
        avatar: this.data.myInfo.avatar  || undefined,
        sex: this.data.myInfo.sex  || undefined,
        birthday: this.dateTotimestamp(this.data.myInfo.birthday,1000)  || undefined,
      })
      if (statusCode === 200 && code === 0) {
        wx.showToast({
          title: '修改成功',
          icon: 'success',
          duration: 1000,
        })
      } else {
        showMessage({
          title: '修改个人信息失败',
          content: `${message}`,
        })
      }
    } catch (err) {
      console.error('个人信息-updateMy:', err)
    }
    this.setData({
      isLoading: false,
    })
  },
  async onLoad() {
    wx.hideShareMenu()
    // 获取自定义导航栏高度，修改页面顶部的样式
    this.setData({
      topbarHeight: globalData.topbarHeight,
    })    
    await this.getMy() // 获取个人信息数据   
  },
})