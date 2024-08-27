import {Club} from './club'
import errorCode from '../../constants/errorCode'
import {ClubRequest} from './clubRequest'
import {ClubMember} from './clubMember'
import {ClubRequestModel} from '../models/clubRequest'
import {ClubModel} from '../models/club'
import {ClubMemberModel} from '../models/clubMember'
import {UserModel} from '../models/user'
import {PushApi} from '../../api/push'
import {
    AddClubGoldResp, AddOrUpdateRuleResp,
    AddToBlackListResp, ClubRequestAgreeOrNotResp,
    CreateClubResp,
    DeleteClubJoinRequestResp,
    DissolveClubResp, ExitClubByAdminResp,
    GetClubRequestListResp, GetMembersByClubShortIdResp, GetRulesResp, IAddOrUpdateRuleResp,
    IAddToBlackListResp, IClubRequestAgreeOrNotResp, IClubRuleReq,
    ICreateClubResp,
    IDeleteClubJoinRequestResp,
    IDissolveClubResp, IExitClubByAdminResp,
    IGetMembersByClubShortIdResp, IGetRulesResp,
    IMyClub,
    INewJoinRequestResp,
    IRemoveFromBlackListResp,
    IRenameResp,
    ISetMemberAdminResp,
    ITransferResp,
    NewJoinRequestResp,
    RemoveFromBlackListResp,
    RenameResp,
    SetMemberAdminResp,
    TransferResp,
    UpdateClubMemberCommentResp
} from '../../types/hall/club'
import {ClubCoinRecordModel, IClubCoinRecord} from "../models/clubCoinRecord";
import {ClubRuleModel, IClubRule} from "../models/clubRule";
import {IClubRuleInfo} from "../../types/interfaceApi";

export class ClubManager {
    // 查找俱乐部
    async queryClub(clubShortId: number) {
        const m = await ClubModel.getClubByShortId(clubShortId)
        if (m) {
            return new Club(m)
        }
        return null
    }

    // 新增俱乐部申请
    async newJoinRequest(clubShortId: number, playerUid: number): Promise<INewJoinRequestResp> {
        const club = await ClubModel.getClubByShortId(clubShortId)
        if (!club) {
            return NewJoinRequestResp.error(errorCode.clubNotExists)
        }
        const isJoin = await ClubMemberModel.isMemberJoin(clubShortId, playerUid)
        if (isJoin) {
            // 已加入
            return NewJoinRequestResp.error(errorCode.alreadyInClub)
        }
        const hasRequest = await ClubRequestModel.getRequest(clubShortId, playerUid)
        if (hasRequest) {
            return NewJoinRequestResp.error(errorCode.hasJoinClubRequest)
        }
        // 新建 request
        const user = await UserModel.getUserByUid(playerUid)
        if (!user) {
            return NewJoinRequestResp.error(errorCode.userNotFound)
        }
        await ClubRequest.clubRequestFromRaw(clubShortId, playerUid, user._id)
        // 给房主推送
        const adminUser = await UserModel.getUserByUid(club.creatorUid)
        if (adminUser && adminUser.frontendId) {
            // 有登录
            await PushApi.newJoinClubRequest(clubShortId, club.name, adminUser.uid, adminUser.frontendId)
        }
        return NewJoinRequestResp.ok()
    }

    // 同意或拒绝申请
    async clubRequestAgreeOrNot(requestId: string, isAgree: boolean, uid: number): Promise<IClubRequestAgreeOrNotResp> {
        // 查找request
        const req = await ClubRequestModel.getRequestById(requestId)
        if (!req) {
            // 没有该申请
            return ClubRequestAgreeOrNotResp.error(errorCode.noJoinClubRequest)
        }
        // 检查俱乐部是否存在
        const club = await ClubModel.getClubByShortId(req.clubShortId)
        if (!club) {
            return ClubRequestAgreeOrNotResp.error(errorCode.clubNotExists)
        }
        // 检查是否有权限
        const member = await ClubMember.getClubMember(req.clubShortId, uid)
        if (!member || !member.hasAdminPermission()) {
            // 玩家不存在
            return ClubRequestAgreeOrNotResp.error(errorCode.noPermission)
        }
        const clubRequest = new ClubRequest(req)
        if (isAgree) {
            // 创建新成员
            await ClubMember.getOrCreateMember(club._id, club.clubShortId, req.playerUid, req.playerId)
            // 删除申请
            await clubRequest.remove()
        } else {
            clubRequest.refuse()
            await clubRequest.save()
        }
        const user = await UserModel.getUserById(req.playerId)
        await PushApi.agreeOrRefuseClubRequest(club.clubShortId, isAgree, user.uid, user.frontendId)
        return ClubRequestAgreeOrNotResp.ok()
    }

