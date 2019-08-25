Component({
  properties: {
    showPrimary: {
      type: Boolean,
      value: false,
    },
    primaryText: {
      type: String,
      value: '确认',
    },
    concalText: {
      type: String,
      value: '取消',
    },
    isEnable: {
      type: Boolean,
      value: true,
    },
  },
  methods: {
    cancel () {
      this.triggerEvent('triggercancel', {str: 'cancal'})
    },
    confirm () {
      this.triggerEvent('triggercomfirm', {str: 'confirm'})
    },
  },
})
