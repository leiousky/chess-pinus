import * as mongoose from 'mongoose'
import {IGameTypeInfo} from '../../types/interfaceApi'

// 游戏规则
const schema = new mongoose.Schema<IGameTypeInfo>({
    gameTypeID: {type: String, default: ''},
    kind: {type: Number, default: 0},
    level: {type: Number, default: 0},
    // 最小开始人数
    minPlayerCount: {type: Number, default: 0},
    // 最多人数
    maxPlayerCount: {type: Number, default: 0},
    // 房费类型
    expenses: {type: Number, default: 0},
    baseScore: {type: Number, default: 1},
    goldLowerLimit: {type: Number, default: 0},
    goldUpper: {type: Number, default: 0},
    // 是否匹配房(金豆房)
    matchRoom: {type: Number, default: 0},
    minRobotCount: {type: Number, default: 0},
    maxRobotCount: {type: Number, default: 0},
    // 最多局数
    maxDrawCount: {type: Number, default: 0},
    hundred: {type: Number, default: 0},
    // blindBetCount 小盲注 preBetCount 底注  maxTake 允许带入的金币数
    parameters: {type: Object, default: {}},
})

// 游戏规则
export const gameTypeModel = mongoose.model<IGameTypeInfo>('gameType', schema)