    // 创建新俱乐部
    async createNewClub(uid: number, clubName: string): Promise<ICreateClubResp> {
        // TODO 检查能建几个俱乐部
        const user = await UserModel.getUserByUid(uid)
        if (!user) {
            return CreateClubResp.error(errorCode.userNotFound)
        }
        const club = await Club.clubFromRaw(clubName, user._id, user.uid)
        // 添加 member
        const member = await ClubMember.getOrCreateMember(club.m._id, club.m.clubShortId, user.uid, user._id)
        member.setCreator(true)
        await member.save()
        return CreateClubResp.ok()
    }

    // 我的战队
    async myClub(uid: number): Promise<IMyClub[]> {
        const records = await ClubMember.getClubMembersByUid(uid)
        const clubIdList = []
        records.map(value => {
            clubIdList.push(value.m.clubId)
        })
        const clubs = await Club.getClubByIdList(clubIdList)
        const clubCounter = await ClubMember.countClubMember(clubIdList)
        const list: IMyClub[] = []
        for (const member of records) {
            const info = member.clubInfo()
            info.clubName = clubs[member.m.clubId.toString()].m.name
            info.totalMember = clubCounter[member.m.clubId.toString()]
            list.push(info)
        }
        return list
    }

    async getClubRequestList(clubShortId: number, uid: number) {
        const member = await ClubMember.getClubMember(clubShortId, uid)
        const list = []
        if (!member || !member.hasAdminPermission()) {
            // 无权限
            return GetClubRequestListResp.error(errorCode.noPermission)
        }
        const records = await ClubRequest.clubRequestList(member.m.clubShortId)
        for (const r of records) {
            list.push(await r.toClient())
        }
        return GetClubRequestListResp.success(list)
    }

    // 删除申请
    async deleteRequest(requestId: string, uid: number): Promise<IDeleteClubJoinRequestResp> {
        const request = await ClubRequest.getRequestById(requestId)
        if (!request) {
            return DeleteClubJoinRequestResp.error(errorCode.noJoinClubRequest)
        }
        const member = await ClubMember.getClubMember(request.m.clubShortId, uid)
        if (!member || !member.hasAdminPermission()) {
            return DeleteClubJoinRequestResp.error(errorCode.noPermission)
        }
        await request.remove()
        return DeleteClubJoinRequestResp.ok()
    }

    // 自己退出俱乐部
    async exitClubBySelf(clubShortId: number, uid: number) {
        const member = await ClubMember.getClubMember(clubShortId, uid)
        if (!member) {
            // 未加入
            return {code: errorCode.clubNotExists}
        }
        await member.remove()
        return {code: errorCode.ok}
    }

    // 踢出俱乐部
    async exitClubByAdmin(memberId: string, opUid: number): Promise<IExitClubByAdminResp> {
        const member = await ClubMember.getClubMemberById(memberId)
        if (!member) {
            return ExitClubByAdminResp.error(errorCode.clubNotExists)
        }
        if (member.isCreator()) {
            // 战队主不能被删除
            return ExitClubByAdminResp.error(errorCode.canNotRemoveCreator)
        }
        const adminMember = await ClubMember.getClubMember(member.m.clubShortId, opUid)
        if (!adminMember || !adminMember.hasAdminPermission()) {
            return ExitClubByAdminResp.error(errorCode.noPermission)
        }
        if (adminMember.m.memberUid == member.m.memberUid) {
            return ExitClubByAdminResp.error(errorCode.canNotRemoveSelf)
        }
        if (member.isAdmin()) {
            // 只有创建者能移除管理员
            if (!adminMember.isCreator()) {
                return ExitClubByAdminResp.error(errorCode.canNotRemoveAdmin)
            }
        }
        await member.remove()
        return ExitClubByAdminResp.ok()
    }

