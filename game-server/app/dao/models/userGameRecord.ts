import * as mongoose from 'mongoose'

// 玩家游戏记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ''},
    drawID: {type: String, default: ''},
    kind: {type: Number, default: 0},
    roomLevel: {type: Number, default: 0},
    changeGold: {type: Number, default: 0},
    createTime: {type: Number, default: 0}
})

// 玩家游戏记录
export const userGameRecordModel = mongoose.model('userGameRecord', schema)
