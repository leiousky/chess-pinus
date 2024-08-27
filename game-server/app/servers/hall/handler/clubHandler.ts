import {Application, FrontendSession, pinus} from 'pinus'
import errorCode from '../../../constants/errorCode'
import {dispatch} from '../../../util/dispatcher'
import services from '../../../services'
import {RoomSettlementMethod, UserStatus} from '../../../constants/game'
import {RpcApi} from '../../../api/rpc'
import {UserModel, userModel} from '../../../dao/models/user'
import {ClubMemberModel} from '../../../dao/models/clubMember'
import clubManager from '../../../dao/club/manager'
import {
    AddOrUpdateRuleResp,
    CreateClubResp, DelRuleResp,
    GetClubRoomsResp,
    GetCoinRecordResp,
    IAddClubGoldReq,
    IAddClubGoldResp, IAddOrUpdateRuleReq, IAddOrUpdateRuleResp,
    IAddToBlackListReq,
    IAddToBlackListResp,
    IClubRequestAgreeOrNotReq,
    IClubRequestAgreeOrNotResp,
    ICreateClubReq,
    ICreateClubResp,
    ICreateRoomReq,
    ICreateRoomResp,
    IDeleteClubJoinRequestReq,
    IDeleteClubJoinRequestResp, IDelRuleReq, IDelRuleResp,
    IDissolveClubReq,
    IDissolveClubResp,
    IExitClubByAdminReq,
    IExitClubByAdminResp,
    IGetClubRequestListReq,
    IGetClubRequestListResp,
    IGetClubRoomsReq,
    IGetClubRoomsResp,
    IGetCoinRecordReq,
    IGetCoinRecordResp,
    IGetMembersByClubShortIdReq,
    IGetMembersByClubShortIdResp, IGetRulesReq, IGetRulesResp,
    IMyClubListReq,
    IMyClubListResp,
    INewJoinRequestReq,
    INewJoinRequestResp,
    IQueryClubReq,
    IQueryClubResp,
    IRemoveFromBlackListResp,
    IRenameReq,
    IRenameResp,
    ISetMemberAdminReq,
    ISetMemberAdminResp,
    ITransferReq,
    ITransferResp,
    IUpdateClubMemberCommentReq,
    IUpdateClubMemberCommentResp,
    MyClubListResp,
    QueryClubResp
} from '../../../types/hall/club'
import {ClubCoinRecordModel} from "../../../dao/models/clubCoinRecord";
import {ClubRuleModel} from "../../../dao/models/clubRule";

export default function (app: Application) {
    return new Handler(app)
}

// 俱乐部
export class Handler {

    constructor(private app: Application) {
    }

    /**
     * 创建俱乐部房间
     * @param msg
     * @param session
     */
    async createRoom(msg: ICreateRoomReq, session: FrontendSession): Promise<ICreateRoomResp> {
        const uid = Number(session.uid)
        // 规则
        const ruleId: string = msg.ruleId
        // 俱乐部 id
        const clubShortId: number = msg.clubShortId
        if (!clubShortId) {
            // 参数错误
            return CreateClubResp.error(errorCode.invalidRequest)
        }
        const rule = await ClubRuleModel.getRuleById(ruleId)
        if (!rule || rule.clubShortId != clubShortId) {
            // 俱乐部规则错误
            return CreateClubResp.error(errorCode.clubNotExists)
        }
        const member = await ClubMemberModel.getMemberByClubShortId(clubShortId, uid)
        if (!member) {
            return CreateClubResp.error(errorCode.clubNotExists)
        }
        const model = await userModel.findOne({uid: session.uid})
        if (!model) {
            return CreateClubResp.error(errorCode.userNotFound)
        }
        rule.clubShortId = clubShortId
        // 金币房
        rule.roomSettlementMethod = RoomSettlementMethod.clubGold
        const gameServer = dispatch(services.utils.getRandomNum(0, pinus.app.getServersByType('game').length - 1).toString(),
            pinus.app.getServersByType('game'))
        const userInfo = services.user.buildGameRoomUserInfo(model, -1, UserStatus.none, member.clubGold)
        await RpcApi.createClubRoom(gameServer.id, userInfo, model.frontendId, rule)
        return CreateClubResp.ok()
    }

