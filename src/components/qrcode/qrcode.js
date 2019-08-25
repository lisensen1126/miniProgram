Component({
  properties: {
    code: String,
    qrcode: String,
    order_id: Number,
  },
  methods: {
    cancel() {
      this.triggerEvent('triggercancel', {str: 'cancal'})
    },
  },
})