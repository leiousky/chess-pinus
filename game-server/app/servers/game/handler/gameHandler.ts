import {Application, FrontendSession} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import errorCode from '../../../constants/errorCode'
import {RoomManager} from '../domain/roomManager'

export default function (app: Application) {
    return new Handler(app)
}

// 房间管理
export class Handler {
    mgr: RoomManager

    constructor(private app: Application) {
        this.mgr = this.app.get(GlobalEnum.roomManagerKey)
    }

    // 处理房内消息
    async roomMessageNotify(msg: any, session: FrontendSession) {
        const curRoomID = session.get(GlobalEnum.sessionRoomIdKey)
        if (!curRoomID) {
            return {code: errorCode.invalidRequest}
        }
        const roomFrame = this.mgr.getRoomFrameByID(curRoomID)
        if (!roomFrame) {
            return {code: errorCode.invalidRequest}
        } else {
            await roomFrame.receiveRoomMessage(Number(session.uid), msg)
            return {code: errorCode.ok}
        }
    }

    // 接收游戏内消息
    async gameMessageNotify(msg: any, session: FrontendSession) {
        const curRoomID = session.get(GlobalEnum.sessionRoomIdKey)
        if (!curRoomID) {
            return {code: errorCode.invalidRequest}
        }
        const roomFrame = this.mgr.getRoomFrameByID(curRoomID)
        if (!roomFrame) {
            return {code: errorCode.invalidRequest}
        } else {
            await roomFrame.receiveGameMessage(Number(session.uid), msg)
            return {code: errorCode.ok}
        }
    }
}
