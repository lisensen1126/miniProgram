
/**
 * 解析公里数
 * @param {int} distance 
 */
const parseDistance = distance => {
  if (distance < 1000) {
    return parseFloat(distance).toFixed(1) + 'm'
  } else {
    return distance / 1000 > 99 ? '99+km' : (distance / 1000).toFixed(1) + 'km'
  }
}