    async getMembersByClubShortId(clubShortId: number, uid: number): Promise<IGetMembersByClubShortIdResp> {
        const member = await ClubMember.getClubMember(clubShortId, uid)
        if (!member) {
            return GetMembersByClubShortIdResp.error(errorCode.noPermission)
        }
        const members = await ClubMember.getClubMembersByClubShortId(clubShortId)
        const list = []
        for (const member of members) {
            list.push(await member.memberInfo())
        }
        return GetMembersByClubShortIdResp.success(list)
    }

    async setMemberAdmin(memberId: string, uid: number, isAdminOrNot: boolean): Promise<ISetMemberAdminResp> {
        const targetMember = await ClubMember.getClubMemberById(memberId)
        if (!targetMember) {
            return SetMemberAdminResp.error(errorCode.clubNotExists)
        }
        const adminMember = await ClubMember.getClubMember(targetMember.m.clubShortId, uid)
        if (!adminMember || !adminMember.hasAdminPermission()) {
            return SetMemberAdminResp.error(errorCode.noPermission)
        }
        targetMember.setAdmin(isAdminOrNot)
        await targetMember.save()
        return SetMemberAdminResp.ok()
    }

    async addClubGold(memberId: string, uid: number, addGold: number) {
        const targetMember = await ClubMember.getClubMemberById(memberId)
        if (!targetMember) {
            return AddClubGoldResp.error(errorCode.clubNotExists)
        }
        const adminMember = await ClubMember.getClubMember(targetMember.m.clubShortId, uid)
        if (!adminMember || !adminMember.hasAdminPermission()) {
            return AddClubGoldResp.error(errorCode.noPermission)
        }
        targetMember.addClubGold(addGold)
        // 更新操作记录
        const coinRecord: IClubCoinRecord = {
            addCoin: addGold,
            clubId: adminMember.m.clubId,
            clubShortId: adminMember.m.clubShortId,
            createAt: new Date(),
            memberPlayerId: targetMember.m.memberPlayerId,
            memberUid: targetMember.m.memberUid,
            operatorPlayerId: adminMember.m.memberPlayerId,
            operatorUid: adminMember.m.memberUid,
        }
        await ClubCoinRecordModel.addRecord(coinRecord)
        await targetMember.save()
        return AddClubGoldResp.ok()
    }

    async updateClubMemberComment(memberId: string, uid: number, comment: string) {
        const targetMember = await ClubMember.getClubMemberById(memberId)
        if (!targetMember) {
            return UpdateClubMemberCommentResp.error(errorCode.clubNotExists)
        }
        const adminMember = await ClubMember.getClubMember(targetMember.m.clubShortId, uid)
        if (!adminMember || !adminMember.hasAdminPermission()) {
            return UpdateClubMemberCommentResp.error(errorCode.noPermission)
        }
        targetMember.updateComment(comment)
        await targetMember.save()
        return UpdateClubMemberCommentResp.ok()
    }

    // 解散俱乐部
    async dissolveClub(memberId: string, uid: number): Promise<IDissolveClubResp> {
        const targetMember = await ClubMember.getClubMemberById(memberId)
        if (!targetMember) {
            return DissolveClubResp.error(errorCode.clubNotExists)
        }
        const adminMember = await ClubMember.getClubMember(targetMember.m.clubShortId, uid)
        if (!adminMember || !adminMember.hasAdminPermission()) {
            return DissolveClubResp.error(errorCode.noPermission)
        }
        // 删除俱乐部
        const clubId = targetMember.m.clubId
        const club = await Club.getClubById(clubId)
        await club.remove()
        // 删除所有成员
        await ClubMemberModel.deleteMembersByClubId(clubId)
        return DissolveClubResp.ok()
    }

    // TODO 记录金币操作

    async rename(clubShortId: number, uid: number, newName: string): Promise<IRenameResp> {
        const club = await Club.getClubByShortId(clubShortId)
        if (!club) {
            return RenameResp.error(errorCode.clubNotExists)
        }
        const member = await ClubMember.getClubMember(clubShortId, uid)
        if (!member || !member.isCreator()) {
            // 无权限改名
            return RenameResp.error(errorCode.noPermission)
        }
        club.rename(newName)
        await club.save()
        return RenameResp.ok()
    }

