import {HydratedDocument, Types} from 'mongoose'
import {ClubMemberModel, IClubMember} from '../models/clubMember'
import {UserModel} from '../models/user'
import {IGetMemberInfo, IMyClub} from '../../types/hall/club'

export class ClubMember {
    m: HydratedDocument<IClubMember>

    constructor(doc: HydratedDocument<IClubMember>) {
        this.m = doc
    }

    setCreator(trueOrFalse: boolean) {
        this.m.isCreator = trueOrFalse
    }

    setAdmin(trueOrFalse: boolean) {
        this.m.isAdmin = trueOrFalse
    }

    isAdmin() {
        return this.m.isAdmin
    }

    isCreator() {
        return this.m.isCreator
    }

    async save() {
        await this.m.save()
    }

    // 退出
    async remove() {
        await this.m.deleteOne()
    }

    clubInfo(): IMyClub {
        return {
            // 俱乐部名
            clubName: '',
            totalMember: 0,
            // gold: this.m.clubGold,
            clubShortId: this.m.clubShortId,
            isCreator: this.isCreator(),
            isAdmin: this.isAdmin(),
        }
    }

    async memberInfo(): Promise<IGetMemberInfo> {
        const user = await UserModel.getUserById(this.m.memberPlayerId)
        return {
            // 昵称
            nickname: user && user.nickname || '',
            // 用户id
            uid: this.m.memberUid,
            // 头像
            avatar: user && user.avatar || '',
            // 成员 id
            memberId: this.m.id,
            // 备注
            comment: this.m.comment,
            // 金币
            clubGold: this.m.clubGold,
        }
    }

    // 是否有管理员权限
    hasAdminPermission() {
        return this.isAdmin() || this.isCreator()
    }

    // 添加金币
    addClubGold(gold: number) {
        this.m.clubGold += gold
    }

    updateComment(comment: string) {
        this.m.comment = comment
    }

    // 新建成员
    static async getOrCreateMember(clubId: Types.ObjectId, clubShortId: number, memberUid: number, memberPlayerId: Types.ObjectId) {
        let record = await ClubMemberModel.getMemberByClubShortId(clubShortId, memberUid)
        if (record) {
            return new ClubMember(record)
        } else {
            const m: IClubMember = {
                clubId,
                clubShortId,
                memberUid,
                createAt: new Date(),
                clubGold: 0,
                memberPlayerId: memberPlayerId,
                isCreator: false,
                isAdmin: false,
                comment: '',
            }
            record = await ClubMemberModel.newClubMemberModel(m)
            return new ClubMember(record)
        }
    }

    // 获取成员
    static async getClubMember(clubShortId: number, memberUid: number) {
        const record = await ClubMemberModel.getMemberByClubShortId(clubShortId, memberUid)
        if (!record) {
            // 不存在
            return null
        }
        return new ClubMember(record)
    }

    // 本人名下的所有俱乐部
    static async getClubMembersByUid(memberUid: number) {
        const records = await ClubMemberModel.findMemberByUid(memberUid)
        const list: ClubMember[] = []
        for (const r of records) {
            list.push(new ClubMember(r))
        }
        return list
    }

    static async countClubMember(clubIdList: Types.ObjectId[]) {
        const counter = {}
        for (const clubId of clubIdList) {
            counter[clubId.toString()] = await ClubMemberModel.clubMemberCountById(clubId)
        }
        return counter
    }

    // 俱乐部下所有成员
    static async getClubMembersByClubShortId(clubShortId: number) {
        const records = await ClubMemberModel.findMemberByClubShortId(clubShortId)
        if (!records) {
            return []
        }
        const list: ClubMember[] = []
        for (const r of records) {
            list.push(new ClubMember(r))
        }
        return list
    }

    static async getClubMemberById(memberId: string) {
        const record = await ClubMemberModel.getMemberById(memberId)
        if (!record) {
            return null
        }
        return new ClubMember(record)
    }
}
