import {HydratedDocument} from 'mongoose'
import {IArenaModel} from '../../../dao/models/arena'
import services from '../../../services'
import {newArenaPlayer} from './player'
import {GameRoomStartType, GameType, RoomSettlementMethod, UserStatus} from '../../../constants/game'
import {IArenaRule, IUserInfo} from '../../../types/interfaceApi'
import {ArenaTable, newArenaTable} from './table'
import {userModel} from '../../../dao/models/user'
import {dispatch} from '../../../util/dispatcher'
import {pinus} from 'pinus'
import {RpcApi} from '../../../api/rpc'
import {PushApi} from '../../../api/push'

// 每场竞技场
export class ArenaTask {
    // arena 表
    m: HydratedDocument<IArenaModel>
    // 本场的所有桌子 table
    allTable: { [key: string]: ArenaTable } = {}
    // arenaPlayer 表
    allPlayers = {}
    // 机器人信息
    robotList: { [key: string]: IUserInfo } = {}

    // 下一次添加机器人的时间
    nextAddRobotTime: number

    constructor(doc: HydratedDocument<IArenaModel>) {
        this.m = doc
        this.robotList = {}
        this.updateNextAddRobotTime()
    }

    updateNextAddRobotTime() {
        // 3-5秒内加一个机器人
        this.nextAddRobotTime = Date.now() + services.utils.getRandomNum(3, 10)
    }

    // 加入竞技场
    joinPlayer(uid: number) {
        const index = this.m.joinPlayers.indexOf(uid)
        if (index === -1) {
            this.m.joinPlayers.push(uid)
        }
        if (this.robotList[uid]) {
            // 机器人
            const index = this.m.joinPlayers.indexOf(uid)
            if (index == -1) {
                this.m.robotList.push(uid)
            }
        }
    }

    // 是否允许加入
    isFull() {
        return this.m.joinPlayers.length >= this.m.maxPeople
    }

    // 是否可以开始
    isCanStart() {
        if (this.m.joinPlayers.length === this.m.maxPeople) {
            // 满了, 开赛
            return true
        }
        // 检查人数
        if (this.m.joinPlayers.length < this.m.minPeople) {
            // 人数不够
            return false
        }
        // 检查时间是否到
        const startAt = services.time.fromDate(this.m.startAt)
        return startAt <= services.time.now()
    }

    // 是否已过报名时间
    isExpired() {
        const startAt = services.time.fromDate(this.m.startAt)
        return startAt < services.time.now()
    }

    // 是否处理中
    isRunning() {
        return this.m.isRunning
    }

    // 是否结束
    isFinish() {
        return this.m.isFinish
    }

    // 是否开始
    isStart() {
        return this.m.currentRound > 0
    }

    // 玩家是否加入
    isPlayerJoin(uid) {
        return this.m.joinPlayers.indexOf(uid) !== -1
    }

    // 玩家退出
    playerExit(uid) {
        const index = this.m.joinPlayers.indexOf(uid)
        if (index !== -1) {
            this.m.joinPlayers.splice(index, 1)
        }
    }

    // 处理中
    setRunning() {
        this.m.isRunning = true
    }

    setFinish() {
        this.m.isFinish = true
    }

    // 开始下一场
    async nextRound() {
        if (this.m.currentRound >= this.m.maxRound) {
            // 结束了
            this.m.isFinish = true
            // TODO save
            // await this.save()
            return
        }
        if (this.m.currentRound === 0) {
            // 第一局
            this.m.currentRound++
            await this.firstRound()
        } else {
            // TODO 查找每轮结束，前几名的用户
            // 默认前3名
            const minRank = this.m.rankRound[this.m.currentRound] || 3
            // 最低分数
            const minScore = this.m.minRoundScore[this.m.currentRound] || 0
            const playerIdList = Object.keys(this.allPlayers)
            playerIdList.sort((a, b) => {
                return this.allPlayers[b].score() - this.allPlayers[a].score()
            })
            // 选择过线的玩家
            const remainList = []
            // 淘汰的玩家
            const failList = []
            playerIdList.forEach(uid => {
                if (this.allPlayers[uid].score() >= minScore) {
                    remainList.push(Number(uid))
                } else {
                    failList.push(Number(uid))
                }
            })
            // const remainList = playerIdList.filter(uid => {
            //     return this.allPlayers[uid].score() >= minScore
            // })
            // 转为 number
            // this.m.nextRoundPlayers = remainList.slice(0, minRank).map((value) => {
            //     return Number(value)
            // })
            this.m.nextRoundPlayers = remainList.slice(0, minRank)
            // 淘汰的玩家
            failList.push(...remainList.slice(minRank))
            this.m.currentRound++
            // 通知晋级的玩家
            let uidFrontList = await services.user.getFrontIdByUidList(this.m.nextRoundPlayers)
            await PushApi.nextArenaRound({arenaId: this.m.id}, uidFrontList)
            // 通知淘汰的玩家
            if (failList.length > 0) {
                uidFrontList = await services.user.getFrontIdByUidList(failList)
                await PushApi.arenaRoundFail(uidFrontList)
            }
            await this.playerNextRound()
        }
        // TODO save
    }

