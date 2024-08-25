import * as mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

export interface IArenaTableModel {
    // 竞技场id
    arenaId: mongoose.Types.ObjectId
    // 竞技场下的桌子编号
    tableId: number
    // 房间号
    roomId: number
    // 房间小局的第几轮
    roomRound: number
    // 所有桌上玩家
    players: number[]
    // 第几轮
    arenaRound: number
    // 房间规则
    gameRule: {
        // 最大局数
        maxDrawCount: number
    }
}

const playerRoundSchema = new mongoose.Schema({
    playerId: {
        type: ObjectId,
        default: null,
    },
    uid: {
        type: Number,
        default: 0,
    },
    score: {
        type: Number,
        default: 0,
    }
})

// 竞技场房间
const schema = new mongoose.Schema<IArenaTableModel>({
    // 竞技场id
    arenaId: {
        type: ObjectId,
        default: null
    },
    // 竞技场下的桌子编号
    tableId: {
        type: Number,
        default: 0,
    },
    // 房间号
    roomId: {
        type: Number,
        default: 0,
    },
    // 房间小局的第几轮
    roomRound: {
        type: Number,
        default: 0,
    },
    // 所有桌上玩家
    players: {
        type: [Number],
        default: []
    },
    // 第几轮
    arenaRound: {
        type: Number,
        default: 0,
    },
    // 房间规则
    gameRule: {
        type: Object,
        default: {}
    },
})

// 竞技场房间
export const arenaTableModel = mongoose.model<IArenaTableModel>('arenaTable', schema)
