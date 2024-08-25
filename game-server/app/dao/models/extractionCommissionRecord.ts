import * as mongoose from 'mongoose'

// 提取佣金记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ''},
    count: {type: Number, default: 0},                          // 提取金额
    remainderCount: {type: Number, default: 0},                 // 剩余金额
    curGold: {type: Number, default: 0},                        // 当前金币
    createTime: {type: Number, default: 0}
})

// 提取佣金记录
export const extractionCommissionRecordModel = mongoose.model('extractionCommissionRecord', schema)
