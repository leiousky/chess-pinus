import {Application, cancelJob, scheduleJob} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {RoomDismissReason} from '../../../constants/roomProto'
import {BaseRoomFrame} from './base/roomFrame'
import services from '../../../services'
import {GameType, RoomType} from '../../../constants/game'
import {DZRoomFrame} from './dezhouPoker/roomFrame'
import errorCode from '../../../constants/errorCode'
import config = require('../../../../config')
import {IGameRule, IGameTypeInfo, IUserInfo} from '../../../types/interfaceApi'
import {IClubRoomInfo} from '../../../types/hall/club'
import {PushApi} from "../../../api/push";

// 房间管理器
export class RoomManager {
    app: Application
    // 所有房间
    roomList: { [key: string]: BaseRoomFrame }
    scheduleJobId: number

    constructor(app: Application) {
        this.app = app
    }

    async init() {
        this.scheduleJobId = -1
        this.roomList = {}
        this.startScheduler()
    }

    async scheduleTask(data: { manager: RoomManager }) {
        const self = data.manager
        const timeNow = new Date().toLocaleString()
        console.log(self.app.getServerId(), 'room manager schedule task', timeNow)
        // 输出现有房间的数量
        let count = 0
        const keys = Object.keys(self.roomList)
        for (const k of keys) {
            const room = self.roomList[k]
            if (room.isShouldDelete(config.game.timeToDissolveIdleRoom)) {
                // 删除房间
                await room.destroyRoom(RoomDismissReason.maxTime)
                delete self.roomList[k]
                console.log('delete room id: ' + k)
            } else {
                count++
            }
        }
        console.log('room count', count)
    }

    startScheduler() {
        this.scheduleJobId = scheduleJob({period: config.game.timeToDissolveIdleRoom}, this.scheduleTask, {manager: this})
    }

    stopScheduler() {
        cancelJob(this.scheduleJobId)
    }

    beforeShutdown() {
        this.stopScheduler()
    }

    // 创建房间
    async createRoom(userInfo: IUserInfo, frontendId: string, gameRule: IGameRule, gameTypeInfo: IGameTypeInfo) {
        const roomId = this.createNewRoomId()
        let roomFrame: BaseRoomFrame
        if (gameTypeInfo.kind == GameType.DZ) {
            roomFrame = new DZRoomFrame(roomId.toString(), userInfo.uid, gameRule, gameTypeInfo)
            await roomFrame.init()
        } else {
            console.error('game type not supported')
            return
        }
        this.roomList[roomId] = roomFrame
        await roomFrame.userEntryRoom(userInfo, frontendId)
        const roomInfo = this.getClubRoom(roomFrame.gameRule.clubShortId)
        // 推送新房间
        await PushApi.newClubRoom(userInfo.uid, userInfo.frontendId, roomFrame.gameRule.clubShortId, roomInfo)
    }

    async createMatchRoom(userInfoArr: IUserInfo[], gameRule: IGameRule, gameTypeInfo: IGameTypeInfo) {
        const roomId = this.createNewRoomId()
        let roomFrame: BaseRoomFrame
        if (gameTypeInfo.kind == GameType.DZ) {
            // 添加默认 rule
            roomFrame = new DZRoomFrame(roomId.toString(), userInfoArr[0].uid, gameRule, gameTypeInfo)
            await roomFrame.init()
        } else {
            console.error('game type not supported')
            return
        }
        this.roomList[roomId] = roomFrame
        for (let i = 0; i < userInfoArr.length; ++i) {
            await roomFrame.userEntryRoom(userInfoArr[i], userInfoArr[i].frontendId)
        }
        return roomId
    }

    async joinRoom(userInfo: IUserInfo, frontendId: string, roomId: string, clubShortId: number) {
        const roomFrame = this.roomList[roomId]
        if (roomFrame) {
            const isOk = await roomFrame.canEnterRoom(userInfo, clubShortId)
            if (!isOk) {
                return errorCode.roomFull
            } else {
                return roomFrame.userEntryRoom(userInfo, frontendId)
            }
        } else {
            return errorCode.roomNotExist
        }
    }

