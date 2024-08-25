import {cancelJob, pinus, scheduleJob} from 'pinus'
import {GlobalEnum} from '../../../../constants/global'
import {
    IBaseRule,
    IGameFrame,
    IGameTypeInfo,
    IRoomFrame,
    IUserInfo,
} from '../../../../types/interfaceApi'
import {BroadcastType, GameRoomStartType, RoomSettlementMethod, RoomType, UserStatus} from '../../../../constants/game'
import {PushApi, TUidAndFrontendId} from '../../../../api/push'
import {RoomProto} from './roomProto'
import services from '../../../../services'
import {RpcApi} from '../../../../api/rpc'
import {UserModel, userModel} from '../../../../dao/models/user'
import {RoomDismissReason, RoomProtoType} from '../../../../constants/roomProto'
import {userGameRecordModel} from '../../../../dao/models/userGameRecord'
import {gameProfitRecordModel} from '../../../../dao/models/gameProfitRecord'
import errorCode from '../../../../constants/errorCode'
import config = require('../../../../../config')
import {dispatch} from '../../../../util/dispatcher'
import {ClubMemberModel} from '../../../../dao/models/clubMember'
import {ClubMember} from "../../../../dao/club/clubMember";

const OFFLINE_WAIT_TIME = 10 * 1000

export abstract class BaseRoomFrame implements IRoomFrame {
    roomId: string
    roomOwnerId: number
    // 公共参数
    publicParameter: any
    // 每局编号
    drawId: string
    gameStarted: boolean
    gameStartedOnce: boolean
    lastNativeTime: number
    // 当前局
    curBureau: number
    // 申请房间解散的申请人列表
    askForExitArr: any[]
    // 房间是否解散
    roomDismissed: boolean
    // 离线玩家
    offlineSchedulerIds: object
    // 当前玩家数
    currentUserCount: number
    // 所有玩家
    userArr: { [kye: string]: IUserInfo }
    // 机器人赢钱概率
    robotWinRate: number
    gameFrameSink: IGameFrame
    // 接收机器人定时器
    requestRobotTimer: any
    // 每五分钟检测一次机器人是否足够
    requestRobotInterval: any
    gameRule: IBaseRule
    // 申请退出时间
    askForExitTm: number
    // 退出定时器
    answerExitSchedule: number
    // 房间配置
    gameTypeInfo: IGameTypeInfo

    // 百人游戏桌面显示玩家信息
    shenSuanZiInfo: any
    fuhaoInfoArr: any[]

    protected constructor(roomId: string, roomOwnerId: number, gameRule: IBaseRule, gameTypeInfo: IGameTypeInfo) {
        this.roomId = roomId
        this.drawId = ''
        this.roomOwnerId = roomOwnerId
        this.publicParameter = pinus.app.get(GlobalEnum.publicParameterKey)
        this.gameRule = gameRule

        // 房间状态
        this.lastNativeTime = Date.now()
        this.gameStarted = false
        this.gameStartedOnce = false
        this.curBureau = 0
        this.roomDismissed = false
        this.offlineSchedulerIds = {}
        this.currentUserCount = 0
        this.userArr = {}
        this.robotWinRate = 0.5
        this.initAskForExitArr()
        this.robotOperationRoomCreated()

        // 百人游戏桌面显示玩家信息
        this.shenSuanZiInfo = null
        this.fuhaoInfoArr = []
        this.gameTypeInfo = gameTypeInfo
        // 兼容
        this.gameTypeInfo.roomType = this.gameRule.roomType
        console.debug('create room:', this.roomId, 'roomOwnerId', this.roomOwnerId, this.gameTypeInfo)
    }

    // 初始化
    abstract init(): Promise<void>;

    // 接收消息
    async receiveRoomMessage(uid: number, msg: any) {
        console.log('receive roomMessage', uid, JSON.stringify(msg))
        const type = msg.type || null
        const data = msg.data || null
        if (!type || !data || !this.userArr[uid]) { // 验证数据
            return
        }

        if (type === RoomProtoType.USER_READY_NOTIFY) {
            await this.userReady(uid)
        } else if (type === RoomProtoType.USER_LEAVE_ROOM_NOTIFY) {
            await this.userLeaveRoomRequest(uid)
        } else if (type === RoomProtoType.USER_CHAT_NOTIFY) {
            // TODO chat 聊天
            console.error('receive not supported room message: chat')
            // this.userChat(data.chatData);
        } else if (type === RoomProtoType.GAME_WIN_RATE_NOTIFY) {
            await this.setGameWinRate(uid, data.rate)
        } else if (type === RoomProtoType.ASK_FOR_DISMISS_NOTIFY) {
            await this.askForDismiss(uid, data.isExit)
        } else if (type === RoomProtoType.USER_RECONNECT_NOTIFY) {
            await this.userReconnect(uid)
        } else if (type === RoomProtoType.ASK_FOR_DISMISS_STATUS_NOTIFY) {
            await this.askForDismissStatus(uid)
        } else if (type === RoomProtoType.SORRY_I_WILL_WIN_NOTIFY) {
            console.error('receive not supported room message: SORRY_I_WILL_WIN_NOTIFY')
            // this.userWillWin(uid, data)
        } else if (type === RoomProtoType.GET_ROOM_SCENE_INFO_NOTIFY) {
            await this.getRoomSceneInfo(uid)
        } else if (type === RoomProtoType.GET_ROOM_SHOW_USER_INFO_NOTIFY) {
            await this.getRoomShowUserInfo(uid)
        } else if (type === RoomProtoType.GET_ROOM_ONLINE_USER_INFO_NOTIFY) {
            await this.getRoomOnlineUserInfo(uid)
        } else {
            console.error('roomFrame', 'receiveRoomMessage err: type not find')
        }
    }

    async receiveGameMessage(uid: number, msg: any) {
        console.log('receive gameMessage', uid, msg)
        const chairId = this.getChairIdByUid(uid)
        if (chairId >= 0 && chairId < this.gameRule.chairCount) {
            await this.gameFrameSink.receivePlayerMessage(chairId, msg)
        }
    }

    // 发送消息
    async sendData(msg: any, chairIdArr: number[]) {
        if (!chairIdArr) {
            chairIdArr = []
            for (const key of Object.keys(this.userArr)) {
                if (this.userArr[key]) {
                    chairIdArr.push(this.userArr[key].chairId)
                }
            }
        }
        const uidAndFrontendIdArr = []
        for (let i = 0; i < chairIdArr.length; ++i) {
            const user = this.getUserByChairId(chairIdArr[i])
            if (!!user && (user.userStatus & UserStatus.offline) === 0 && !user.robot) {
                uidAndFrontendIdArr.push({uid: user.uid, sid: user.frontendId})
            }
        }
        if (uidAndFrontendIdArr.length === 0) return
        console.debug('roomFrame', 'send game Data:' + JSON.stringify(msg))
        await PushApi.gameMessagePush(msg, uidAndFrontendIdArr)
    }

