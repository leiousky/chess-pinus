import * as mongoose from 'mongoose'

export interface IArenaModel {
    // 竞技场标题
    title: string
    // 系列名
    seriesName: string
    // 加入竞技场需要的竞技场金币
    arenaCoinRequired: number
    // 加入竞技场需要的参赛积分
    arenaPoint: number
    // 最少开赛人数
    minPeople: number
    // 最多参赛人数
    maxPeople: number
    // 开赛时间
    startAt: Date
    // 最多几轮
    maxRound: number
    // 是否完成
    isFinish: boolean
    // 是否处理中
    isRunning: boolean
    // 加入的玩家
    joinPlayers: number[]
    // 下一局玩家
    nextRoundPlayers: number[]
    // 当前第几轮
    currentRound: number
    // table id
    tableIdCount: number
    // 每轮晋级分数
    minRoundScore: object
    // 每轮前几名晋级
    rankRound: object
    // 机器人列表
    robotList: number[]
    // 是否需要机器人
    isNeedRobot: boolean
}

// 竞技场
const schema = new mongoose.Schema<IArenaModel>({
    // 竞技场标题
    title: {
        type: String,
        default: ''
    },
    // 系列名
    seriesName: {
        type: String,
        default: ''
    },
    // 加入竞技场需要的竞技场金币
    arenaCoinRequired: {
        type: Number,
        default: 0
    },
    // 加入竞技场需要的参赛积分
    arenaPoint: {
        type: Number,
        default: 0
    },
    // 最少开赛人数
    minPeople: {
        type: Number,
        default: 0,
    },
    // 最多参赛人数
    maxPeople: {
        type: Number,
        default: 0,
    },
    // 开赛时间
    startAt: {
        type: Date,
        default: new Date(),
    },
    // 最多几轮
    maxRound: {
        type: Number,
        default: 0,
    },
    // 是否完成
    isFinish: {
        type: Boolean,
        default: false
    },
    // 是否处理中
    isRunning: {
        type: Boolean,
        default: false,
    },
    // 加入的玩家
    joinPlayers: {
        type: [Number],
        default: [],
    },
    // 下一局玩家
    nextRoundPlayers: {
        type: [Number],
        default: [],
    },
    // 当前第几轮
    currentRound: {
        type: Number,
        default: 0,
    },
    // table id
    tableIdCount: {
        type: Number,
        default: 0,
    },
    // 每轮晋级分数
    minRoundScore: {
        type: Object,
        default: {}
    },
    // 每轮前几名晋级
    rankRound: {
        type: Object,
        default: {}
    },
    // 机器人列表
    robotList: {
        type: [Number],
        default: []
    },
    isNeedRobot: {
        type: Boolean,
        default: true,
    },
})

// 竞技场
export const arenaModel = mongoose.model<IArenaModel>('arena', schema)
