// 推送
import {pinus} from 'pinus'

// 定义类型
export type TUidAndFrontendId = {
    uid: string
    sid: string
}[]

export class PushApi {
    static async roomMessagePush(msg: any, uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        msg.pushRouter = 'RoomMessagePush'
        await channelService.apushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, {})
    }

    static async gameMessagePush(msg: any, uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        msg.pushRouter = 'GameMessagePush'
        await channelService.apushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, {})
    }

    static async selfEntryRoomPush(msg: any, uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        msg.pushRouter = 'SelfEntryRoomPush'
        await channelService.apushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, {})
    }

    static async updateUserInfoPush(msg: any, uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        msg.pushRouter = 'UpdateUserInfoPush'
        await channelService.apushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, {})
    }

    static async broadcastPush(msg: any) {
        const channelService = pinus.app.get('channelService')
        msg.pushRouter = 'BroadcastPush'
        channelService.broadcast('connector', 'ServerMessagePush', msg, {})
    }

    static async popDialogContentPush(msg: any, uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        msg.pushRouter = 'PopDialogContentPush'
        await channelService.apushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, {})
    }

    // 下一轮竞技赛
    static async nextArenaRound(msg: { arenaId: string }, uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        const newMsg = Object.assign(msg, {pushRouter: 'ArenaRoundMessagePush'})
        await channelService.apushMessageByUids('ServerMessagePush', newMsg, uidAndFrontendIdArr, {})
    }

    // 玩家淘汰
    static async arenaRoundFail(uidAndFrontendIdArr: TUidAndFrontendId) {
        const channelService = pinus.app.get('channelService')
        const msg = {pushRouter: 'ArenaRoundFailMessagePush'}
        await channelService.apushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, {})
    }

    // 申请通过推送
    static async agreeOrRefuseClubRequest(clubShortId: number, isAgreeOrNot: boolean, uid: number, sid: string) {
        const channelService = pinus.app.get('channelService')
        const msg = {pushRouter: 'AgreeOrRefuseClubRequest', clubShortId, isAgree: isAgreeOrNot}
        await channelService.apushMessageByUids('ServerMessagePush', msg, [{uid: uid.toString(), sid}], {})
    }

    // 新加入申请消息
    static async newJoinClubRequest(clubShortId: number, name: string, uid: number, sid: string) { {
        const channelService = pinus.app.get('channelService')
        const msg = {pushRouter: 'newJoinClubRequest', clubShortId, name}
        await channelService.apushMessageByUids('ServerMessagePush', msg, [{uid: uid.toString(), sid}], {})
    }}
}
