import * as mongoose from 'mongoose'

export interface IGameControlModel {
    kind: number
    curInventoryValue: number
    minInventoryValue: number
    extractionRatio: number
    robotEnable: number
    robotMatchEnable: number
    maxRobotCount: number
    robotWinRateArr: {
        index: number
        inventoryValue: number
        // 机器人赢的概率
        winRate: number
    }[]
}

// 游戏控制记录
const schema = new mongoose.Schema<IGameControlModel>({
    kind: {type: Number, default: 0},
    curInventoryValue: {type: Number, default: 0},
    minInventoryValue: {type: Number, default: 0},
    extractionRatio: {type: Number, default: 0},
    robotEnable: {type: Number, default: 0},
    robotMatchEnable: {type: Number, default: 0},
    maxRobotCount: {type: Number, default: 0},
    robotWinRateArr: [{
        index: {type: Number, default: 0},
        inventoryValue: {type: Number, default: 0},
        // 机器人赢的概率
        winRate: {type: Number, default: 0}
    }]
})

// 游戏控制记录
export const gameControlDataModel = mongoose.model<IGameControlModel>('gameControlData', schema)
