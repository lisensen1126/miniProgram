Component({
  properties: {
    // 行表头
    colHeader: Array,
    // 页面未见调用
    rowHeader: Array,
    // 列表头
    tableData: Array,
    // 里程数
    miles: {
      type: Number,
      value: 0,
      observer: '_setFilter',
    },
  },
  data: {
    milesFilter: 0,
  },
  methods: {
    _setFilter (newVal) {
      const step = this.properties.colHeader[2] - this.properties.colHeader[1]
      const sectionStep = Math.floor(newVal / step)
      const milesFilter = sectionStep > this.properties.colHeader.length - 1 ? this.properties.colHeader.length - 1 : sectionStep
      this.setData({
        milesFilter,
      })
    },
  },
})
