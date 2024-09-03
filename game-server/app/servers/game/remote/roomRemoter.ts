import {Application} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {RoomManager} from '../domain/roomManager'
import errorCode from '../../../constants/errorCode'
import {IArenaRule, IGameRule, IGameTypeInfo, IPrivateRule, IUserInfo} from '../../../types/interfaceApi'
import {RoomType} from '../../../constants/game'
import {IClubRoomInfo} from '../../../types/hall/club'
import {IClubRule} from "../../../dao/models/clubRule";

export default function (app: Application) {
    return new RoomRemoter(app)
}

export class RoomRemoter {
    // mgr: RoomManager

    constructor(private app: Application) {
        console.log('initializing roomManagerKey roomRemoter')
        // this.mgr = app.get(GlobalEnum.roomManagerKey)
    }

    get mgr(): RoomManager {
        return this.app.get(GlobalEnum.roomManagerKey)
    }

    // 解散房间
    async dismissRoom(roomId: string) {
        await this.mgr.dismissRoom(roomId)
    }

    // 查找房号
    async searchRoomByUid(uid: number) {
        return this.mgr.searchRoomByUid(uid)
    }

    // match room
    async createMatchRoom(userInfoArr: any, gameTypeInfo: IGameTypeInfo) {
        return this.mgr.createMatchRoom(userInfoArr, null, gameTypeInfo)
    }

    // 创建房间
    async createRoom(userInfo: IUserInfo, frontendId: string, gameRule: IGameRule, gameTypeInfo: IGameTypeInfo) {
        return this.mgr.createRoom(userInfo, frontendId, gameRule, gameTypeInfo)
    }

    // 创建好友房
    async createPrivateRoom(userInfo: IUserInfo, frontendId: string, privateRule: IPrivateRule) {
        const gameRule: IGameRule = {
            arenaId: '',
            diamondCost: privateRule.diamondCost,
            gameRoomStartType: privateRule.gameRoomStartType,
            goldCost: 0,
            isOwnerPay: privateRule.isOwnerPay,
            roomSettlementMethod: privateRule.roomSettlementMethod,
            roomType: RoomType.private,
            clubShortId: 0,
        }

        const gameTypeInfo: IGameTypeInfo = {
            roomType: RoomType.private,
            baseScore: 0,
            expenses: 0,
            gameTypeID: 'privateRoom',
            goldLowerLimit: 0,
            goldUpper: 0,
            hundred: 0,
            kind: privateRule.kind,
            level: 0,
            matchRoom: 0,
            maxDrawCount: privateRule.maxDrawCount,
            maxPlayerCount: privateRule.maxPlayerCount,
            maxRobotCount: 0,
            minPlayerCount: privateRule.minPlayerCount,
            minRobotCount: 0,
            parameters: privateRule.parameters
        }
        return this.mgr.createRoom(userInfo, frontendId, gameRule, gameTypeInfo)
    }

    // 创建竞技场房间
    async createArenaRoom(userInfoArr: IUserInfo[], arenaRule: IArenaRule) {
        const gameRule: IGameRule = {
            arenaId: arenaRule.arenaId,
            diamondCost: 0,
            gameRoomStartType: arenaRule.gameRoomStartType,
            goldCost: 0,
            isOwnerPay: false,
            roomSettlementMethod: arenaRule.roomSettlementMethod,
            roomType: RoomType.arena,
            clubShortId: 0,
        }

        const gameTypeInfo: IGameTypeInfo = {
            baseScore: 0,
            roomType: RoomType.arena,
            expenses: 0,
            gameTypeID: 'arenaRoom',
            goldLowerLimit: 0,
            goldUpper: 0,
            hundred: 0,
            kind: arenaRule.kind,
            level: 0,
            matchRoom: 0,
            maxDrawCount: arenaRule.maxDrawCount,
            maxPlayerCount: arenaRule.maxPlayerCount,
            maxRobotCount: 0,
            minPlayerCount: arenaRule.minPlayerCount,
            minRobotCount: 0,
            parameters: arenaRule.parameters
        }
        return this.mgr.createMatchRoom(userInfoArr, gameRule, gameTypeInfo)
    }

