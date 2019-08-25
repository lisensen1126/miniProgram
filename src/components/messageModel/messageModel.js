Component({
  properties: {
    title: {
      type: String,
      value: '删除操作'
    }
  },
  data: {
    showModel: true
  },
  methods: {
    cancel: function() {
      this.triggerEvent('cancelAction')
    },
    sure: function() {
      this.triggerEvent('sureAction')
    },
  }
})
