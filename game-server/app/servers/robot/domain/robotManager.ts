import {IGameTypeInfo, IUserInfo} from '../../../types/interfaceApi'
import {Application, pinus} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {dispatch} from '../../../util/dispatcher'
import services from '../../../services'
import {RpcApi} from '../../../api/rpc'
import {ControllerManager} from './controllerManager'
import {UserStatus} from '../../../constants/game'

// 机器人管理
export class RobotManager {
    curRobotCountList: object
    phoneTitleArr: string[]
    robotUidList: object
    // 机器人匹配定时器
    scheduleTaskRobotMatchId: number

    constructor() {

    }

    init(): void {
        this.curRobotCountList = {}
        this.phoneTitleArr = ['134', '135', '136', '137', '138', '139', '150', '151', '157', '158', '159', '152', '136', '151', '156', '185', '181', '170', '186', '187', '188', '130', '131', '132', '155', '156', '189']
        this.robotUidList = {}
    }

    async afterStartAll() {
        this.init()
        // this.loadRobot()
    }

    async beforeShutdown() {
        console.log('robotManager beforeShutdown')
    }

    // 没东西 load
    // loadRobot(): void {
    //     this.scheduleTaskRobotMatchId = scheduleJob({
    //         start: Date.now() + config.game.robotMatchGameInterval,
    //         period: config.game.robotMatchGameInterval,
    //     }, this.scheduleTaskRobotMatch.bind(this))
    // }

    // createRoom
    async createRoom(userInfo: IUserInfo, gameTypeInfo: IGameTypeInfo, gameRule: any) {
        const gameServer = dispatch(services.utils.getRandomNum(0, pinus.app.getServersByType('game').length - 1).toString(),
            pinus.app.getServersByType('game'))
        await RpcApi.createRoom(gameServer.id, userInfo, '', gameRule, gameTypeInfo)
        this.robotUidList[userInfo.uid] = true
        if (this.curRobotCountList[gameTypeInfo.kind]) {
            this.curRobotCountList[gameTypeInfo.kind] = this.curRobotCountList[gameTypeInfo.kind] + 1
        } else {
            this.curRobotCountList[gameTypeInfo.kind] = 1
        }
    }

    async joinRoom(userInfo: IUserInfo, roomID: string, gameTypeInfo: IGameTypeInfo) {
        const gameServers = pinus.app.getServersByType('game')
        const server = dispatch(roomID, gameServers)
        const isOk = await RpcApi.joinRoom(server.id, userInfo, '', roomID, 0)
        if (!isOk) {
            return false
        }
        this.robotUidList[userInfo.uid] = true
        if (this.curRobotCountList[gameTypeInfo.kind]) {
            this.curRobotCountList[gameTypeInfo.kind] = this.curRobotCountList[gameTypeInfo.kind] + 1
        } else {
            this.curRobotCountList[gameTypeInfo.kind] = 1
        }
        return true
    }

    async matchRoom(userInfo: IUserInfo, roomArr: any[], gameTypeInfo: IGameTypeInfo) {
        // 判断进入条件
        if (userInfo.gold < gameTypeInfo.goldLowerLimit) {
            return false
        }

        if (roomArr.length === 0) {
            await this.createRoom(userInfo, gameTypeInfo, null)
        } else {
            const index = services.utils.getRandomNum(0, roomArr.length - 1)
            const isOk = await this.joinRoom(userInfo, roomArr[index], gameTypeInfo)
            if (!isOk) {
                roomArr.splice(index, 1)
                return this.matchRoom(userInfo, roomArr, gameTypeInfo)
            }
            return true
        }
    }

    async startRoom(gameTypeInfo: IGameTypeInfo) {
        const roomArr = []
        // 查询可加入房间列表
        const servers = pinus.app.getServersByType('game')
        for (const gameServer of servers) {
            const list = await RpcApi.getMatchRoomList(gameServer.id, gameTypeInfo.gameTypeID)
            if (list.length > 0) {
                roomArr.concat(list)
            }
        }
        const robotInfo = this.getIdleRobot(gameTypeInfo)
        if (!robotInfo) {
            return
        }
        await this.matchRoom(this.getIdleRobot(gameTypeInfo), roomArr, gameTypeInfo)
    }

    async requestRobotNotify(roomID, gameTypeInfo: IGameTypeInfo, count) {
        const controllerManager = pinus.app.get(GlobalEnum.robotControllerMangerKey) as ControllerManager
        const gameControlData = controllerManager.getGameControllerData(gameTypeInfo.kind)
        if (!gameControlData || !gameControlData.robotMatchEnable) {
            return
        }
        for (let i = 0; i < count; i++) {
            const robotInfo = this.getIdleRobot(gameTypeInfo)
            if (!robotInfo) {
                // 没有机器人了
                console.error('no enough idle robot requestRobotNotify')
                return
            } else {
                await this.joinRoom(robotInfo, roomID, gameTypeInfo)
            }
        }
    }

    async robotLeaveRoomNotify(kind: number, uidArr: number[]) {
        if (!uidArr) return
        for (let i = 0; i < uidArr.length; ++i) {
            delete this.robotUidList[uidArr[i]]

            this.curRobotCountList[kind]--
        }
        console.debug('robotLeaveRoomNotify', 'curRobotCount:' + this.curRobotCountList[kind])
    }

    getIdleRobot(gameTypeInfo: IGameTypeInfo) {
        const controllerManager = pinus.app.get(GlobalEnum.robotControllerMangerKey) as ControllerManager
        const gameControlData = controllerManager.getGameControllerData(gameTypeInfo.kind)
        // 匹配制房间不受机器人数量限制
        if (!gameTypeInfo.matchRoom) {
            if (!gameControlData || gameControlData.maxRobotCount <= this.curRobotCountList[gameTypeInfo.kind]) return null
        }
        const userInfo = this.newIdleRobot()
        if (gameTypeInfo.goldLowerLimit <= 0) {
            userInfo.gold = services.utils.getRandomNum(10000, 10000000) / 100
        } else {
            const temp = gameTypeInfo.goldLowerLimit > 100 ? gameTypeInfo.goldLowerLimit * 100 : 10000
            userInfo.gold = (temp + services.utils.getRandomNum(temp, temp * 4)) / 100
        }
        return userInfo
    }

    // 新机器人
    newIdleRobot() {
        let uid: string = ''
        do {
            uid = (10000 + services.utils.getRandomNum(0, 9999)).toString()
        } while (this.robotUidList[uid])
        const userInfo: IUserInfo = {
            chairId: 0,
            diamond: 0,
            frontendId: '',
            spreadId: '',
            takeChip: 0,
            userStatus: UserStatus.none,
            uid: Number(uid),
            nickname: this.phoneTitleArr[services.utils.getRandomNum(0, this.phoneTitleArr.length - 1)] + services.utils.getRandomNum(10000000, 99999999),
            avatar: 'UserInfo/head_' + services.utils.getRandomNum(0, 15),
            robot: true,
            gold: 0,
            clubGold: 0,
        }
        return userInfo
    }
}

export async function initRobotManager(app: Application) {
    const mgr = new RobotManager()
    app.set(GlobalEnum.robotMangerKey, mgr)
}
