import {Application, cancelJob, pinus, scheduleJob} from 'pinus'
import services from '../../../services'
import {IUserModel, userModel} from '../../../dao/models/user'
import {UserStatus} from '../../../constants/game'
import {IGameTypeInfo, IUserInfo} from '../../../types/interfaceApi'
import {dispatch} from '../../../util/dispatcher'
import {RpcApi} from '../../../api/rpc'
import {HydratedDocument} from 'mongoose'
import errorCode from '../../../constants/errorCode'
import config = require('../../../../config')
import {GlobalEnum} from '../../../constants/global'

export class MatchManager {
    matchUserLists: { [key: string]: number[] }
    matchTaskScheduler: number
    isMatching: boolean

    async init() {
        this.matchUserLists = {}
        this.isMatching = false
        this.matchTaskScheduler = scheduleJob({
            start: Date.now() + config.game.matchGameIntervalTime,
            period: config.game.matchGameIntervalTime,
        }, this.matchUserTask.bind(this))
    }

    async beforeShutdown() {
        cancelJob(this.matchTaskScheduler)
    }

    async matchUserTask() {
        if (this.isMatching) {
            return
        }
        console.info('matchUserTask')
        this.isMatching = true
        for (const key in this.matchUserLists) {
            const matchUserList = this.matchUserLists[key]
            const gameTypeInfo = services.parameter.getGameTypeInfoById(key)
            if (!gameTypeInfo) {
                // 如果游戏类型不存在，则直接删除匹配列表
                delete this.matchUserLists
            } else {
                await this.execMatch(matchUserList, gameTypeInfo)
            }
        }
        this.isMatching = false
    }

    async execMatch(matchUserList: number[], gameTypeInfo: IGameTypeInfo) {
        if (!matchUserList || matchUserList.length === 0) {
            return
        }
        const maxUserCount = gameTypeInfo.maxPlayerCount - gameTypeInfo.minRobotCount
        const minUserCount = gameTypeInfo.minPlayerCount - gameTypeInfo.maxRobotCount
        // 匹配队列中的玩家不够组成一个房间
        if (minUserCount > matchUserList.length) {
            console.warn('execMatch', 'not enough user gameTypeID=' + gameTypeInfo.gameTypeID)
            return
        }
        while (minUserCount <= matchUserList.length && matchUserList.length > 0) {
            if (maxUserCount >= matchUserList.length) {
                await this.createMatchRoomByTimer(gameTypeInfo, matchUserList)
                // 清除列表
                matchUserList.splice(0, matchUserList.length)
            } else {
                const list = matchUserList.slice(0, maxUserCount)
                await this.createMatchRoomByTimer(gameTypeInfo, list)
                // 移除已匹配的用户
                matchUserList.splice(0, maxUserCount)
            }
        }
    }

    async createMatchRoomByTimer(gameTypeInfo: IGameTypeInfo, uidArr: number[]) {
        const roomUserInfoArr: IUserInfo[] = []
        // 获取用户信息
        const records = await userModel.find({uid: {$in: uidArr}})
        for (let i = 0; i < records.length; ++i) {
            // 检查用户是否满足进入房间的条件，如果不满足，不加入到列表中
            const userData = records[i]
            if (userData.gold < gameTypeInfo.goldLowerLimit) continue
            if (!userData.frontendId) continue
            roomUserInfoArr.push(services.user.buildGameRoomUserInfo(records[i], -1, UserStatus.none, 0))
        }
        // 创建房间
        const gameServer = dispatch(services.utils.getRandomNum(0, pinus.app.getServersByType('game').length - 1).toString(), pinus.app.getServersByType('game'))
        await RpcApi.createMatchRoom(gameServer.id, roomUserInfoArr, gameTypeInfo)
    }

    // 加入匹配队列
    async entryMatchList(uid: number, gameTypeId: string) {
        console.info('entryMatchList uid=' + uid + ', gameTypeID=' + gameTypeId)
        // 检查用户是否在匹配列表中，则不能重复匹配
        for (const key in this.matchUserLists) {
            if (this.matchUserLists[key]) {
                const list = this.matchUserLists[key]
                if (list.indexOf(uid) !== -1) {
                    console.error('already in match list')
                    return false
                }
            }
        }
        // 添加到匹配队列中
        let matchUserList = this.matchUserLists[gameTypeId]
        // 队列不存在则创建新的队列
        if (!matchUserList) {
            this.matchUserLists[gameTypeId] = []
            matchUserList = this.matchUserLists[gameTypeId]
        }
        matchUserList.push(uid)
        console.info('entryMatchList', 'success')
        return true
    }

    // 退出匹配队列
    async exitMatchList(uid: number) {
        console.info('exitMatchList', uid)
        // 查询所有列表，并移除
        for (const key in this.matchUserLists) {
            if (this.matchUserLists[key]) {
                const list = this.matchUserLists[key]
                const index = list.indexOf(uid)
                if (index !== -1) {
                    list.splice(index, 1)
                    console.info('exitMatchList success')
                }
            }
        }
    }

    async matchRoom(userData: HydratedDocument<IUserModel>, roomArr: string[], gameTypeInfo: IGameTypeInfo) {
        // 判断进入条件
        if (userData.gold < gameTypeInfo.goldLowerLimit) {
            return errorCode.leaveRoomGoldNotEnoughLimit
        }

        if (roomArr.length === 0) {
            return this.createRoom(userData, gameTypeInfo, null)
        } else {
            const index = services.utils.getRandomNum(0, roomArr.length - 1)
            const resp = await this.joinRoom(userData, roomArr[index])
            if (!resp) {
                // 加入房间失败
                console.error('matchRoom', 'joinRoom err:' + resp)
                roomArr.splice(index, 1)
                return this.matchRoom(userData, roomArr, gameTypeInfo)
            }
            // 返回房间号
            return resp
        }
    }

    async createRoom(userData: HydratedDocument<IUserModel>, gameTypeInfo: IGameTypeInfo, gameRule: any) {
        const gameServer = dispatch(services.utils.getRandomNum(0, pinus.app.getServersByType('game').length - 1).toString(), pinus.app.getServersByType('game'))
        return RpcApi.createRoom(gameServer.id, services.user.buildGameRoomUserInfo(userData, -1, UserStatus.none, 0), userData.frontendId, gameRule, gameTypeInfo)
    }

    async joinRoom(userData: HydratedDocument<IUserModel>, roomId: string) {
        const gameServers = pinus.app.getServersByType('game')
        const server = dispatch(roomId, gameServers)
        return RpcApi.joinRoom(server.id, services.user.buildGameRoomUserInfo(userData, -1, UserStatus.none, 0), userData.frontendId, roomId, 0)
    }

    async startMatch(userData: HydratedDocument<IUserModel>, gameTypeId: string) {
        const gameTypeInfo = services.parameter.getGameTypeInfoById(gameTypeId)
        if (!gameTypeInfo) {
            return errorCode.invalidRequest
        }
        let roomArr = []
        // 查询可加入房间列表
        const servers = pinus.app.getServersByType('game')
        for (const server of servers) {
            const resp = await RpcApi.getMatchRoomList(server.id, gameTypeInfo.gameTypeID)
            if (resp.length > 0) {
                roomArr = roomArr.concat(resp)
            }
        }
        // let roomID = null
        return this.matchRoom(userData, roomArr, gameTypeInfo)
    }
}

export async function initMatchManager(app: Application) {
    const mgr = new MatchManager()
    app.set(GlobalEnum.matchManagerKey, mgr)
}
