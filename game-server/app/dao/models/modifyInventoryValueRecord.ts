import * as mongoose from 'mongoose'

// 修改库存记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ''},
    kind: {type: Number, default: 0},
    count: {type: Number, default: 0},
    leftCount: {type: Number, default: 0},
    createTime: {type: Number, default: 0}
})

// 修改库存记录
export const modifyInventoryValueRecordModel = mongoose.model('modifyInventoryValueRecord', schema)
