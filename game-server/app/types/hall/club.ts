import {BaseHandlerResp} from '../base'
import {HydratedDocument, Types} from 'mongoose'
import {IClubCoinRecord} from '../../dao/models/clubCoinRecord'
import {IClubRuleInfo} from "../interfaceApi";
import {GameRoomStartType, RoomSettlementMethod} from "../../constants/game";
import errorCode from "../../constants/errorCode";

export interface IAddToBlackListReq {
    // 俱乐部id
    clubShortId: number
    // 黑名单 uid
    blockUid: number
}

export interface IRemoveFromBlackListResp {
    // 错误码
    code: number
    // 消息
    msg: any
}

// 移除黑名单
export class RemoveFromBlackListResp extends BaseHandlerResp {
}

export interface IAddToBlackListResp {
    // 错误码
    code: number
}

// 添加黑名单
export class AddToBlackListResp extends BaseHandlerResp {
}


export interface ITransferReq {
    // 俱乐部id
    clubShortId: number
    // 接收人
    toUid: number
}

export interface ITransferResp {
    // 错误码
    code: number
}

// 转移俱乐部
export class TransferResp extends BaseHandlerResp {
}


export interface IRenameReq {
    // 俱乐部id
    clubShortId: number
    // 接收人
    newName: string
}

export interface IRenameResp {
    // 错误码
    code: number
}

// 俱乐部改名
export class RenameResp extends BaseHandlerResp {
}


export interface IGetClubRoomsReq {
    // 俱乐部id
    clubShortId: number
}

export interface IGetClubRoomsResp {
    // 错误码
    code: number
    // 所有房间列表
    msg: IClubRoomInfo[]
}

export interface IClubRoomInfo {
    // 房间规则
    rule: IClubRuleInfo
    // 玩家信息
    playerList: number[]
}

// 获取俱乐部房间
export class GetClubRoomsResp extends BaseHandlerResp {

    static success(roomList: IClubRoomInfo[]): IGetClubRoomsResp {
        return {
            code: errorCode.ok,
            msg: roomList
        }
    }
}


export interface IDissolveClubReq {
    // 俱乐部成员记录 id
    memberId: string
}

export interface IDissolveClubResp {
    // 错误码
    code: number
}

// 解散俱乐部
export class DissolveClubResp extends BaseHandlerResp {
}


export interface IUpdateClubMemberCommentReq {
    // 成员记录 id
    memberId: string
    // 备注
    comment: string
}

export interface IUpdateClubMemberCommentResp {
    // 错误码
    code: number
}

// 修改成员备注
export class UpdateClubMemberCommentResp extends BaseHandlerResp {
}

export interface IAddClubGoldReq {
    // memberId
    memberId: string
    // 添加的金币
    addGold: number
}

export interface IAddClubGoldResp {
    // 错误码
    code: number
}

// 添加俱乐部游戏币
export class AddClubGoldResp extends BaseHandlerResp {
}

export interface ISetMemberAdminReq {
    // memberId
    memberId: string
    // 是否设为管理员
    isAdmin: boolean
}

export interface ISetMemberAdminResp {
    // 错误码
    code: number
}

// 设为管理员
export class SetMemberAdminResp extends BaseHandlerResp {
}

export interface IGetMembersByClubShortIdReq {
    // 俱乐部id
    clubShortId: number
}

export interface IGetMembersByClubShortIdResp {
    // 错误码
    code: number
    msg: IGetMemberInfo[]
}

export interface IGetMemberInfo {
    // 昵称
    nickname: string
    // 用户id
    uid: number
    // 头像
    avatar: string
    // 成员 id
    memberId: number
    // 备注
    comment: string
    // 金币
    clubGold: number
}

// 获取俱乐部成员
export class GetMembersByClubShortIdResp extends BaseHandlerResp {

    static success(list: IGetMemberInfo[]): IGetMembersByClubShortIdResp {
        return {
            code: errorCode.ok,
            msg: list,
        }
    }
}

export interface IExitClubByAdminReq {
    // 俱乐部成员记录 id
    memberId: string
}

export interface IExitClubByAdminResp {
    // 错误码
    code: number
}

// 管理员踢出俱乐部
export class ExitClubByAdminResp extends BaseHandlerResp {
}


export interface IDeleteClubJoinRequestReq {
    // 申请 id
    requestId: string
}

export interface IDeleteClubJoinRequestResp {
    // 错误码
    code: number
}

// 删除申请
export class DeleteClubJoinRequestResp extends BaseHandlerResp {
}


export interface INewJoinRequestReq {
    // 俱乐部id
    clubShortId: number
}

export interface INewJoinRequestResp {
    // 错误码
    code: number
}

// 申请加入俱乐部
export class NewJoinRequestResp extends BaseHandlerResp {
}


export interface ICreateClubReq {
    // 俱乐部名
    clubName: string
}

export interface ICreateClubResp {
    // 错误码
    code: number
}

// 创建俱乐部
export class CreateClubResp extends BaseHandlerResp {
}


export interface IGetClubRequestListReq {
    // 俱乐部id
    clubShortId: number
}

export interface IGetClubRequestListResp {
    // 错误码
    code: number
    msg: IClubRequestInfo[]
}

