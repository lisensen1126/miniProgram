/**
 * 函数防抖、防多触
 * @param {Function} func -需要函数防抖的函数
 * @param {Number} time -延迟时间
 **/

const debounce = (func, time = 17) => {
    let timer;
    const _debounce = function (...args) {
        if (timer) {
            clearTimeout(timer)
        }
        // 延时触发
        timer = setTimeout(() => {
          func.apply(args)
          timer = null
        }, time)
    };
  
    /**
     * 取消函数
     **/
    _debounce.cancel = function () {
        clearTimeout(timer)
        timer = null
    };
    return _debounce
  };
  
  export {debounce}