    async save() {
        await this.m.save()
    }

    // 返回客户端
    toClient() {
        return {
            id: this.m.id,
            title: this.m.title,
            arenaCoinRequired: this.m.arenaCoinRequired,
            arenaPoint: this.m.arenaPoint,
            minPeople: this.m.minPeople,
            maxPeople: this.m.maxPeople,
            startAt: this.m.startAt,
            maxRound: this.m.maxRound,
            isFinish: this.m.isFinish,
            isRunning: this.m.isRunning,
            // 第几轮
            currentRound: this.m.currentRound,
            // 已经报名的玩家
            players: this.m.joinPlayers,
            // 系列名
            seriesName: this.m.seriesName,
        }
    }

    // 第一局
    async firstRound() {
        // 分别创建所有player
        for (const uid of this.m.joinPlayers) {
            this.allPlayers[uid] = await newArenaPlayer(this.m.id, uid)
        }
        // 分桌
        const tables = divideTable(this.m.joinPlayers.length)
        const players = services.utils.shuffleArray(this.m.joinPlayers.slice())
        await this.newArenaTableList(this.getRule(), players, tables)
    }

    async playerNextRound() {
        // 分别创建所有player
        const tables = divideTable(this.m.nextRoundPlayers.length)
        if (tables.length <= 0) {
            console.error('no players to play next round')
            return
        }
        const players = services.utils.shuffleArray(this.m.nextRoundPlayers.slice())
        await this.newArenaTableList(this.getRule(), players, tables)
    }

    // 所有桌子列表
    async newArenaTableList(gameRule: IArenaRule, players: any[], divideList: any[]) {
        // 新建 table
        const newTables = []
        // 通知建房
        const roomTasks = []
        let index = 0
        let playerCount = 0
        for (let i = 0; i < divideList.length; i++) {
            this.m.tableIdCount++
            playerCount = divideList[i]
            // 同桌人数
            const tablePlayers = players.slice(index, index + playerCount)
            const result = await newArenaTable(this.m._id, this.m.tableIdCount, this.m.currentRound)
            this.allTable[result.m.tableId] = result
            console.debug('=====  divide table', tablePlayers)
            const tableId = result.m.tableId
            const roomId = await this.createArenaRoom(gameRule, tablePlayers)
            // 更新 roomId
            this.allTable[tableId].setRoomId(roomId)
            this.allTable[tableId].setPlayers(tablePlayers)
            this.allTable[tableId].setGameRule(gameRule)
            // TODO save
            // await this.allTable[tableId].save()
            index += playerCount
        }
        return {newTables, roomTasks}
    }

    async addRoomRound(roomId: number) {
        await this.eachTable(async (tableTask) => {
            if (tableTask.m.roomId == roomId) {
                tableTask.addRoomRound()
                // TODO 保存
                // await tableTask.save()
                return false
            }
            return true
        })
    }

    async isAllTableFinish() {
        let isFinish = true
        await this.eachTable(async (tableTask) => {
            if (tableTask.getArenaRound() === this.m.currentRound) {
                const isTableFinish = tableTask.isFinish()
                if (!isTableFinish) {
                    isFinish = false
                    return false
                }
            }
            return true
        })
        return isFinish
    }

    // 更新积分
    updatePlayerScore(list: { uid: number, score: number }[]) {
        for (const result of list) {
            const uid = result.uid
            const score = result.score
            if (this.allPlayers[uid]) {
                this.allPlayers[uid].addScore(score)
                this.allPlayers[uid].save()
            }
        }
    }

