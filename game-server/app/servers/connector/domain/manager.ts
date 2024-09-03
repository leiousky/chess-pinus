import {FrontendSession, pinus} from 'pinus'
import {EntryResp, UserInfo} from '../../../types/connector/entry'
import services from '../../../services'
import errorCode from '../../../constants/errorCode'
import {UserPermissionType} from '../../../constants/game'
import {HydratedDocument} from 'mongoose'
import {IUserModel} from '../../../dao/models/user'
import {RpcApi} from '../../../api/rpc'
import {GlobalEnum} from '../../../constants/global'
import {ClubMember} from "../../../dao/club/clubMember";
import {ClubMemberModel} from "../../../dao/models/clubMember";

export class GateManager {
    // 用户离开房间
    static async userLeaveRoom(uid: string) {
        const session = pinus.app.sessionService.getByUid(uid)
        for (const s of session) {
            s.set(GlobalEnum.sessionRoomIdKey, null)
        }
    }

    // 用户加入房间
    static async userEntryRoom(uid: string, roomId: string) {
        const session = pinus.app.sessionService.getByUid(uid)
        if (session) {
            for (const s of session) {
                s.set(GlobalEnum.sessionRoomIdKey, roomId)
            }
        } else {
            console.log('player not login', uid)
        }
    }

    // 绑定 uid 成功
    static async onBindUidSuccess(session: FrontendSession, uid: number, userInfo: UserInfo) {
        const accountModel = await services.account.getAccountByUid(uid)
        if (!accountModel) {
            return EntryResp.error(errorCode.invalidUser)
        }
        // 创建用户
        const user = await services.user.getOrCreateUser(uid, accountModel.account || accountModel.phoneAccount,
            accountModel.password, accountModel.spreaderID, userInfo)
        if ((user.permission & UserPermissionType.loginClient) == 0) {
            // 不允许登录
            return EntryResp.error(errorCode.noPermission)
        }
        // 查询是否在某个房间中
        const roomId = await RpcApi.searchRoomByUid(uid)
        if (roomId) {
            // 通知其它 session 有房间号
            const err = await session.apush(GlobalEnum.sessionRoomIdKey)
            if (err) {
                console.error('push roomId failed', err)
            }
        }
        // 更新用户信息
        await GateManager.updateUserData(session, user)
        // 获取俱乐部
        const myClub = await ClubMemberModel.findMemberByUid(uid)
        const clubShortIdList = []
        myClub.forEach(value => {
            clubShortIdList.push(value.clubShortId)
        })
        return EntryResp.success(user, clubShortIdList)
    }

    // 绑定 uid 失败
    static async onBindUidFail() {
        return EntryResp.error(errorCode.systemErr)
    }

    static async updateUserData(session: FrontendSession, user: HydratedDocument<IUserModel>) {
        user.lastLoginIp = pinus.app.get('sessionService').getClientAddressBySessionId(session.id).ip.split(':').pop()
        user.lastLoginTime = Date.now()
        user.frontendId = pinus.app.getServerId()
        // const roomId = session.get('roomId') || ''
        // const dataLock = 0
        // const userOnlineStatus = UserOnlineStatus.online
        // const isLockGold = session.get('roomId').length > 0 ? true : false
        await user.save()
    }

    // 玩家离线
    static async onUserLeave(session: FrontendSession, reason: any) {
        console.log('user leave', session.uid, reason)
        // TODO 通知房间
    }
}
