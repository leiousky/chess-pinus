import * as mongoose from 'mongoose'

// 游戏记录
const schema = new mongoose.Schema({
    nameArr: {type: [String], default: []},
    uidArr: {type: [String], default: []},
    avatarArr: {type: [String], default: []},
    roomId: {type: String, default: ''},
    cardsArr: {type: [Number], default: []},
    dateArr: {type: [Number], default: []},
    guaiArr: {type: [Boolean], default: []},
    scoresArr: {type: [Number], default: []},
    gameRule: {type: String, default: ''},
    createTime: {type: Number, default: 0}
})

// 游戏记录
export const gameRecordModel = mongoose.model('gameRecord', schema)
