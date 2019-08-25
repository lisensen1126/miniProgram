Component({
    properties: {
        slogan: String,
        icon: String,
    },
    methods: {
        cancel() {
          this.triggerEvent('triggercancel', {str: 'cancal'})
        },
        goCoupon() {
          this.triggerEvent('triggercancel', {str: 'cancal'})
        }
    },
})