    async transfer(clubShortId: number, toUid: number, fromUid: number): Promise<ITransferResp> {
        const toPlayer = await UserModel.getUserByUid(toUid)
        if (!toPlayer) {
            return {code: errorCode.userNotFound}
        }
        // 转出人
        const fromMember = await ClubMember.getClubMember(clubShortId, fromUid)
        if (!fromMember || !fromMember.isCreator()) {
            // 无权限转移
            return TransferResp.error(errorCode.noPermission)
        }
        // TODO 检查转出人钻石,转入人钻石
        // 不再是创建人
        fromMember.setCreator(false)
        const toMember = await ClubMember.getOrCreateMember(fromMember.m.clubId, fromMember.m.clubShortId, toUid, toPlayer._id)
        toMember.setCreator(true)
        await toMember.save()
        await fromMember.save()
        return TransferResp.ok()
    }

    async addToBlackList(clubShortId: number, uid: number, blockUid: number): Promise<IAddToBlackListResp> {
        const club = await Club.getClubByShortId(clubShortId)
        if (!club) {
            return AddToBlackListResp.error(errorCode.clubNotExists)
        }
        const member = await ClubMember.getClubMember(clubShortId, uid)
        if (!member || !member.hasAdminPermission()) {
            return AddToBlackListResp.error(errorCode.noPermission)
        }
        club.addToBlockList(blockUid)
        await club.save()
        return AddToBlackListResp.ok()
    }

    async removeFromBlackList(clubShortId: number, uid: number, blockUid: number): Promise<IRemoveFromBlackListResp> {
        const club = await Club.getClubByShortId(clubShortId)
        if (!club) {
            return RemoveFromBlackListResp.error(errorCode.clubNotExists)
        }
        const member = await ClubMember.getClubMember(clubShortId, uid)
        if (!member || !member.hasAdminPermission()) {
            return RemoveFromBlackListResp.error(errorCode.noPermission)
        }
        club.removeFromBlockList(blockUid)
        await club.save()
        return RemoveFromBlackListResp.ok()
    }

    // 添加规则
    async addOrUpdateRule(rule: IClubRuleReq, clubShortId: number, uid: number): Promise<IAddOrUpdateRuleResp> {
        const club = await Club.getClubByShortId(clubShortId)
        if (!club) {
            return AddOrUpdateRuleResp.error(errorCode.clubNotExists)
        }
        const member = await ClubMember.getClubMember(clubShortId, uid)
        if (!member || !member.hasAdminPermission()) {
            return AddOrUpdateRuleResp.error(errorCode.noPermission)
        }
        // 新增规则
        const m: IClubRule = {
            name: '',
            kind: 0,
            diamondCost: 0,
            roomSettlementMethod: rule.roomSettlementMethod,
            gameRoomStartType: rule.gameRoomStartType,
            isOwnerPay: rule.isOwnerPay,
            minPlayerCount: rule.minPlayerCount,
            maxPlayerCount: rule.maxPlayerCount,
            maxDrawCount: rule.maxDrawCount,
            clubShortId: clubShortId,
            clubId: club.m._id,
            parameters: rule.parameters
        }
        await ClubRuleModel.addOrUpdateRule(rule.ruleId, m)
        return AddOrUpdateRuleResp.ok()
    }

    async getRules(clubShortId: number, kind: number): Promise<IGetRulesResp> {
        const rules = await ClubRuleModel.findRules(clubShortId, kind)
        const list: IClubRuleInfo[] = []
        for (const r of rules) {
            list.push({
                kind: r.kind,
                diamondCost: r.diamondCost,
                roomSettlementMethod: r.roomSettlementMethod,
                gameRoomStartType: r.gameRoomStartType,
                isOwnerPay: r.isOwnerPay,
                minPlayerCount: r.minPlayerCount,
                maxPlayerCount: r.maxPlayerCount,
                maxDrawCount: r.maxDrawCount,
                clubShortId: r.clubShortId,
                roomId: '',
                parameters: r.parameters
            })
        }
        return GetRulesResp.ok(list)
    }
}

const clubManager = new ClubManager()
export default clubManager
