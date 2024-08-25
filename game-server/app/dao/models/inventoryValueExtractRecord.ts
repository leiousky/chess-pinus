import * as mongoose from 'mongoose'

// 库存抽取记录
const schema = new mongoose.Schema({
    kind: {type: Number, default: 0},
    count: {type: Number, default: 0},
    leftCount: {type: Number, default: 0},
    createTime: {type: Number, default: 0}
})

// 库存抽取记录
export const inventoryValueExtractRecordModel = mongoose.model('inventoryValueExtractRecord', schema)
