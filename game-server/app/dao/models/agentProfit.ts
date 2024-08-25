import * as mongoose from 'mongoose'

// 代理返利设置
const schema = new mongoose.Schema({
    index: {type: String, default: ''},
    level: {type: String, default: ''},
    min: {type: Number, default: 0},
    max: {type: Number, default: 0},
    proportion: {type: Number, default: 0},
})

// 代理返利设置
export const agentProfitModel = mongoose.model('agentProfit', schema)