    /**
     * 查找俱乐部
     * @param msg
     * @param session
     */
    async queryClub(msg: IQueryClubReq, session: FrontendSession): Promise<IQueryClubResp> {
        const result = await clubManager.queryClub(msg.clubShortId)
        if (!result) {
            return QueryClubResp.error(errorCode.clubNotExists)
        }
        return QueryClubResp.ok()
    }

    /**
     * 同意或拒绝申请
     * @param msg
     * @param session
     */
    async clubRequestAgreeOrNot(msg: IClubRequestAgreeOrNotReq, session: FrontendSession): Promise<IClubRequestAgreeOrNotResp> {
        return await clubManager.clubRequestAgreeOrNot(msg.requestId, msg.isAgree, Number(session.uid))
    }

    /**
     * 创建俱乐部
     * @param msg
     * @param session
     */
    async createClub(msg: ICreateClubReq, session: FrontendSession): Promise<ICreateClubResp> {
        const uid = Number(session.uid)
        return await clubManager.createNewClub(uid, msg.clubName)
    }

    /**
     * 申请加入俱乐部
     * @param msg
     * @param session
     */
    async newJoinRequest(msg: INewJoinRequestReq, session: FrontendSession): Promise<INewJoinRequestResp> {
        const uid = Number(session.uid)
        return await clubManager.newJoinRequest(msg.clubShortId, uid)
    }

    /**
     * 我的俱乐部列表
     * @param msg
     * @param session
     */
    async myClubList(msg: IMyClubListReq, session: FrontendSession): Promise<IMyClubListResp> {
        const infoList = await clubManager.myClub(Number(session.uid))
        return MyClubListResp.ok(infoList)
    }

    /**
     * 俱乐部申请列表
     * @param msg
     * @param session
     */
    async getClubRequestList(msg: IGetClubRequestListReq, session: FrontendSession): Promise<IGetClubRequestListResp> {
        return await clubManager.getClubRequestList(msg.clubShortId, Number(session.uid))
    }

    /**
     * 删除申请
     * @param msg
     * @param session
     */
    async deleteClubJoinRequest(msg: IDeleteClubJoinRequestReq, session: FrontendSession): Promise<IDeleteClubJoinRequestResp> {
        return await clubManager.deleteRequest(msg.requestId, Number(session.uid))
    }

    // // 主动退出俱乐部
    // async exitClubBySelf(msg: any, session: Session) {
    //     if (!session.uid) {
    //         return {code: errorCode.invalidUser}
    //     }
    //     const clubShortId: number = msg.clubShortId
    //     return await clubManager.exitClubBySelf(clubShortId, Number(session.uid))
    // }


    /**
     * 管理员踢出俱乐部
     * @param msg
     * @param session
     */
    async exitClubByAdmin(msg: IExitClubByAdminReq, session: FrontendSession): Promise<IExitClubByAdminResp> {
        return await clubManager.exitClubByAdmin(msg.memberId, Number(session.uid))
    }

    /**
     * 获取俱乐部成员
     * @param msg
     * @param session
     */
    async getMembersByClubShortId(msg: IGetMembersByClubShortIdReq, session: FrontendSession): Promise<IGetMembersByClubShortIdResp> {
        return await clubManager.getMembersByClubShortId(msg.clubShortId, Number(session.uid))
    }

    /**
     * 设为管理员
     * @param msg
     * @param session
     */
    async setMemberAdmin(msg: ISetMemberAdminReq, session: FrontendSession): Promise<ISetMemberAdminResp> {
        return await clubManager.setMemberAdmin(msg.memberId, Number(session.uid), !!msg.isAdmin)
    }

    /**
     * 添加俱乐部游戏币
     * @param msg
     * @param session
     */
    async addClubGold(msg: IAddClubGoldReq, session: FrontendSession): Promise<IAddClubGoldResp> {
        return await clubManager.addClubGold(msg.memberId, Number(session.uid), msg.addGold)
    }


