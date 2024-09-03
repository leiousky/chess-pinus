import {GameRoomStartType, RoomSettlementMethod, RoomType, UserStatus} from '../constants/game'
import {IClubConfig} from "../dao/models/clubConfig";

export interface IGameFrame {
    // 接收玩家消息
    receivePlayerMessage(chairId: number, msg: any): Promise<void>

    // 玩家进入房间
    onEventUserEntry(chairId: number): Promise<void>

    // 获取游戏当前数据
    getEnterGameData(chairId: number): Promise<any>

    // 游戏开始
    onEventGameStart(): Promise<void>

    // 玩家准备
    onEventGamePrepare(): Promise<void>

    // 是否允许玩家离线
    isUserEnableLeave(chairId: number): Promise<boolean>

    // 玩家离线
    onEventUserOffline(chairId: number): Promise<void>

    // 玩家离开房间
    onEventUserLeave(chairId: number): Promise<void>

    // 游戏结果
    onGetFinalResultData(): Promise<any>

    // 房间解散
    onEventRoomDismiss(msg: any): Promise<void>

    // 当前分数
    onGetCurrentScoreArr(): Promise<any>

    // 设置游戏胜率
    onSetGameWinRate(chairId: number, rate: number): Promise<void>

    onEventUserOffLine(chairId: number): Promise<void>
}

export interface IRoomFrame {
    // 根据椅子 id 获取玩家
    getUserByChairId(chairId: number): IUserInfo

    // 所有房内玩家
    getUserArr(): any

    getGameRule(): IBaseRule

    sendDataToAll(msg: any): Promise<any>

    getGameTypeInfo(): IGameTypeInfo

    getCurRobotWinRate(): number

    drawId: string
    publicParameter: any
    // 房间号
    roomId: string

    sendData(msg: any, chairIdArr: number[]): Promise<any>

    concludeGame(dataArr: any): Promise<any>

    writeUserGameResult(dataArr: any): Promise<any>

    setTakeChip(userInfo: IUserInfo): Promise<boolean>

    // checkChip(userInfo: IUserInfo): Promise<boolean>
}

// 用户信息
export interface IUserInfo {
    uid: number
    // 椅子 id
    chairId: number
    // 玩家状态
    userStatus: UserStatus
    frontendId: string
    nickname: string
    avatar: string
    // 金豆
    gold: number
    // 钻石
    diamond: number
    spreadId: string
    // 是否机器人
    robot: boolean
    // 使用的 gold
    takeChip: number
    // 战队金币
    clubGold: number
}

// // 简易 model 信息
// export interface IUserModelLite {
//     uid: number
//     nickname: string
//     avatar: string
//     gold: number
//     diamond: number
//     frontendId: string
//     spreadId: string
//     robot: boolean
// }

// 基础规则
export interface IBaseRule {
    // 房间类型
    kind: number
    // 钻石房费
    diamondCost: number
    // 金豆房费数
    goldCost: number
    // 房间算分方式
    roomSettlementMethod: RoomSettlementMethod
    // 房间类型
    roomType: RoomType
    // 最少人数
    minPlayerCount: number
    // 房主支付房费
    isOwnerPay: boolean
    // 位置数
    chairCount: number
    // 房间人数
    memberCount: number
    // 最大局数
    maxBureau: number
    // 游戏开始方式
    gameRoomStartType: GameRoomStartType
    // 房间规格
    roomLevel: number
    // 最低金豆
    goldLowerLimit: number
    // 是否为匹配房
    matchRoom: number
    // 竞技场 id
    arenaId: string
    // 俱乐部 id
    clubShortId: number
}

// 规则(所有类型的游戏规则)
export interface IGameRule {
    // 钻石房费
    diamondCost: number
    // 金豆房费数
    goldCost: number
    // 房间算分方式
    roomSettlementMethod: RoomSettlementMethod
    // 房间类型
    roomType: RoomType
    // 游戏开始方式
    gameRoomStartType: GameRoomStartType
    // 房主支付房费
    isOwnerPay: boolean
    arenaId: string
    // 俱乐部 id
    clubShortId: number
}

// 游戏配置
export interface IGameTypeInfo {
    // 写入数据库中的gameTypeID
    gameTypeID: string
    kind: number
    level: number
    minPlayerCount: number
    maxPlayerCount: number
    baseScore: number
    goldLowerLimit: number
    goldUpper: number
    matchRoom: number
    maxDrawCount: number
    minRobotCount: number
    maxRobotCount: number
    expenses: number
    // 房间类型
    roomType: number
    // 是否百人房
    hundred: number
    // 其它参数(json)
    parameters: {
        blindBetCount: number,
        preBetCount: number,
        maxTake: number
    }
}

// 好友房规则
export interface IPrivateRule {
    // 房间类型
    kind: number,
    // 钻石房费
    diamondCost: number
    // 房间算分方式
    roomSettlementMethod: RoomSettlementMethod
    // 游戏开始方式
    gameRoomStartType: GameRoomStartType
    // 是否房主支付房费
    isOwnerPay: boolean
    // 最少玩家人数
    minPlayerCount: number
    // 最多玩家人数
    maxPlayerCount: number
    // 最大局数
    maxDrawCount: number
    parameters: {
        blindBetCount: number,
        preBetCount: number,
        maxTake: number
    }
}


// 竞技场规则
export interface IArenaRule {
    // 房间类型
    kind: number,
    // 竞技场 id
    arenaId: string
    // 房间算分方式
    roomSettlementMethod: RoomSettlementMethod
    // 游戏开始方式
    gameRoomStartType: GameRoomStartType
    // 最少玩家人数
    minPlayerCount: number
    // 最多玩家人数
    maxPlayerCount: number
    // 最大局数
    maxDrawCount: number
    // 其它参数
    parameters: {
        blindBetCount: number,
        preBetCount: number,
        maxTake: number
    }
}

export interface IClubRuleInfo {
    // 规则 id
    ruleId: string
    // 房间类型
    kind: number,
    // 钻石房费
    diamondCost: number
    // 房间算分方式
    roomSettlementMethod: RoomSettlementMethod
    // 游戏开始方式
    gameRoomStartType: GameRoomStartType
    // 是否房主支付房费
    isOwnerPay: boolean
    // 最少玩家人数
    minPlayerCount: number
    // 最多玩家人数
    maxPlayerCount: number
    // 最大局数
    maxDrawCount: number
    // 俱乐部 id
    clubShortId: number
    // 房间号
    roomId: string
    // 参数
    parameters: {
        blindBetCount: number,
        preBetCount: number,
        maxTake: number
    }
}

export interface IGameConfig {
    club: IClubConfig
}
