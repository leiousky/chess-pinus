import mongoose from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

export interface IArenaPlayerModel {
    // 竞技场id
    arenaId: mongoose.Types.ObjectId
    uid: number
    // 最高分
    topScore: number
}

// 竞技场玩家
const schema = new mongoose.Schema<IArenaPlayerModel>({
    // 竞技场id
    arenaId: {
        type: ObjectId,
        default: null
    },
    // // 玩家 id
    // playerId: {
    //     type: ObjectId,
    //     default: null,
    // },
    uid: {
        type: Number,
        default: 0,
    },
    // 最高分
    topScore: {
        type: Number,
        default: 0,
    }
})

// 竞技场玩家
export const arenaPlayerModel = mongoose.model<IArenaPlayerModel>('arenaPlayer', schema)