    /**
     * 修改成员备注
     * @param msg
     * @param session
     */
    async updateClubMemberComment(msg: IUpdateClubMemberCommentReq, session: FrontendSession): Promise<IUpdateClubMemberCommentResp> {
        return await clubManager.updateClubMemberComment(msg.memberId, Number(session.uid), msg.comment)
    }

    /**
     * 解散俱乐部
     * @param msg
     * @param session
     */
    async dissolveClub(msg: IDissolveClubReq, session: FrontendSession): Promise<IDissolveClubResp> {
        return await clubManager.dissolveClub(msg.memberId, Number(session.uid))
    }

    /**
     * 获取俱乐部房间
     * @param msg
     * @param session
     */
    async getClubRooms(msg: IGetClubRoomsReq, session: FrontendSession): Promise<IGetClubRoomsResp> {
        const clubShortId: number = msg.clubShortId
        const roomList = await RpcApi.getClubRooms(clubShortId)
        return GetClubRoomsResp.success(roomList)
    }

    /**
     * 俱乐部改名
     * @param msg
     * @param session
     */
    async rename(msg: IRenameReq, session: FrontendSession): Promise<IRenameResp> {
        // TODO 改名扣钻石
        const uid = Number(session.uid)
        return await clubManager.rename(msg.clubShortId, uid, msg.newName)
    }

    /**
     * 转移俱乐部
     * @param msg
     * @param session
     */
    async transfer(msg: ITransferReq, session: FrontendSession): Promise<ITransferResp> {
        const uid = Number(session.uid)
        const clubShortId: number = msg.clubShortId
        // 接收人
        const toUid: number = msg.toUid
        return await clubManager.transfer(clubShortId, toUid, uid)
    }

    /**
     * 添加黑名单
     * @param msg
     * @param session
     */
    async addToBlackList(msg: IAddToBlackListReq, session: FrontendSession): Promise<IAddToBlackListResp> {
        const uid = Number(session.uid)
        return await clubManager.addToBlackList(msg.clubShortId, uid, msg.blockUid)
    }

    /**
     * 移除黑名单
     * @param msg
     * @param session
     */
    async removeFromBlackList(msg: IAddToBlackListReq, session: FrontendSession): Promise<IRemoveFromBlackListResp> {
        const uid = Number(session.uid)
        return await clubManager.removeFromBlackList(msg.clubShortId, uid, msg.blockUid)
    }

    /**
     * 获取金币操作记录
     * @param msg
     * @param session
     */
    async getCoinRecord(msg: IGetCoinRecordReq, session: FrontendSession): Promise<IGetCoinRecordResp> {
        const records = await ClubCoinRecordModel.getRecord(msg.clubShortId, msg.count, msg.lastRecord)
        // 查找用户
        const uidList: number[] = []
        records.forEach(value => {
            uidList.push(value.memberUid)
            uidList.push(value.operatorUid)
        })
        const users = await UserModel.getUsersByUidList(uidList)
        const userMap = services.utils.modelArrayToMap(users, 'uid')
        return GetCoinRecordResp.success(userMap, records)
    }

    /**
     * 添加更新规则
     * @param msg
     * @param session
     */
    async addOrUpdateRule(msg: IAddOrUpdateRuleReq, session: FrontendSession):Promise<IAddOrUpdateRuleResp> {
        const rule = msg.rule
        const clubShortId = msg.clubShortId
        const uid = Number(session.uid)
        if (!services.club.isRuleValid(rule)) {
            // 参数错误
            return AddOrUpdateRuleResp.error(errorCode.invalidRequest)
        }
        return await clubManager.addOrUpdateRule(rule, clubShortId, uid)
    }

    /**
     * 删除规则
     * @param msg
     * @param session
     */
    async delRule(msg: IDelRuleReq, session: FrontendSession):Promise<IDelRuleResp> {
        const ruleId = msg.ruleId
        await ClubRuleModel.delRuleById(ruleId)
        return DelRuleResp.ok()
    }

    /**
     * 获取所有规则
     * @param msg
     * @param session
     */
    async getRules(msg: IGetRulesReq, session: FrontendSession):Promise<IGetRulesResp> {
        return await clubManager.getRules(msg.clubShortId, msg.kind)
    }
}
