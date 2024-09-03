import {pinus} from 'pinus'
import {dispatch} from '../util/dispatcher'
import {IArenaRule, IGameRule, IGameTypeInfo, IPrivateRule, IUserInfo} from '../types/interfaceApi'
import {IClubRoomInfo} from '../types/hall/club'
import {IClubRule} from "../dao/models/clubRule";

export class RpcApi {

    // 根据参数调用 rpc
    static rpc(...args: string[]) {  // 使用剩余参数
        const routeArr = args[0].split('.')
        const rpcArgs = args.slice(1)  // 获取除第一个参数外的所有参数
        // pinus.app.rpc[routeArr[0]][routeArr[1]][routeArr[2]].to(routeArr[3])(...rpcArgs)  // 调用 rpc
        pinus.app.rpc[routeArr[0]][routeArr[1]][routeArr[2]].toServer(...rpcArgs)  // 调用 rpc
    }

    // static async userLeave(serverID: string, uid: number, roomID: string) {
    //     pinus.app.rpc.hall.entryRemote.leave.to(serverID, uid, roomID)
    // }

    static async getCurRobotWinRate(kind: number) {
        return pinus.app.rpc.robot.controllerRemoter.getCurRobotWinRate.to('robot')(kind)
    }

    static async robotGoldChanged(kind: number, count: number) {
        await pinus.app.rpc.robot.controllerRemoter.robotGoldChanged.to('robot')(kind, count)
    }

    // 玩家离开房间
    static async userLeaveRoom(uid: string, serverId: string) {
        await pinus.app.rpc.connector.gateRemoter.userLeaveRoom.to(serverId)(uid)
    }

    // 玩家进入房间
    static async userEntryRoom(uid: string, serverId: string, roomId: string) {
        await pinus.app.rpc.connector.gateRemoter.userEntryRoom.to(serverId)(uid, roomId)
    }

    // 解散房间
    static async dismissRoom(roomId: string) {
        const serverInfos = pinus.app.getServersByType('game')
        if (!serverInfos || serverInfos.length === 0) {
            console.error('can not find game servers from dismissRoom.')
            return
        }
        const res = dispatch(roomId, serverInfos)
        await pinus.app.rpc.game.roomRemoter.dismissRoom.to(res.id)(roomId)
    }

    // 通知机器人离开
    static async robotLeaveRoomNotify(kind: number, uidArr: number[]) {
        await pinus.app.rpc.robot.robotRemoter.robotLeaveRoomNotify.to('robot')(kind, uidArr)
    }

    static async requestRobotNotify(roomId: string, gameTypeInfo: IGameTypeInfo, robotCount: number) {
        await pinus.app.rpc.robot.robotRemoter.requestRobotNotify.to('robot')(roomId, gameTypeInfo, robotCount)
    }

    // 查找房号
    static async searchRoomByUid(uid: number) {
        const gameServers = pinus.app.getServersByType('game')
        for (const gameServer of gameServers) {
            const resp = await pinus.app.rpc.game.roomRemoter.searchRoomByUid.to(gameServer.id)(uid)
            if (resp) {
                return resp
            }
        }
        // 没找到
        return null
    }

    static async isUerInRoom(serverId: string, uid: number, roomId: string) {
        return pinus.app.rpc.game.roomRemoter.isUserInRoom.to(serverId)(uid, roomId)
    }

    static async createMatchRoom(serverId: string, userInfoArr: any, gameTypeInfo: IGameTypeInfo) {
        return pinus.app.rpc.game.roomRemoter.createMatchRoom.to(serverId)(userInfoArr, gameTypeInfo)
    }

    // 竞技场房间
    static async createArenaRoom(serverId: string, userInfoArr: IUserInfo[], gameRule: IArenaRule) {
        return pinus.app.rpc.game.roomRemoter.createArenaRoom.to(serverId)(userInfoArr, gameRule)
    }

    // 根据规则创建房间
    static async createRoom(serverId: string, userInfo: IUserInfo, frontendId: string, gameRule: IGameRule, gameTypeInfo: IGameTypeInfo) {
        return pinus.app.rpc.game.roomRemoter.createRoom.to(serverId)(userInfo, frontendId, gameRule, gameTypeInfo)
    }

    // 创建好友房
    static async createPrivateRoom(serverId: string, userInfo: IUserInfo, frontendId: string, privateRule: IPrivateRule) {
        return pinus.app.rpc.game.roomRemoter.createPrivateRoom.to(serverId)(userInfo, frontendId, privateRule)
    }

    // 创建俱乐部房
    static async createClubRoom(serverId: string, userInfo: IUserInfo, frontendId: string, privateRule: IClubRule, ruleId: string) {
        return pinus.app.rpc.game.roomRemoter.createClubRoom.to(serverId)(userInfo, frontendId, privateRule, ruleId)
    }

    static async joinRoom(serverId: string, userInfo: IUserInfo, frontendId: string, roomId: string, clubShortId: number) {
        return pinus.app.rpc.game.roomRemoter.joinRoom.to(serverId)(userInfo, frontendId, roomId, clubShortId)
    }

    static async getMatchRoomList(serverId: string, gameTypeInfoId: string) {
        return pinus.app.rpc.game.roomRemoter.getMatchRoomList.to(serverId)(gameTypeInfoId)
    }

    static async getRoomGameDataByKind(serverId: string, kindId: string) {
        return pinus.app.rpc.game.roomRemoter.getRoomGameDataByKind.to(serverId)(kindId)
    }

    static async getRoomGameDataByRoomID(serverId: string, roomId: string) {
        return pinus.app.rpc.game.roomRemoter.getRoomGameDataByRoomID.to(serverId)(roomId)
    }

    // 竞技场小局结束
    static async arenaRoundOver(serverId: string, data: { arenaId: string, roomId: string, data: any }) {
        return pinus.app.rpc.arena.arenaRemoter.roundOver.to(serverId)(data)
    }

    // 竞技场小局结束
    static async arenaPlayerOffline(serverId: string, uid: number) {
        return pinus.app.rpc.arena.arenaRemoter.playerOffline.to(serverId)(uid)
    }

    static async isRoomExists(roomId: string) {
        const gameServers = pinus.app.getServersByType('game')
        for (const gameServer of gameServers) {
            const resp = await pinus.app.rpc.game.roomRemoter.isRoomExists.to(gameServer.id)(roomId)
            if (resp) {
                return true
            }
        }
        // 没找到
        return false
    }

    // 俱乐部房间信息
    static async getClubRooms(clubShortId: number) :Promise<IClubRoomInfo[]>{ {
        const gameServers = pinus.app.getServersByType('game')
        const list = []
        for (const gameServer of gameServers) {
            const resp = await pinus.app.rpc.game.roomRemoter.getClubRooms.to(gameServer.id)(clubShortId)
            if (resp.length > 0) {
                list.push(...resp)
            }
        }
        // 没找到
        return list
    }}

    // 获取机器人
    static async getIdleRobot() {
        const robotServer = pinus.app.getServersByType('robot')[0]
        return await pinus.app.rpc.robot.robotRemoter.getIdleRobot.to(robotServer.id)()
    }
}

