import * as mongoose from 'mongoose'

// 充值记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ''},
    nickname: {type: String, default: ''},
    spreaderID: {type: String, default: '0'},
    channelID: {type: String, default: '0'},
    createTime: {type: Number, default: 0},
    rechargeMoney: {type: Number, default: 0},
    diamondCount: {type: Number, default: 0},
    couponCount: {type: Number, default: 0},
    purchaseItemID: {type: String, default: ''},
    userOrderID: {type: String, default: ''},
    platformReturnOrderID: {type: String, default: ''},
    platform: {type: String, default: ''}
})

// 充值记录
export const rechargeRecordModel = mongoose.model('rechargeRecord', schema)