    async sendDataToAll(msg: any) {
        await this.sendData(msg, null)
    }

    // 过滤不需要发消息的椅子
    async sendDataExceptChairIds(msg: any, exceptChairIds: number[], allChairIds: number[]) {
        if (!allChairIds) {
            allChairIds = []
            for (const key of Object.keys(this.userArr)) {
                if (this.userArr[key]) {
                    const user = this.userArr[key]
                    if (user.robot) continue
                    allChairIds.push(user.chairId)
                }
            }
        }
        const newChairIds = allChairIds.slice()
        for (let i = 1; i < exceptChairIds.length; i++) {
            for (let j = 1; j < newChairIds.length; j++) {
                if (exceptChairIds[i] === newChairIds[j]) {
                    newChairIds.splice(j, 1)
                }
            }
        }
        await this.sendData(msg, newChairIds)
    }

    async sendRoomData(msg: any, uidAndFrontendIdArr: TUidAndFrontendId) {
        if (!uidAndFrontendIdArr) {
            uidAndFrontendIdArr = []
            for (const key of Object.keys(this.userArr)) {
                if (this.userArr[key]) {
                    const user = this.userArr[key]
                    if ((user.userStatus & UserStatus.offline) === 0 && !user.robot) {
                        uidAndFrontendIdArr.push({uid: key, sid: user.frontendId})
                    }
                }
            }
        } else {
            const tempArr = []
            for (let i = 0; i < uidAndFrontendIdArr.length; ++i) {
                if (uidAndFrontendIdArr[i].sid) {
                    tempArr.push(uidAndFrontendIdArr[i])
                }
            }
            uidAndFrontendIdArr = tempArr
        }
        if (uidAndFrontendIdArr.length === 0) return
        console.debug('roomFrame', 'send room Data:' + JSON.stringify(msg))
        await PushApi.roomMessagePush(msg, uidAndFrontendIdArr)
    }

    async sendRoomDataToAll(msg: any) {
        await this.sendRoomData(msg, null)
    }

    async sendPopDialogContent(code: number, chairIdArr: number[]) {
        let i: number
        if (!chairIdArr) {
            chairIdArr = []
            for (i = 0; i < this.gameRule.chairCount; ++i) {
                chairIdArr.push(i)
            }
        }
        const uidAndFrontendIdArr: TUidAndFrontendId = []
        for (i = 0; i < chairIdArr.length; ++i) {
            const user = this.getUserByChairId(chairIdArr[i])
            if (!!user && (user.userStatus & UserStatus.offline) === 0 && !user.robot) {
                uidAndFrontendIdArr.push({uid: user.uid.toString(), sid: user.frontendId})
            }
        }
        if (uidAndFrontendIdArr.length === 0) return
        console.info('sendPopDialogContent sendData:', code)
        await PushApi.popDialogContentPush({code: code}, uidAndFrontendIdArr)
    }

    async sendPopDialogContentToAll(code: number) {
        await this.sendPopDialogContent(code, null)
    }

