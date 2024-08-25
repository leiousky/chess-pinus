import * as mongoose from 'mongoose'

// 发起订单记录
const schema = new mongoose.Schema({
    orderID: {type: String, default: ''},
    uid: {type: String, default: ''},
    itemID: {type: String, default: ''},
    createTime: {type: Number, default: 0}
})

// 发起订单记录
export const rechargeOrderRecordModel = mongoose.model('rechargeOrderRecord', schema)
