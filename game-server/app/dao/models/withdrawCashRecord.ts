import * as mongoose from 'mongoose'

// 提现申请记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ''},
    count: {type: Number, default: 0},                          // 提现金额
    curGold: {type: Number, default: 0},                        // 当前金币
    account: {type: String, default: ''},                       // 银行卡
    ownerName: {type: String, default: ''},                     // 持卡人姓名
    status: {type: Number, default: 0},                         // 记录状态
    type: {type: Number, default: 0},                           // 提款类型
    channelID: {type: String, default: '0'},
    createTime: {type: Number, default: 0}
})

// 提现申请记录
export const withdrawCashRecordModel = mongoose.model('withdrawCashRecord', schema)
