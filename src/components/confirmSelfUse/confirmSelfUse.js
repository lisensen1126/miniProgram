Component({
  properties: {

  },
  data: {
  },
  methods: {
    cancel() {
      this.triggerEvent('triggercancel')
    },
    confirm() {
      this.triggerEvent('triggerconfirm')
    },
  },
})