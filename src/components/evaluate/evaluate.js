Component({
  properties: {
    
  },
  data: {
    showModel: true,
  },
  methods: {
    cancel () {
      this.triggerEvent('triggercancel', {str: 'cancal'})
    },
  },
})
