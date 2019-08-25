// 解析用 '|' 拼接的scene
export default (scene) => {
  let sceneArr = scene.split(',')
  console.log('sceneArr', sceneArr)
  let obj = {}
  switch (Number(sceneArr[0])) {
    case 1: // 爆款推荐海报跳转秒杀详情页
      obj.is_cache = false
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        qr_code_rid: sceneArr[2],
        store_id: sceneArr[3],
      }
      break
    case 2: // 活动宣传海报
      obj.is_cache = false
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        qr_code_rid: sceneArr[2],
        store_id: sceneArr[3]
      }
      break
    case 3: // 爆款推荐爆炸贴
      obj.is_cache = false
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        qr_code_rid: sceneArr[2],
        store_id: sceneArr[3]
      }
      break
    case 5: // 快速开单
      obj.is_cache = true
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        store_id: sceneArr[2],
        quick_order_id: sceneArr[3]
      }
      break;
  
    case 6: // 发送优惠
      obj.is_cache = false
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        store_id: sceneArr[2]
      }
      break;
  
    case 7: // 推广门店
      obj.is_cache = false
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        store_id: sceneArr[2]
      }
      break;
  
    case 8: // 邀请评价
      obj.is_cache = false
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        store_id: sceneArr[2]
      }
      break;
  
    case 9: // 快速买单
      obj.is_cache = true
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        store_id: sceneArr[2],
      }
      break;
  
    case 10: // 渠道二维码--商品详情
      
      break;
  
    case 11: // 渠道二维码--服务详情
      
      break;
  
    case 12: // 渠道二维码--养护卡详情
      obj.is_cache = true
      obj.from_type = sceneArr[0]
      obj.from_id = sceneArr[1]
      obj.scene = {
        store_id: sceneArr[2],
        card_id: sceneArr[3],
      }
      break;
    case 13: // 渠道二维码--平台内容
      
      break;
  
    case 14: // 渠道二维码--门店内容
      
      break;
  
    case 15: // 渠道二维码--拼团商品详情	
      
      break;
  
    case 16: // 渠道二维码--拼团服务详情
      
      break;
  
    case 17: // 渠道二维码--拼团养护卡详情
      
      break;
  
    case 18: // 渠道二维码--秒杀商品详情
      
      break;
  
    case 19: // 渠道二维码--秒杀服务详情
      
      break;
  
    case 20: // 渠道二维码--秒杀养护卡详情
      
      break;
  
    case 21: // 渠道二维码--领券中心	
      
      break;
  
    case 22: // 渠道二维码--智能保养
      
      break;
  
    case 23: // 渠道二维码--首页
      
      break;
  
    default:
      break;
    }
  return obj;
}