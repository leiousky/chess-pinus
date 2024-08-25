// 根据环境变量加载配置
const fs = require('fs')
const path = require('path')
const defaultConf = require('./config.default')

const nodeEnv = process.env.NODE_ENV
const filename = 'config.' + nodeEnv + '.js'
const configName = path.join(__dirname, filename)
console.log("=============","loading config", configName, "==========")
// 复制新配置
const assignNewConf = (k, oldConf, newConf) => {
  if (typeof oldConf[k] === 'object') {
    // 又是字典且新文件中有配置
    if (newConf && newConf[k]) {
      const keys = Object.keys(oldConf[k])
      for (const subK of keys) {
        assignNewConf(subK, oldConf[k], newConf[k])
      }
    }
  } else {
    // 不是字典且 key 存在
    if (newConf && (k in newConf)) {
      oldConf[k] = newConf[k]
    }
  }
}
if (fs.existsSync(configName)) {
  // 配置文件存在
  const newConf = require('./'+ filename)
  const keys = Object.keys(defaultConf)
  for (const k of keys) {
    assignNewConf(k, defaultConf, newConf)
  }
}
module.exports = defaultConf
