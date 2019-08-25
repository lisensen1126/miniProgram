function formatHandlerName (name) {
  return `on${name.slice(0, 1).toUpperCase() + name.slice(1)}Change`
}

export function createValiddateStates (fields) {
  const result = {
    isFilled: {},
    isValid: {},
  }
  fields.forEach(field => {
    result.isFilled[field] = false
    result.isValid[field] = false
  })
  return result
}

export function createHandlers (fields, callback) {
  const handlers = {}
  fields.forEach(field => {
    handlers[formatHandlerName(field)] = function (e) {
      this.setData({
        [field]: e.detail.value,
      })
      callback && callback.call(this, e, field)
    }
  })
  return handlers
}

// check license
export function checkLicense (val) {
  const pattern = /^([a-zA-Z]{1})([A-Za-z0-9]{5}|[DdFf][A-HJ-NP-Za-hj-np-z0-9][0-9]{4}|[0-9]{5}[DdFf])$/
  return pattern.test(val)
}

export default {
  createValiddateStates,
  createHandlers,
  checkLicense,
}
