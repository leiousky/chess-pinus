import {Application, FrontendSession, pinus} from 'pinus'
import errorCode from '../../../constants/errorCode'
import {GlobalEnum} from '../../../constants/global'
import {userModel} from '../../../dao/models/user'
import {RpcApi} from '../../../api/rpc'
import {dispatch} from '../../../util/dispatcher'
import services from '../../../services'
import {UserStatus} from '../../../constants/game'
import {MatchManager} from '../domain/matchDomain'
import {IPrivateRule} from '../../../types/interfaceApi'
import clubManger from '../../../dao/club/manager'

export default function (app: Application) {
    return new Handler(app)
}

// 大厅管理
export class Handler {
    mgr: MatchManager

    constructor(private app: Application) {
        this.mgr = app.get(GlobalEnum.matchManagerKey)
    }

    async joinRoom(msg: any, session: FrontendSession) {
        const uid = Number(session.uid)
        let newRoomId: string = msg.roomId
        if (!newRoomId) {
            return {code: errorCode.invalidRequest}
        }
        // 俱乐部 id
        const clubShortId: number = Number(msg.clubShortId)
        if (clubShortId) {
            // 检查俱乐部
            const club = await clubManger.queryClub(clubShortId)
            if (!club) {
                return {code: errorCode.clubNotExists}
            }
        }
        // 检查房间是否解散
        const isExists = await RpcApi.isRoomExists(newRoomId)
        if (!isExists) {
            return {code: errorCode.roomDismissShouldExit}
        }
        const oldRoomId = session.get(GlobalEnum.sessionRoomIdKey)
        const model = await userModel.findOne({uid})
        if (!model) {
            // 用户不存在
            return {code: errorCode.invalidUser}
        }
        if (oldRoomId) {
            const gameServer = dispatch(oldRoomId, this.app.getServersByType('game'))
            const isInRoom = await RpcApi.isUerInRoom(gameServer.id, uid, oldRoomId)
            if (isInRoom) {
                // 返回原来的旧房间
                newRoomId = oldRoomId
            }
        }
        const gameServer = dispatch(newRoomId, this.app.getServersByType('game'))
        return RpcApi.joinRoom(gameServer.id, services.user.buildGameRoomUserInfo(model, -1, UserStatus.none), model.frontendId, newRoomId, clubShortId)
    }

    // 匹配房间
    async matchRoom(msg: any, session: FrontendSession) {
        if (!msg.gameTypeID) {
            return {code: errorCode.invalidRequest}
        }
        const uid = Number(session.uid)
        const gameTypeId = msg.gameTypeID
        const oldRoomId = session.get(GlobalEnum.sessionRoomIdKey)
        const gameTypeInfo = services.parameter.getGameTypeInfoById(gameTypeId)
        if (!gameTypeInfo) {
            return {code: errorCode.invalidRequest}
        }
        const model = await userModel.findOne({uid})
        if (oldRoomId) {
            const gameServer = dispatch(oldRoomId, this.app.getServersByType('game'))
            const isInRoom = await RpcApi.isUerInRoom(gameServer.id, uid, oldRoomId)
            if (isInRoom) {
                return {code: errorCode.alreadyInRoom}
            }
        }
        if (!gameTypeInfo.matchRoom) {
            // 非匹配制，直接查询加入房间
            const code = await this.mgr.startMatch(model, gameTypeId)
            return {code: code}
        } else {
            const isOk = await this.mgr.entryMatchList(uid, gameTypeId)
            if (!isOk) {
                return {code: errorCode.inMatchList}
            }
            return {code: errorCode.ok}
        }
    }

    async stopMatchRoom(msg: any, session: FrontendSession) {
        await this.mgr.exitMatchList(Number(session.uid))
    }

    async getAllRoomGameDataByKind(msg: any, session: FrontendSession) {
        if (!msg.kindID) {
            return {code: errorCode.invalidRequest}
        }
        const gameServers = this.app.getServersByType('game')
        let gameDataArr = []
        for (let i = 0; i < gameServers.length; ++i) {
            const resp = await RpcApi.getRoomGameDataByKind(gameServers[i].id, msg.kindID)
            if (resp) {
                gameDataArr = gameDataArr.concat(resp.concat())
            }
        }
        return {code: errorCode.ok, msg: {gameDataArr}}
    }

    async getRoomGameDataByRoomID(msg: any, session: FrontendSession) {
        if (!msg.roomID) {
            return {code: errorCode.invalidRequest}
        }
        const gameServer = dispatch(msg.roomID, this.app.getServersByType('game'))
        const resp = await RpcApi.getRoomGameDataByRoomID(gameServer.id, msg.roomID)
        return {code: errorCode.ok, msg: {gameData: resp}}
    }

    // 新建好友房
    async createRoom(msg: any, session: FrontendSession) {
        const rule: IPrivateRule = msg.gameRule
        if (rule.parameters && typeof rule.parameters == 'string') {
            rule.parameters = JSON.parse(rule.parameters)
        } else {
            rule.parameters = {
                blindBetCount: 0,
                preBetCount: 0,
                maxTake: 400,
            }
        }
        const model = await userModel.findOne({uid: session.uid})
        if (!model) {
            return {code: errorCode.userNotFound}
        }
        // 分配 game server
        const gameServer = dispatch(services.utils.getRandomNum(0, pinus.app.getServersByType('game').length - 1).toString(),
            pinus.app.getServersByType('game'))
        const userInfo = services.user.buildGameRoomUserInfo(model, -1, UserStatus.none)
        await RpcApi.createPrivateRoom(gameServer.id, userInfo, model.frontendId, rule)
        return {code: errorCode.ok}
    }

}