export interface IClubRequestInfo {
    playerUid: number
    // 申请时间
    createAt: Date
    // 是否同意申请
    isAgree: boolean
    nickname: string
    // 申请 id
    requestId: string
}

// 俱乐部申请列表
export class GetClubRequestListResp extends BaseHandlerResp {
    static success(list: IClubRequestInfo[]): IGetClubRequestListResp {
        return {
            code: errorCode.ok,
            msg: list,
        }
    }
}


export interface IClubRequestAgreeOrNotReq {
    // 申请 id
    requestId: string
    // 是否同意
    isAgree: boolean
}

export interface IClubRequestAgreeOrNotResp {
    // 错误码
    code: number
}

// 同意或拒绝申请
export class ClubRequestAgreeOrNotResp extends BaseHandlerResp {
}


export interface IQueryClubReq {
    clubShortId: number
}

export interface IQueryClubResp {
    // 错误码
    code: number
}

// 查找俱乐部
export class QueryClubResp extends BaseHandlerResp {
}


export interface ICreateRoomReq {
    // 规则 id
    ruleId: string
    // 俱乐部 id
    clubShortId: number
}

export interface ICreateRoomResp {
    // 错误码
    code: number
}

// 创建俱乐部房间
export class CreateRoomResp extends BaseHandlerResp {
}


export interface IMyClubListReq {
}

export interface IMyClubListResp {
    // 错误码
    code: number
    // 俱乐部信息
    msg: IMyClub[]
}

export interface IMyClub {
    // 俱乐部名
    clubName: string,
    // 总会员人数
    totalMember: number,
    // gold: this.m.clubGold,
    // 俱乐部 id
    clubShortId: number
    // 是否创建人
    isCreator: boolean
    // 是否管理员
    isAdmin: boolean
}

// 我的俱乐部列表
export class MyClubListResp extends BaseHandlerResp {

    static success(list: IMyClub[]): IMyClubListResp {
        return {
            code: errorCode.ok,
            msg: list
        }
    }
}


export interface IGetCoinRecordReq {
    // 俱乐部 shortId
    clubShortId: number
    // 上一页最后一条记录
    lastRecord: string
    // 每页数量
    count: number
}

export interface IGetCoinRecordResp {
    // 错误码
    code: number
    msg: IClubCoinRecordInfo[]
}

export interface IClubCoinRecordInfo {
    // 头像
    avatar: string
    // 昵称
    nickname: string
    // 金币变化
    addCoin: number
    // 操作人 昵称
    operatorNickname: string
    // 操作人 uid
    operatorUid: number
    // 操作时间
    createAt: Date
}

// 获取金币操作记录
export class GetCoinRecordResp extends BaseHandlerResp {

    static success(userMap: object, records: HydratedDocument<IClubCoinRecord>[]): IGetCoinRecordResp {
        const list: IClubCoinRecordInfo[] = []
        for (const record of records) {
            list.push({
                addCoin: record.addCoin,
                createAt: record.createAt,
                avatar: userMap[record.memberUid] && userMap[record.memberUid].avatar || '',
                nickname: userMap[record.memberUid] && userMap[record.memberUid].nickname || '',
                operatorNickname: userMap[record.operatorUid] && userMap[record.operatorUid].nickname || '',
                operatorUid: record.operatorUid,
            })
        }
        return {
            code: errorCode.ok,
            msg: list
        }
    }
}

export interface IClubRuleReq {
    // rule id
    ruleId: string
    // 规则名
    name: string
    // 游戏类型
    kind: number,
    // 钻石房费
    diamondCost: number
    // 房间算分方式
    roomSettlementMethod: RoomSettlementMethod
    // 游戏开始方式
    gameRoomStartType: GameRoomStartType
    // 是否房主支付房费
    isOwnerPay: boolean
    // 最少玩家人数
    minPlayerCount: number
    // 最多玩家人数
    maxPlayerCount: number
    // 最大局数
    maxDrawCount: number
    // 参数
    parameters: {
        // 小盲注
        blindBetCount: number,
        // 底注
        preBetCount: number,
        // 最大筹码
        maxTake: number
    },
}

export interface IAddOrUpdateRuleReq {
    // 规则
    rule: IClubRuleReq
    // 俱乐部 id
    clubShortId: number
}

export interface IAddOrUpdateRuleResp {
    // 错误码
    code: number
    // 消息
    msg: any
}

// 添加更新规则
export class AddOrUpdateRuleResp extends BaseHandlerResp {
}

export interface IDelRuleReq {
    // rule id
    ruleId: string
}

export interface IDelRuleResp {
    // 错误码
    code: number
    // 消息
    msg: any
}

// 删除规则
export class DelRuleResp extends BaseHandlerResp {
}


export interface IGetRulesReq {
    // 俱乐部 id
    clubShortId: number
    // 游戏类型
    kind: number
}

export interface IGetRulesResp {
    // 错误码
    code: number
    // 消息
    msg: IClubRuleInfo[]
}

// 获取所有规则
export class GetRulesResp extends BaseHandlerResp {

    static success(msg: IClubRuleInfo[]): IGetRulesResp {
        return {
            code: errorCode.ok,
            msg,
        }
    }
}