    async eachTable(cb: (tableTask: ArenaTable) => Promise<boolean>) {
        const keys = Object.keys(this.allTable)
        for (const k of keys) {
            const isOk = await cb(this.allTable[k])
            if (!isOk) {
                // 结束，不用再遍历了
                break
            }
        }
    }

    async saveTable(roomId: any) {
        await this.eachTable(async (tableTask: ArenaTable) => {
            if (tableTask.m.roomId === roomId) {
                await tableTask.save()
                return false
            }
            return true
        })
    }

    // 房间规则
    getRule(): IArenaRule {
        return {
            gameRoomStartType: GameRoomStartType.allReady,
            // 积分模式
            roomSettlementMethod: RoomSettlementMethod.score,
            // 房间类型
            kind: GameType.DZ,
            // TODO 默认16局
            maxDrawCount: 2,
            maxPlayerCount: 9,
            minPlayerCount: 2,
            parameters: {blindBetCount: 10, preBetCount: 10, maxTake: 400},
            // 竞技场 id
            arenaId: this.m.id
        }
    }

    async addRobot() {
        if (!this.m.isNeedRobot) {
            // 不需要机器人
            return
        }
        if (this.isFull()) {
            // 人数满了
            return
        }
        if (this.m.joinPlayers.length == 0) {
            // 还没有真人加入
            return
        }
        if (this.nextAddRobotTime > Date.now()) {
            // 加机器人的时间还没到
            return
        }
        console.log('======== add robot for arena')
        const robotInfo = await RpcApi.getIdleRobot()
        this.robotList[robotInfo.uid] = robotInfo
        this.joinPlayer(robotInfo.uid)
        // 更新下一次加机器人的时间
        this.updateNextAddRobotTime()
    }


    // 竞技场房间
    async createArenaRoom(gameRule: IArenaRule, uidArr: number[]): Promise<number> {
        const roomUserInfoArr: IUserInfo[] = []
        // 将上一个函数的结果，传到下一函数
        const userList = await userModel.find({uid: {$in: uidArr}})
        for (let i = 0; i < userList.length; ++i) {
            // TODO 检查用户是否满足进入房间的条件，如果不满足，不加入到列表中
            const userData = userList[i]
            // if (userData.gold < gameTypeInfo.goldLowerLimit) continue
            if (!userData.frontendId) {
                console.error(`user ${userList[i].uid} login userData`)
                continue
            }
            roomUserInfoArr.push(services.user.buildGameRoomUserInfo(userList[i], -1, UserStatus.none))
        }
        // 添加机器人
        for (const uid of Object.keys(this.robotList)) {
            if (uidArr.indexOf(Number(uid)) == -1) {
                // 机器人被淘汰了
                continue
            }
            roomUserInfoArr.push(this.robotList[uid])
        }
        if (roomUserInfoArr.length == 0) {
            console.error('no user entry room')
            return -1
        }
        // 创建房间
        const gameServer = dispatch(services.utils.getRandomNum(0, pinus.app.getServersByType('game').length - 1).toString(), pinus.app.getServersByType('game'))
        return await RpcApi.createArenaRoom(gameServer.id, roomUserInfoArr, gameRule)
    }

}


function divideTable(count: number) {
    if (!count || isNaN(count)) {
        // 非数字
        console.error(`invalid count ${count} to divide`)
        return []
    }
    let tableCount = 0
    let seat = 0
    // 一张桌子最多9人
    let minSeat = 9
    const list = []
    if (count <= 9) {
        // 一桌就够
        list.push(count)
        return list
    }
    let remain = -1
    for (let i = 9; i > 1; i--) {
        const n = Math.ceil(count / i)
        remain = count % i
        if (remain === 0 && i > 6) {
            // 刚好整除, 每张桌子最小需要6人
            tableCount = n
            seat = i
            minSeat = i
            break
        } else {
            // 没整除，取每张桌子座位数最多的
            if (remain < minSeat && i > seat) {
                tableCount = n
                seat = i
                minSeat = remain
            }
        }
    }
    // 先按最小的座位数排
    for (let i = 0; i < tableCount; i++) {
        count -= minSeat
        list.push(minSeat)
    }
    if (count === 0) {
        return list
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
        for (let i = 0; i < tableCount; i++) {
            // 每张桌子加依次加人
            list[i]++
            count--
            if (count === 0) {
                return list
            }
        }
    }
}