    // 解散房间
    async dismissRoom(roomId: string) {
        const roomFrame = this.roomList[roomId]
        if (roomFrame) {
            delete this.roomList[roomId]
        }
    }

    async leaveRoom(roomId: string, uid: number) {
        const roomFrame = this.roomList[roomId]
        if (roomFrame) {
            await roomFrame.userOffline(uid)
            return true
        }
        return false
    }

    async onUserOffline(uid: number, roomId: string) {
        const roomFrame = this.roomList[roomId]
        if (!roomFrame) {
            return false
        } else {
            await roomFrame.userOffline(uid)
            return true
        }
    }

    getRoomFrameByID(roomId: string) {
        return this.roomList[roomId] || null
    }

    // 查找俱乐部房间
    getClubRoom(clubShortId: number): IClubRoomInfo[] {
        const list: IClubRoomInfo[] = []
        for (const room of Object.values(this.roomList)) {
            if (room.gameRule.roomType == RoomType.club && room.gameRule.clubShortId == clubShortId) {
                // 用户 uid
                const playerList = []
                Object.values(room.userArr).forEach(value => {
                    if (value) {
                        playerList.push(value.uid)
                    }
                })
                list.push({
                    playerList: playerList,
                    rule: services.apiConvert.toClubRuleInfo(room.gameRule, room.gameTypeInfo, room.roomId)
                })
            }
        }
        return list
    }

    async isUserInRoom(uid: number, roomId: string) {
        const room = this.roomList[roomId]
        return room && room.ownUser(uid)
    }

    async searchRoomByUid(uid: number) {
        for (const key in this.roomList) {
            if (this.roomList[key]) {
                const room = this.roomList[key]
                if (room.ownUser(uid)) {
                    return room.roomId
                }
            }
        }
        return ''
    }

    async getRoomGameDataByKind(kind: string) {
        const gameDataArr = []
        // for (const key in this.roomList) {
        //     if (this.roomList[key]) {
        //         const room = this.roomList[key]
        //         if (room.getGameTypeInfo().gameTypeInfo.kind === kind) {
        //             gameDataArr.push(room.getCurGameData(0))
        //         }
        //     }
        // }
        console.log('no chairId to call getRoomGameDataByKind')
        return gameDataArr
    }

    async getRoomGameDataByRoomID(roomId: string) {
        // for (const key in this.roomList) {
        //     if (this.roomList[key]) {
        //         const room = this.roomList[key]
        //         if (room.roomId === roomId) {
        //             return await room.getCurGameData()
        //         }
        //     }
        // }
        console.log('no chairId to call getRoomGameDataByRoomID')
        return null
    }

    getMatchRoomList(gameTypeId: string) {
        const roomArr = []
        for (const key in this.roomList) {
            if (this.roomList[key]) {
                const room = this.roomList[key]
                if (!room.hasEmptyChair()) continue
                if (room.gameRule.roomType !== RoomType.private && room.gameTypeInfo.gameTypeID === gameTypeId) {
                    roomArr.push(key)
                }
            }
        }
        return roomArr
    }

    createNewRoomId() {
        const gameServers = this.app.getServersByType('game')
        let curServerIndex = 0
        for (let i = 0; i < gameServers.length; ++i) {
            if (gameServers[i].id === this.app.curServer.id) {
                curServerIndex = i
                break
            }
        }
        let roomID = -1
        const min = Math.floor(100000 / gameServers.length) + 1
        const max = Math.floor(1000000 / gameServers.length) - 1
        while (!!this.roomList[roomID] || roomID == -1) {
            roomID = services.utils.getRandomNum(min, max) * gameServers.length + curServerIndex
        }
        return roomID
    }
}

// 初始化
export async function initRoomManager(app: Application) {
    const mgr = new RoomManager(app)
    await mgr.init()
    app.set(GlobalEnum.roomManagerKey, mgr)
    console.log('============= set roomMangerKey')
}