    async joinRoom(userInfo: IUserInfo, frontendId: string, roomId: string, clubShortId: number) {
        const code = await this.mgr.joinRoom(userInfo, frontendId, roomId, clubShortId)
        return code == errorCode.ok
    }

    async leaveRoom(roomId: string, uid: number) {
        return this.mgr.leaveRoom(roomId, uid)
    }

    async isUserInRoom(uid: number, roomId: string) {
        return this.mgr.isUserInRoom(uid, roomId)
    }

    async getRoomGameDataByKind(kindId: string) {
        return this.mgr.getRoomGameDataByKind(kindId)
    }

    async getRoomGameDataByRoomID(roomId: string) {
        return this.mgr.getRoomGameDataByRoomID(roomId)
    }

    async onUserOffline(uid: number, roomId: string) {
        return this.mgr.onUserOffline(uid, roomId)
    }

    async userRoomMessage(uid: number, roomId: string, msg: any) {
        const roomFrame = this.mgr.getRoomFrameByID(roomId)

        if (!roomFrame) {
            return {code: errorCode.invalidRequest}
        } else {
            await roomFrame.receiveRoomMessage(uid, msg)
            return {code: errorCode.ok}
        }
    }

    async userGameMessage(uid: number, roomId: string, msg: any) {
        const roomFrame = this.mgr.getRoomFrameByID(roomId)
        if (!roomFrame) {
            return {code: errorCode.invalidRequest}
        } else {
            await roomFrame.receiveGameMessage(uid, msg)
            return {code: errorCode.ok}
        }
    }

    async updateRoomUserInfo(newUserInfo: any, roomId: string,) {
        const roomFrame = this.mgr.getRoomFrameByID(roomId)
        if (!roomFrame) {
            return {code: errorCode.invalidRequest}
        } else {
            await roomFrame.updateRoomUserInfo(newUserInfo, false)
            return {code: errorCode.ok}
        }
    }

    async updatePublicParameter(newParameters: any) {
        this.app.set(GlobalEnum.publicParameterKey, newParameters)
    }

    async getMatchRoomList(gameTypeInfoId: string) {
        return this.mgr.getMatchRoomList(gameTypeInfoId)
    }

    // 房间是否存在
    async isRoomExists(roomId: string) {
        return !!this.mgr.getRoomFrameByID(roomId)
    }

    // 创建好友房
    async createClubRoom(userInfo: IUserInfo, frontendId: string, clubRule: IClubRule) {
        const gameRule: IGameRule = {
            arenaId: '',
            diamondCost: clubRule.diamondCost,
            gameRoomStartType: clubRule.gameRoomStartType,
            goldCost: 0,
            isOwnerPay: clubRule.isOwnerPay,
            roomSettlementMethod: clubRule.roomSettlementMethod,
            roomType: RoomType.club,
            clubShortId: clubRule.clubShortId,
        }
        let parameters = clubRule.parameters
        if (typeof parameters == 'string') {
           parameters = JSON.parse(parameters)
        }
        const gameTypeInfo: IGameTypeInfo = {
            roomType: RoomType.club,
            baseScore: 0,
            expenses: 0,
            gameTypeID: 'privateRoom',
            goldLowerLimit: 0,
            goldUpper: 0,
            hundred: 0,
            kind: clubRule.kind,
            level: 0,
            matchRoom: 0,
            maxDrawCount: clubRule.maxDrawCount,
            maxPlayerCount: clubRule.maxPlayerCount,
            maxRobotCount: 0,
            minPlayerCount: clubRule.minPlayerCount,
            minRobotCount: 0,
            parameters: parameters
        }
        await this.mgr.createRoom(userInfo, frontendId, gameRule, gameTypeInfo)
    }

    // 获取俱乐部
    async getClubRooms(clubShortId: number):Promise<IClubRoomInfo[]> {
        return this.mgr.getClubRoom(clubShortId)
    }

}