    async sendRoomDataExceptUid(msg: any, uidArr: number[]) {
        const uidAndFrontendIdArr: TUidAndFrontendId = []
        let key: string
        for (key of Object.keys(this.userArr)) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if ((user.userStatus & UserStatus.offline) === 0 && uidArr.indexOf(Number(key)) === -1 && !user.robot)
                    uidAndFrontendIdArr.push({uid: key, sid: user.frontendId})
            }
        }
        await this.sendRoomData(msg, uidAndFrontendIdArr)
    }

    async updateRoomUserInfo(newUserInfo: any, notify: boolean) {
        const user = this.userArr[newUserInfo.uid] || null
        if (user) {
            // 更新用户信息
            for (const key of Object.keys(newUserInfo)) {
                if (newUserInfo[key] && user[key] && key !== 'uid') {
                    user[key] = newUserInfo[key]
                }
            }
            if (notify) {
                await this.sendRoomDataToAll(RoomProto.userInfoChangePush(user))
            }
            return true
        }
        return false
    }

    async userSelfEntryRoomPush(uid: number) {
        const user = this.userArr[uid]
        if (!user) {
            // 用户不存在
            return
        }
        await this.gameFrameSink.onEventUserEntry(user.chairId)
        if (user.robot) {
            return
        }
        const userInfoArr = []
        if (this.gameRule.roomType !== RoomType.hundred) {
            for (const key in this.userArr) {
                if (this.userArr[key]) {
                    const user1 = this.userArr[key]
                    userInfoArr.push({
                        userInfo: user1,
                        chairId: user1.chairId,
                        userStatus: user1.userStatus
                    })
                }
            }
        } else {
            userInfoArr.push({
                userInfo: user,
                chairId: user.chairId,
                userStatus: user.userStatus
            })
        }

        const gameData = await this.gameFrameSink.getEnterGameData(user.chairId)	//获取游戏当前数据
        if (this.gameRule.roomType === RoomType.private) {
            gameData.askForExitArr = this.askForExitArr
        } else {
            gameData.askForExitArr = []
        }
        await PushApi.selfEntryRoomPush(
            RoomProto.selfEntryRoomPush(userInfoArr, gameData, this.gameRule.kind, this.roomId, this.drawId),
            [{uid: uid.toString(), sid: user.frontendId}])
    }

    // 游戏开始相关

    async userReady(uid: number) {
        console.debug('roomFrame', 'startGame uid:' + uid)
        const user = this.userArr[uid]
        if (user) {
            user.userStatus |= UserStatus.ready
        }
        const msg = RoomProto.userReadyPush(user.chairId)
        await this.sendRoomData(msg, null)
        if (this.efficacyStartGame()) { // 判断游戏是否需要开始
            await this.startGame()
        }
    }

    async startGame() {
        console.debug('roomFrame', 'gameType:' + this.gameRule.kind, 'startGame roomID:' + this.roomId)
        if (this.gameStarted) {
            return false
        }
        this.gameStarted = true
        this.gameStartedOnce = true
        this.lastNativeTime = Date.now()
        this.initAskForExitArr()
        if (this.requestRobotTimer) clearTimeout(this.requestRobotTimer)
        this.drawId = this.gameRule.kind + '-' + this.roomId + '-' + services.time.drawIdTime()
        const rate = await RpcApi.getCurRobotWinRate(this.gameRule.kind)
        if (rate) {
            this.robotWinRate = rate
        }

        // 修改房间中玩家状态
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                user.userStatus |= UserStatus.playing
            }
        }
        await this.gameFrameSink.onEventGameStart()
    }

    // 判断游戏是否开始
    efficacyStartGame() {
        if (this.roomDismissed) return false
        let readyCount = 0
        let userCount = 0
        if (this.gameStarted) {
            return false
        } else {
            if (this.gameRule.gameRoomStartType === GameRoomStartType.autoStart) {
                return true
            }
            for (const key in this.userArr) {
                if (this.userArr[key]) {
                    ++userCount
                    if ((this.userArr[key].userStatus & UserStatus.ready) > 0) {
                        ++readyCount
                    }
                }
            }
            if (userCount === readyCount) {
                return readyCount >= this.gameRule.minPlayerCount
            } else {
                return false
            }
        }
    }

    // 扣除费用
    async deductExpense() {
        if (this.gameRule.roomType == RoomType.normal) {
            await this.deductGoldPay()
        } else if (this.gameRule.roomType === RoomType.private) {
            // 房卡
            await this.deductRoomPay()
        } else {
            console.error('deductExpense not support roomType:' + this.gameRule.roomType)
        }
    }

    // 金币支付
    async deductGoldPay() {
        if (this.gameRule.goldCost > 0) {
            for (let i = 0; i < this.gameRule.chairCount; ++i) {
                await this.writeUserGold(i, -this.gameRule.goldCost)
            }
        }
    }

    // 房卡支付
    async deductRoomPay() {
        // TODO 什么时候扣房费
        if (this.curBureau > 0) {
            // 已经扣过了
            return
        }
        if (this.gameRule.isOwnerPay) {
            // 房主付
            await this.writeUserDiamond(0, -this.gameRule.diamondCost)
        } else {
            // 均摊
            const cost = Math.floor(this.gameRule.diamondCost / this.gameRule.memberCount)
            for (let i = 0; i < this.gameRule.memberCount; ++i) {
                await this.writeUserDiamond(i, cost * -1)
            }
        }
    }

    async writeUserGold(chairId: number, goldExpress: number) {
        const user = this.getUserByChairId(chairId)
        if (!user) {
            console.error('writeUserGold', 'user not exist chairId：' + chairId)
            return
        }
        const updateData = {
            $inc: {gold: goldExpress}
        }
        const record = await userModel.findOneAndUpdate({uid: user.uid}, updateData)
        await this.updateRoomUserInfo(services.user.buildGameRoomUserInfo(record, chairId, user.userStatus), false)
    }

    // 扣钻石
    async writeUserDiamond(chairId: number, diamondExpress: number) {
        const user = this.getUserByChairId(chairId)
        if (!user) {
            console.error('writeUserDiamond', 'user not exist chairId：' + chairId)
            return
        }
        const updateData = {
            $inc: {diamond: diamondExpress}
        }
        const record = await userModel.findOneAndUpdate({uid: user.uid}, updateData)
        await this.updateRoomUserInfo(services.user.buildGameRoomUserInfo(record, chairId, user.userStatus), false)
    }

    // 游戏结束相关

    async concludeGame(dataArr: any) {
        console.log('concludeGame roomId', this.roomId, 'data', dataArr)
        if (!this.gameStarted) {
            return
        }
        ++this.curBureau
        this.gameStarted = false
        // 修改玩家状态
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                user.userStatus &= ~UserStatus.ready
                user.userStatus &= ~UserStatus.playing
            }
        }
        console.debug('concludeGame', 'data:' + JSON.stringify(dataArr), 'maxBureau', this.gameRule.maxBureau, 'curBureau', this.curBureau)
        if (this.gameRule.roomType != RoomType.private) {
            // 记录游戏数据
            await this.recordGameResult(dataArr)
            // TODO 更新游戏内排行信息
            // this.updateRoomRankInfo(dataArr)
        }
        // 通知竞技场，小局结束
        if (this.gameRule.roomType == RoomType.arena) {
            const gameServer = dispatch(this.roomId, pinus.app.getServersByType('arena'))
            const params = {
                arenaId: this.gameRule.arenaId,
                roomId: this.roomId,
                data: dataArr,
            }
            await RpcApi.arenaRoundOver(gameServer.id, params)
        }
        // 判断游戏是否结束
        if (!!this.gameRule.maxBureau && (this.curBureau >= this.gameRule.maxBureau)) {
            // 游戏结束则直接解散房间
            await this.dismissRoom(RoomDismissReason.none)
        } else {
            // 移除掉线玩家
            if (this.gameRule.roomType !== RoomType.private) {
                await this.clearOfflineUser()
            }
            // 移除不满足条件的玩家
            await this.clearNonSatisfiedConditionsUser()
            // 游戏结束时，机器人操作
            await this.robotOperationConcludeGame()
            if (this.roomDismissed) {
                return
            }
            // 游戏准备
            await this.gameFrameSink.onEventGamePrepare()
            // 游戏准备时机器人操作
            await this.robotOperationGamePrepare()
            // 判定游戏是否开始
            if (this.efficacyStartGame()) {
                await this.startGame()
            }
        }
    }

    async recordGameResult(dataArr: any) {
        if (!dataArr || dataArr.length == 0) {
            return
        }
        switch (this.gameRule.roomSettlementMethod) {
            // 金豆房
            case RoomSettlementMethod.gold:
                return await this.recordGameResultByGold(dataArr)
            case RoomSettlementMethod.clubGold:
                return await this.recordGameResultByClubGold(dataArr)
            default:
                console.error('roomSettlementMethod not supported:', this.gameRule.roomSettlementMethod)
        }
    }

    // 保存金豆房记录
    async recordGameResultByGold(dataArr: any) {
        // 计算最终获得金币数量
        // TODO 是否要抽水
        // const profitPercentage = parseInt(this.publicParameter["profitPercentage"] || 5) / 100;
        const profitPercentage = 0
        const saveDataArr = []
        let systemGoldChange = 0
        let gameProfitTotal = 0
        const broadcastContentArr = []
        for (let i = 0; i < dataArr.length; ++i) {
            const data = dataArr[i]
            const tempScore = data.score
            if (data.score > 0) {
                data.score *= (1 - profitPercentage)
            }
            const user = this.userArr[data.uid]
            if (!user) continue
            if (user.robot) {
                await this.updateRoomUserInfo({
                    uid: user.uid,
                    gold: user.gold + data.score
                }, this.gameRule.roomType !== RoomType.hundred)
            } else {
                // 记录抽水总额
                if (tempScore > 0) {
                    gameProfitTotal += (tempScore * profitPercentage)
                }
                // 记录系统输赢分数
                systemGoldChange -= tempScore
                saveDataArr.push({
                    uid: data.uid,
                    $inc: {
                        gold: data.score,
                        achievement: tempScore > 0 ? tempScore : (tempScore * -1),
                        todayWinGoldCount: data.score
                    }
                })

            }
            // 记录广播内容
            if (tempScore >= 1000) {
                broadcastContentArr.push({
                    nickname: user.nickname,
                    kind: this.gameRule.kind,
                    gold: tempScore
                })
            }
        }
        // 推送广播
        if (broadcastContentArr.length > 0) {
            await PushApi.broadcastPush({type: BroadcastType.bigWin, broadcastContentArr})
        }
        // 写入分数
        for (const data of Object.values(saveDataArr)) {
            const record = await userModel.findOneAndUpdate({uid: data.uid}, data)
            if (this.userArr[record.uid]) {
                const user = this.userArr[record.uid]
                await this.updateRoomUserInfo(services.user.buildGameRoomUserInfo(record, user.chairId, user.userStatus), this.gameRule.roomType !== RoomType.hundred)
            }
            if (record.frontendId) {
                await this.updateUserDataNotify(record.uid.toString(), record.frontendId, {
                    gold: record.gold,
                    achievement: record.achievement,
                    todayWinGoldCount: record.todayWinGoldCount
                })
            }
        }
        const userGameRecordArr = []
        for (let j = 0; j < saveDataArr.length; ++j) {
            userGameRecordArr.push({
                drawID: this.drawId,
                roomLevel: this.gameRule.roomLevel,
                uid: saveDataArr[j].uid,
                kind: this.gameRule.kind,
                changeGold: saveDataArr[j].$inc.gold,
                createTime: Date.now()
            })
        }
        // 记录玩家金币变化
        await userGameRecordModel.insertMany(userGameRecordArr)

        // 记录抽水比例
        if (gameProfitTotal > 0) {
            const curDay = services.time.startOfDayBySeconds()
            const saveData = {
                day: curDay,
                $inc: {'count': gameProfitTotal}
            }
            const updater = {upsert: true}
            // 新增或者更新当天数据
            await gameProfitRecordModel.findOneAndUpdate({day: curDay}, saveData, updater)
        }
        // 记录库存值变化
        if (systemGoldChange !== 0) {
            await RpcApi.robotGoldChanged(this.gameRule.kind, systemGoldChange)
        } else {
            console.debug('recordGameResult', 'robotGoldChange === 0')
        }
    }

    // 保存战队房记录
    async recordGameResultByClubGold(dataArr: any) {
        for (let i = 0; i < dataArr.length; ++i) {
            const data = dataArr[i]
            const user = this.userArr[data.uid]
            if (!user || user.robot) continue
            const userRecord = await UserModel.getUserById(data.uid)
            const record = await ClubMember.getClubMember(this.gameRule.clubShortId, data.uid)
            record.addClubGold(data.score)
            if (this.userArr[userRecord.uid]) {
                const user = this.userArr[userRecord.uid]
                await this.updateRoomUserInfo(services.user.buildGameRoomUserInfo(userRecord, user.chairId, user.userStatus), this.gameRule.roomType !== RoomType.hundred)
            }
            if (userRecord.frontendId) {
                await this.updateUserDataNotify(userRecord.uid.toString(), userRecord.frontendId, {
                    clubCoin: record.m.clubGold
                })
            }
            await record.save()
        }
        // const userGameRecordArr = []
        // for (let j = 0; j < saveDataArr.length; ++j) {
        //     userGameRecordArr.push({
        //         drawID: this.drawId,
        //         roomLevel: this.gameRule.roomLevel,
        //         uid: saveDataArr[j].uid,
        //         kind: this.gameRule.kind,
        //         changeGold: saveDataArr[j].$inc.gold,
        //         createTime: Date.now()
        //     })
        // }
    }

    async updateUserDataNotify(uid: string, sid: string, msg: any) {
        await PushApi.updateUserInfoPush(msg, [{uid, sid}])
    }

    /**
     * 进入房间相关
     */

    async userEntryRoom(userInfo: IUserInfo, frontendId: string): Promise<number> {
        console.debug('roomFrame', this.roomId, 'userEntryRoom, frontendId:' + frontendId + ',userInfo:' + JSON.stringify(userInfo))
        if (this.roomDismissed) {
            return errorCode.roomHasDismiss
        }
        let user = this.userArr[userInfo.uid]
        const chairId = this.getEmptyChairId(userInfo.uid)
        if (chairId < 0) {
            console.error('userEntryRoom', 'not empty chair')
            return errorCode.roomFull
        }
        const isAllowEntry = await this.checkEntryRoom(userInfo, chairId)
        if (!isAllowEntry) {
            return errorCode.roomExpenseNotEnough
        }
        if (!user) {
            // 构建用户信息
            user = {
                avatar: userInfo.avatar,
                diamond: userInfo.diamond,
                gold: userInfo.gold,
                nickname: userInfo.nickname,
                robot: userInfo.robot,
                spreadId: userInfo.spreadId,
                uid: userInfo.uid,
                frontendId,
                chairId,
                userStatus: UserStatus.none,
                takeChip: 0,
            }
            this.userArr[userInfo.uid] = user
            this.currentUserCount++

            if (userInfo.robot && !this.gameStarted) {
                await this.robotOperationExecReady(userInfo.uid)
            }
        } else {
            user = userInfo
            user.frontendId = frontendId
            if ((user.userStatus & UserStatus.offline) > 0) {
                // 玩家之前离线
                user.userStatus &= ~UserStatus.offline
            }
            // 取消离线倒计时
            if (this.offlineSchedulerIds[userInfo.uid]) {
                cancelJob(this.offlineSchedulerIds[userInfo.uid])
                delete this.offlineSchedulerIds[userInfo.uid]
            }
        }
        if (userInfo.robot) {
            return errorCode.ok
        }
        // 非机器人
        await userModel.findOneAndUpdate({uid: userInfo.uid}, {isLockGold: 'true', roomID: this.roomId})
        await this.updateUserDataNotify(userInfo.uid.toString(), userInfo.frontendId, {roomID: this.roomId})
        await RpcApi.userEntryRoom(userInfo.uid.toString(), userInfo.frontendId, this.roomId)
        // 推送玩家自己进入房间的消息
        await this.userSelfEntryRoomPush(user.uid)
        if (this.gameRule.roomType !== RoomType.hundred) {
            // 向其他玩家推送进入房间的消息(除了百人房间)
            const roomUserInfo = {
                userInfo: user,
                userStatus: user.userStatus,
                chairId: user.chairId
            }
            const otherUserEntryRoomPush = RoomProto.otherUserEntryRoomPush(roomUserInfo)
            await this.sendRoomDataExceptUid(otherUserEntryRoomPush, [user.uid])
        }
        // 非机器人进入房间的操作
        await this.robotOperationUserEntry()
        // 判断游戏是否需要开始
        if (this.efficacyStartGame()) {
            await this.startGame()
        }
        return errorCode.ok
    }

    getEmptyChairId(uid: number) {
        if (this.userArr[uid]) {
            return this.userArr[uid].chairId
        }
        const usedArr = []
        let key: string
        for (key in this.userArr) {
            if (this.userArr[key]) {
                usedArr.push(this.userArr[key].chairId)
            }
        }
        console.debug('getEmptyChairId', 'userArr:' + JSON.stringify(usedArr), 'chair count', this.gameRule.chairCount)
        for (let i = 0; i < this.gameRule.chairCount; ++i) {
            if (usedArr.indexOf(i) === -1) {
                return i
            }
        }
        return -1
    }

    async checkEntryRoom(userInfo: IUserInfo, chairId: number) {
        if (this.gameRule.roomType === RoomType.private) {
            const diamondCost = this.getRoomDiamondCost(chairId)
            if (userInfo.diamond < diamondCost) {
                if (userInfo.uid === this.roomOwnerId) {
                    // 钻石不够
                    await this.destroyRoom(RoomDismissReason.none)
                }
                return false
            }
        } else {
            if (this.gameRule.goldCost > 0) {
                if (userInfo.gold < this.gameRule.goldCost) {
                    return false
                }
            }
        }
        return true
    }

    getRoomDiamondCost(chairId: number) {
        if (this.gameRule.isOwnerPay) {
            if (chairId == 0) {
                return this.gameRule.diamondCost
            } else {
                return 0
            }
        } else {
            return this.gameRule.diamondCost / this.gameRule.memberCount
        }
    }

    // 判断能否进入房间
    async canEnterRoom(userInfo: IUserInfo, clubShortId: number) {
        if (this.gameRule.roomType == RoomType.club) {
            // 检查俱乐部有没有此人
            const member = await ClubMemberModel.getMemberByClubShortId(clubShortId, userInfo.uid)
            if (!member) {
                // 不是俱乐部成员
                return false
            }
        }
        if (this.currentUserCount < this.gameRule.chairCount) {
            return true
        } else {
            for (const key in this.userArr) {
                if (this.userArr[key]) {
                    if (this.userArr[key].uid === userInfo.uid) {
                        return true
                    }
                }
            }
        }
        return false
    }

    hasEmptyChair() {
        // 匹配房间，游戏开始之后不能在有玩家进入
        if (this.gameRule.matchRoom && this.gameStarted) {
            return false
        }
        return this.currentUserCount < this.gameRule.chairCount
    }

    async getRoomSceneInfo(uid: number) {
        const user = this.userArr[uid]
        const userInfoArr = []
        if (this.gameRule.roomType !== RoomType.hundred) {
            for (const key in this.userArr) {
                if (this.userArr[key]) {
                    const user1 = this.userArr[key]
                    userInfoArr.push({
                        userInfo: user1,
                        chairId: user1.chairId,
                        userStatus: user1.userStatus
                    })
                }
            }
        }
        const gameData = !this.gameFrameSink.getEnterGameData ? {} : await this.gameFrameSink.getEnterGameData(user.chairId)	//获取游戏当前数据
        if (this.gameRule.roomType === RoomType.private) {
            gameData.askForExitArr = this.askForExitArr
        } else {
            gameData.askForExitArr = []
        }
        // 添加 gameTypeInfo
        await this.sendRoomData(RoomProto.getRoomSceneInfoPush(userInfoArr, gameData, this.roomId, this.drawId, services.parameter.toClientGameTypeInfo(this.gameTypeInfo)), [{
            uid: uid.toString(),
            sid: user.frontendId
        }])
    }

    async getRoomShowUserInfo(uid: number) {
        const selfInfo = {
            userInfo: this.userArr[uid],
            winCount: 0,
            betCount: 0
        }
        await this.sendRoomData(RoomProto.getRoomShowUserInfoPush(selfInfo, this.shenSuanZiInfo, this.fuhaoInfoArr.slice(0, 5)), [{
            uid: uid.toString(),
            sid: this.userArr[uid].frontendId
        }])
    }

    async getRoomOnlineUserInfo(uid: number) {
        await this.sendRoomData(RoomProto.getRoomOnlineUserInfoPush(this.shenSuanZiInfo, this.fuhaoInfoArr), [{
            uid: uid.toString(),
            sid: this.userArr[uid].frontendId
        }])
    }

    /**
     * 离开房间相关
     *
     */

    // 玩家断线重连
    async userReconnect(uid: number) {
        const user = this.userArr[uid]
        if ((user.userStatus & UserStatus.offline) > 0) {
            user.userStatus &= ~UserStatus.offline
        }
        // 取消离线倒计时
        if (this.offlineSchedulerIds[uid]) {
            cancelJob(this.offlineSchedulerIds[uid])
            delete this.offlineSchedulerIds[uid]
        }

        // 推送游戏数据
        const gameData = await this.gameFrameSink.getEnterGameData(user.chairId)
        if (this.gameRule.roomType === RoomType.private) {
            gameData.askForExitArr = this.askForExitArr
        } else {
            gameData.askForExitArr = []
        }
        const msg = RoomProto.getUserReconnectPushData(gameData)
        await this.sendData(msg, [user.chairId])
        if (this.gameRule.roomType !== RoomType.hundred) {
            // 向其他玩家推送进入房间的消息(除百人游戏外)
            const roomUserInfo = {
                userInfo: user,
                userStatus: user.userStatus,
                chairId: user.chairId
            }
            const otherUserEntryRoomPush = RoomProto.otherUserEntryRoomPush(roomUserInfo)
            await this.sendRoomDataExceptUid(otherUserEntryRoomPush, [user.uid])
        }
    }

    async userLeaveRoomRequest(uid: number) {
        console.debug('roomFrame', 'userLeaveRoomRequest uid:' + uid)
        const user = this.userArr[uid] || null
        if (user) {
            if (this.gameStarted && (user.userStatus & UserStatus.playing) !== 0 && !await this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                await this.sendPopDialogContent(errorCode.canNotLeaveRoom, [user.chairId])
                const response = RoomProto.userLeaveRoomResponse(user.chairId)
                if (this.gameRule.roomType === RoomType.hundred) {
                    await this.sendRoomData(response, [{uid: uid.toString(), sid: user.frontendId}])
                } else {
                    await this.sendRoomDataToAll(response)
                }
            } else {
                await this.userLeaveRoom(uid)
            }
        } else {
            console.warn('roomFrame', 'userLeaveRoomRequest user not exist uid:' + uid)
        }
    }

    async userLeaveRoom(uid: number) {
        console.debug('roomFrame', 'userLeaveRoom uid:' + uid)
        const user = this.userArr[uid] || null
        if (user) {
            const response = RoomProto.userLeaveRoomResponse(user.chairId)
            if (this.gameRule.roomType === RoomType.hundred) {
                await this.sendRoomData(response, [{uid: uid.toString(), sid: user.frontendId}])
            } else {
                await this.sendRoomDataToAll(response)
            }
            // 私人房间
            if (this.gameRule.roomType === RoomType.private) {
                // 开始过游戏无法直接退出
                if (this.gameStartedOnce) {
                    user.userStatus |= UserStatus.offline
                    await this.sendRoomData(RoomProto.userOffLinePush(user.chairId), [{
                        uid: uid.toString(),
                        sid: user.frontendId
                    }])
                } else {
                    // 未开始过游戏，可直接退出，房主退出，房间直接解散
                    if (uid == this.roomOwnerId) {
                        await this.dismissRoom(RoomDismissReason.ownerAsk)
                    } else {
                        await this.kickUser(uid)
                    }
                }
            } else {
                // 非私人房间
                if (this.gameStarted && (user.userStatus & UserStatus.playing) !== 0) {
                    if (await this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                        await this.kickUser(uid)
                    } else {
                        user.userStatus |= UserStatus.offline
                        if (this.gameRule.roomType !== RoomType.hundred) {
                            await this.sendRoomDataToAll(RoomProto.userOffLinePush(user.chairId))
                        }
                        await this.gameFrameSink.onEventUserOffLine(user.chairId)
                    }
                } else {
                    await this.kickUser(uid)
                }
            }
        } else {
            console.warn('roomFrame', 'userLeaveRoom user not exist uid:' + uid)
        }
    }

    async userLeaveRoomNotify(uidAndSidArr: TUidAndFrontendId) {
        for (let i = 0; i < uidAndSidArr.length; ++i) {
            const uidAndSid = uidAndSidArr[i]
            const updateUserData = {
                roomID: '',
                isLockGold: 'false'
            }
            await userModel.findOneAndUpdate({uid: uidAndSid.uid}, updateUserData)
            await this.updateUserDataNotify(uidAndSid.uid, uidAndSid.sid, updateUserData)
            // 通知 connector 清除房间号
            await RpcApi.userLeaveRoom(uidAndSid.uid, uidAndSid.sid)
        }
    }

    async userOffline(uid: number) {
        console.debug('roomFrame', 'userOffLine uid:' + uid)
        const user = this.userArr[uid]
        if (user) {
            if (this.gameRule.roomType === RoomType.private) {
                await this.userLeaveRoom(uid)
            } else {
                if (!this.gameStarted || await this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                    await this.userLeaveRoom(uid)
                } else {
                    if (!this.offlineSchedulerIds[uid] && this.offlineSchedulerIds[uid] !== 0) {
                        // 设置定时器
                        this.offlineSchedulerIds[uid] = scheduleJob({
                            start: Date.now() + OFFLINE_WAIT_TIME,
                            count: 1
                        }, function () {
                            // 移除定时
                            delete this.offlineSchedulerIDs[uid]
                            this.userLeaveRoom(uid)
                        }.bind(this))
                    } else {
                        console.warn('roomFrame', 'userOffLine offlineSchedulerIDs is exist. uid:' + uid)
                    }
                }
            }
        } else {
            console.warn('roomFrame', 'userOffLine user not exist uid:' + uid)
        }
    }

    /**
     * 解散房间相关
     */

    // 解散房间
    async dismissRoom(reason: RoomDismissReason) {
        if (this.roomDismissed) {
            return
        }
        console.debug('roomFrame', 'dismissRoom roomID:' + this.roomId)
        this.roomDismissed = true
        if (this.requestRobotTimer) {
            clearTimeout(this.requestRobotTimer)
        }
        if (this.requestRobotInterval) {
            clearTimeout(this.requestRobotInterval)
        }
        if (reason === RoomDismissReason.userAsk || reason === RoomDismissReason.none) {
            if (this.gameRule.roomType === RoomType.private) {
                if (this.gameFrameSink.onGetFinalResultData) {
                    const gameResult = this.gameFrameSink.onGetFinalResultData()
                    const msg = RoomProto.getGameEndPushData(gameResult)
                    await this.sendRoomDataToAll(msg)
                } else {
                    // 空数据
                    const msg = RoomProto.getGameEndPushData(null)
                    await this.sendRoomDataToAll(msg)
                }
            }
        }

        // 通知大厅玩家离开了房间
        const uidAndSidArr = []
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if (!user.robot) {
                    uidAndSidArr.push({uid: user.uid, sid: user.frontendId})
                }
            }
        }

        await this.userLeaveRoomNotify(uidAndSidArr)
        // 通知 room 服务器，房间解散
        await RpcApi.dismissRoom(this.roomId,)
        // 解散房间
        await this.destroyRoom(reason)
        await this.robotOperationDismissRoom()

        // 通知所有人，房间解散
        const msg = RoomProto.roomDismissPush(reason)
        await this.sendRoomDataToAll(msg)
    }

    async destroyRoom(reason: RoomDismissReason) {
        console.debug('roomFrame', 'destroyRoom roomID:' + this.roomId)
        await this.gameFrameSink.onEventRoomDismiss(reason)
        this.gameFrameSink = null
    }

    async clearOfflineUser() {
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if ((user.userStatus & UserStatus.offline) !== 0) {
                    // 玩家离线
                    if (this.gameRule.gameRoomStartType === GameRoomStartType.autoStart) {
                        if (await this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                            await this.kickUser(user.uid)
                        }
                    } else {
                        await this.kickUser(user.uid)
                    }
                }
            }
        }
    }

    async kickUser(uid: number) {
        console.debug('roomFrame', 'kickUser uid:' + uid)
        const user = this.userArr[uid] || null
        if (!user) {
            return
        }
        // 通知游戏，用户离开
        if (this.gameStarted && !!this.gameFrameSink && !!this.gameFrameSink.onEventUserLeave) {
            await this.gameFrameSink.onEventUserLeave(user.chairId)
        }

        if (!user.robot) {
            // 通知大厅，玩家离开房间
            await this.userLeaveRoomNotify([{uid: uid.toString(), sid: user.frontendId}])
        } else {
            // 通知机器人服务器，机器人离开房间
            await RpcApi.robotLeaveRoomNotify(this.gameRule.kind, [uid])
        }
        const userRoomInfo = {
            userInfo: user,
            chairId: user.chairId
        }
        // 百人房间只向退出玩家推送离开消息
        const otherUserLeavePush = RoomProto.userLeaveRoomPush(userRoomInfo)
        if (this.gameRule.roomType === RoomType.hundred) {
            await this.sendRoomData(otherUserLeavePush, [{uid: uid.toString(), sid: user.frontendId}])
        } else {
            await this.sendRoomDataToAll(otherUserLeavePush)
        }
        delete this.userArr[uid]
        --this.currentUserCount
        // 停止定时器
        if (!!this.offlineSchedulerIds[uid] || this.offlineSchedulerIds[uid] === 0) {
            cancelJob(this.offlineSchedulerIds[uid])
            delete this.offlineSchedulerIds[uid]
        }

        // 当有用户离开时
        if (!user.robot) {
            // 机器人的操作
            await this.robotOperationUserLeaved()
        }
        if (this.efficacyStartGame()) {
            await this.startGame()
        }
        if (this.efficacyDismissRoom()) {
            await this.dismissRoom(RoomDismissReason.none)
        }
    }

    efficacyDismissRoom() {
        if (this.roomDismissed) return false
        if (this.gameRule.roomType === RoomType.hundred) return false
        return this.currentUserCount === 0
    }

    async clearNonSatisfiedConditionsUser() {
        const kickUidArr = []
        const notifyArr = []
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if (user.gold < this.gameRule.goldLowerLimit) {
                    kickUidArr.push(user.uid)
                    if (!user.robot) {
                        notifyArr.push(user.chairId)
                    }
                }
            }
        }
        if (notifyArr.length > 0) {
            await this.sendPopDialogContent(errorCode.leaveRoomGoldNotEnoughLimit, notifyArr)
        }
        if (kickUidArr.length > 0) {
            setTimeout(function () {
                for (let i = 0; i < kickUidArr.length; ++i) {
                    this.kickUser(kickUidArr[i])
                }
            }.bind(this), 1000)
        }
    }

    // 玩家请求解散房间
    async askForDismiss(uid: number, isExit: boolean) {
        // 如果是非私人房，请求解散则直接退出房间
        if (this.gameRule.roomType !== RoomType.private) {
            await this.userLeaveRoomRequest(uid)
            return
        }
        // 游戏未开始 直接离开
        if (!this.gameStartedOnce) {
            await this.userLeaveRoom(uid)
            return
        }
        const nameArr = []
        for (let a = 0; a < this.gameRule.chairCount; ++a) {
            nameArr[a] = ''
        }
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                nameArr[this.userArr[key].chairId] = this.userArr[key].nickname
            }
        }

        let scoreArr = []
        if (this.gameFrameSink.onGetCurrentScoreArr) {
            scoreArr = await this.gameFrameSink.onGetCurrentScoreArr()
        } else {
            for (let b = 0; b < this.gameRule.chairCount; ++b) {
                scoreArr[b] = 0
            }
        }

        let nullCount = 0, trueCount = 0
        if (isExit === true || isExit === false) {
            this.askForExitArr[this.userArr[uid].chairId] = isExit
        }
        for (let c = 0; c < this.askForExitArr.length; ++c) {
            if (this.askForExitArr[c] === null) {
                ++nullCount
            } else if (this.askForExitArr[c] === true) {
                ++trueCount
            }
        }

        if (nullCount === this.askForExitArr.length - 1) {
            this.askForExitTm = Date.now()
            if (!this.answerExitSchedule) {
                this.answerExitSchedule = scheduleJob({
                    start: this.askForExitTm + config.game.answerExitSeconds * 1000,
                    count: 1
                }, function () {
                    for (let i = 0; i < this.gameRule.chairCount; ++i) {
                        if (this.askForExitArr[i] === null) {
                            const user = this.getUserByChairId(i)
                            this.askForDismiss(user.userInfo.uid, true)
                        }
                    }
                }.bind(this))
            }
        }
        const msg_a = RoomProto.getAskForDismissPushData(this.askForExitArr, nameArr, scoreArr, this.askForExitTm, this.userArr[uid].chairId)
        if (isExit === true || isExit === false) {
            await this.sendRoomData(msg_a, null)
        } else {
            await this.sendRoomData(msg_a, null)
        }

        if (nullCount === 0) {
            if (this.answerExitSchedule) {
                cancelJob(this.answerExitSchedule)
                this.answerExitSchedule = null
                this.askForExitTm = null
            }
            this.initAskForExitArr()
        }
        if (trueCount === this.askForExitArr.length) {
            if (this.curBureau >= 1) {
                await this.dismissRoom(RoomDismissReason.userAsk)
            } else {
                await this.dismissRoom(RoomDismissReason.ownerAsk)
            }
        }
    }

    async askForDismissStatus(uid: number) {
        let isOnDismiss = false
        for (let i = 0; i < this.askForExitArr.length; ++i) {
            if (this.askForExitArr[i] !== null) {
                isOnDismiss = true
                break
            }
        }
        const msg = RoomProto.getAskDismissStatusPushData(isOnDismiss)
        const uidAndFrontendIdArr = [{
            uid: uid.toString(),
            sid: this.userArr[uid].frontendId
        }]
        await this.sendRoomData(msg, uidAndFrontendIdArr)
    }

    initAskForExitArr() {
        if (!this.askForExitArr) {
            this.askForExitArr = []
        }
        let i
        for (i = 0; i < this.gameRule.chairCount; ++i) {
            this.askForExitArr[i] = null
        }
        return this.askForExitArr
    }


    /**
     * 机器人相关
     */

    // 通知机器人，房间创建好了
    robotOperationRoomCreated() {
        if (this.gameRule.roomType === RoomType.private) return
        if (this.gameRule.matchRoom) {
            if (this.requestRobotTimer) return
            // 玩家进入后，如果玩家人数不足，则用机器人补齐
            this.requestRobotTimer = setTimeout(async function () {
                this.requestRobotTimer = null
                if (this.gameStarted || this.roomDismissed) return
                const gameTypeInfo = this.gameTypeInfo
                let needMinRobotCount = gameTypeInfo.minPlayerCount - this.currentUserCount
                let needMaxRobotCount = gameTypeInfo.maxPlayerCount - this.currentUserCount
                if (needMinRobotCount < gameTypeInfo.minRobotCount && needMaxRobotCount >= gameTypeInfo.minRobotCount) {
                    needMinRobotCount = gameTypeInfo.minRobotCount
                }
                if (needMaxRobotCount > gameTypeInfo.maxRobotCount && needMinRobotCount <= gameTypeInfo.maxRobotCount) {
                    needMaxRobotCount = gameTypeInfo.maxRobotCount
                }
                if (needMaxRobotCount === 0) return
                await RpcApi.requestRobotNotify(this.roomId, gameTypeInfo, services.utils.getRandomNum(needMinRobotCount, needMaxRobotCount))
            }.bind(this), 10)
        } else if (this.gameRule.roomType === RoomType.hundred) {
            // 每五分钟检测一次机器人是否足够，不够则请求添加
            this.requestRobotInterval = setInterval(async function () {
                if (this.currentUserCount < 20) {
                    await RpcApi.requestRobotNotify(this.roomId, this.gameTypeInfo, 20 - this.currentUserCount,)
                }
            }.bind(this), 5 * 60 * 1000)
        } else {
            console.info('robot not support game type:' + this.gameRule.roomType)
        }
        // else if (this.gameRule.kind === enumeration.gameType.FISH) {
        //     // 捕鱼特殊处理，进入时请求机器人，每2分钟检测一次机器人是否需要添加机器人
        //     // 玩家进入后，请求机器人
        //     setTimeout(function () {
        //         if (this.roomDismissed) return
        //         rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, utils.getRandomNum(0, this.gameTypeInfo.maxPlayerCount - 1), function (err) {
        //             if (!!err) {
        //                 logger.error('robotOperationRoomCreated', 'err:' + err)
        //             }
        //         })
        //     }.bind(this), 10)
        //     // 每2分钟检测一次机器人是否需要添加机器人
        //     this.requestRobotInterval = setInterval(function () {
        //         if (this.currentUserCount < this.gameTypeInfo.maxPlayerCount) {
        //             rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, utils.getRandomNum(0, this.gameTypeInfo.maxPlayerCount - this.currentUserCount), function (err) {
        //                 if (!!err) {
        //                     logger.error('robotOperationRoomCreated', 'err:' + err)
        //                 }
        //             })
        //         }
        //     }.bind(this), 2 * 60 * 1000)
        // }
    }

    // 房间解散时，机器人操作
    async robotOperationDismissRoom() {
        // 解散房间后，通知所有机器人离开房间
        const leaveUidArr = []
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if (user.robot) {
                    leaveUidArr.push(user.uid)
                }
            }
        }
        if (leaveUidArr.length > 0) {
            await RpcApi.robotLeaveRoomNotify(this.gameRule.kind, leaveUidArr)
        }
    }

    // 机器人离开房间
    async robotOperationUserLeaved() {
        if (this.gameRule.kind === RoomType.hundred) return
        // 如果该房间没有真人，则剩余机器人离开房间(百人游戏除外)
        const leftUidArr = []
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if (!user.robot) return
                leftUidArr.push(user.uid)
            }
        }
        // 只剩下一个机器人
        if (leftUidArr.length === 1) {
            await this.kickUser(leftUidArr[0])
        }
    }

    // 游戏结算
    async robotOperationConcludeGame() {
        // 判定机器人是否需要离开游戏，当房间中无真人时，所有机器人离开房间
        const leaveUidArr = []
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if (user.robot) {
                    if (this.gameRule.gameRoomStartType === GameRoomStartType.autoStart) {
                        if (!await this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                            continue
                        }
                    }
                    // 每局结束，机器人有百分之30的概率离开游戏
                    if (services.utils.getRandomNum(1, 10) <= 2) {
                        leaveUidArr.push(user.uid)
                    }
                }
            }
        }
        for (let i = 0; i < leaveUidArr.length; ++i) {
            await this.robotOperationExecLeave(leaveUidArr[i])
        }
        await this.robotOperationUserLeaved()
    }

    // 准备开始
    async robotOperationGamePrepare() {
        // 非自动开始游戏，机器人自动准备
        if (this.gameRule.gameRoomStartType === GameRoomStartType.autoStart) return
        for (const key in this.userArr) {
            if (this.userArr[key]) {
                const user = this.userArr[key]
                if (user.robot) {
                    await this.robotOperationExecReady(user.uid)
                }
            }
        }
    }

    // 机器人开始准备
    async robotOperationExecReady(uid: number) {
        setTimeout(async function () {
            if (!this.userArr[uid] || this.roomDismissed || this.gameStarted) return
            if ((this.userArr[uid].userStatus & UserStatus.ready) !== 0) return
            await this.userReady(uid)
        }.bind(this), services.utils.getRandomNum(1000, 2000))
    }

    // 非机器人进入房间
    async robotOperationUserEntry() {
        // 通知机器人服务器
        if (this.gameRule.roomType !== RoomType.hundred) return
        if (this.currentUserCount < 20) {
            await RpcApi.requestRobotNotify(this.roomId, this.gameTypeInfo, 20 - this.currentUserCount)
        }
    }

    async robotOperationExecLeave(uid: number) {
        if (this.gameRule.roomType === RoomType.hundred) {
            await this.kickUser(uid)
        } else {
            setTimeout(async function () {
                if (!this.userArr[uid] || this.roomDismissed) return
                await this.kickUser(uid)
            }.bind(this), services.utils.getRandomNum(2000, 5000))
        }
    }

    // 房间接口
    getCurRobotWinRate() {
        return this.robotWinRate
    }

    // 获取玩家数据
    getUserByChairId(chairId: number) {
        for (const key of Object.keys(this.userArr)) {
            if (this.userArr[key] && this.userArr[key].chairId === chairId) {
                return this.userArr[key]
            }
        }
        return null
    }

    getChairIdByUid(uid: number) {
        const user = this.userArr[uid]
        if (user) {
            return user.chairId
        }
        return -1
    }

    ownUser(uid: number) {
        return this.userArr[uid]
    }

    isShouldDelete(time: number) {
        return (Date.now() - this.lastNativeTime >= time) && (this.gameRule.roomType !== RoomType.hundred)
    }

    async setGameWinRate(uid: number, rate: number) {
        const chairId = this.userArr[uid].chairId
        if (this.gameFrameSink.onSetGameWinRate) {
            await this.gameFrameSink.onSetGameWinRate(chairId, rate)
        }
    }

    // 获取游戏信息
    getGameTypeInfo() {
        return this.gameTypeInfo
    }

    async getCurGameData(chairId: number) {
        if (this.gameFrameSink.getEnterGameData) {
            return {
                roomID: this.roomId,
                gameData: await this.gameFrameSink.getEnterGameData(chairId)
            }
        }
        return null
    }

    getUserArr() {
        return this.userArr
    }

    getGameRule() {
        return this.gameRule
    }

    async writeUserGameResult(dataArr: any) {
        await this.recordGameResult(dataArr)
    }

    async setTakeChip(userInfo: IUserInfo): Promise<boolean> {
        switch (this.gameRule.roomSettlementMethod) {
            case RoomSettlementMethod.gold:
                return await this.setGoldChip(userInfo)
            case RoomSettlementMethod.clubGold:
                return await this.setClubGold(userInfo)
            default:
                console.error('take chip from roomSettlementMethod not supported: ', this.gameRule.roomSettlementMethod)
        }
        return false
    }

    async setGoldChip(userInfo: IUserInfo) {
        const gameTypeInfo = this.getGameTypeInfo()
        const parameter = gameTypeInfo.parameters || {maxTake: 0, blindBetCount: 0, preBetCount: 0}
        const maxTake = parameter.maxTake
        const minTake = gameTypeInfo.goldLowerLimit
        if (userInfo.gold < minTake) {
            if (userInfo.gold > maxTake) {
                userInfo.takeChip = maxTake
            } else {
                userInfo.takeChip = userInfo.gold
            }
            return true
        }
    }

    async setClubGold(userInfo: IUserInfo) {
        // 带上所有金币
        const member = await ClubMember.getClubMember(this.gameRule.clubShortId, userInfo.uid)
        userInfo.takeChip = member.m.clubGold
        return true
    }

    // 检查筹码
    async checkChip(userInfo: IUserInfo) {
        switch (this.gameRule.roomSettlementMethod) {
            case RoomSettlementMethod.gold:
                if (userInfo.gold < this.gameTypeInfo.goldLowerLimit) {
                    // 金币不足
                    return false
                }
                break
            case RoomSettlementMethod.clubGold:
                return false
            // break
            default:
                console.error('take chip from roomSettlementMethod not supported: ', this.gameRule.roomSettlementMethod)
        }
        return true
    }
}
