import * as mongoose from 'mongoose'

// 每日抽水总量记录
const schema = new mongoose.Schema({
    day: {type: Number, default: 0},
    count: {type: Number, default: 0}
})

// 每日抽水总量记录
export const gameProfitRecordModel = mongoose.model('gameProfitRecord', schema)
