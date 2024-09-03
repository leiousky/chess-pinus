import mongoose, {Schema, model, Types} from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

// 俱乐部成员
export interface IClubMember {
    // 俱乐部名
    clubId: Types.ObjectId
    // 俱乐部成员 id
    memberPlayerId: Types.ObjectId
    // 成员 uid
    memberUid: number
    // 俱乐部金币
    clubGold: number
    // 创建时间
    createAt: Date
    // 俱乐部 shortId
    clubShortId: number
    // 是否创始人
    isCreator: boolean
    // 是否管理员
    isAdmin: boolean
    // 备注
    comment: string
}

// 俱乐部成员
const schema = new Schema<IClubMember>({
    // 俱乐部名
    clubId: {
        type: ObjectId,
        default: null,
    },
    // 俱乐部成员 id
    memberPlayerId: {
        type: ObjectId,
        default: null
    },
    // 成员 uid
    memberUid: {
        type: Number,
        default: 0
    },
    // 俱乐部金币
    clubGold: {
        type: Number,
        default: 0,
    },
    // 创建时间
    createAt: {
        type: Date,
        default: Date.now
    },
    // 俱乐部 shortId
    clubShortId: {
        type: Number,
        default: 0
    },
    // 是否创始人
    isCreator: {
        type: Boolean,
        default: false
    },
    // 是否管理员
    isAdmin: {
        type: Boolean,
        default: false
    },
    comment: {
        type: String,
        default: '',
    }
})

// 俱乐部成员
const clubMemberModel = model<IClubMember>('clubMember', schema)

export class ClubMemberModel {
    // 玩家是否已加入俱乐部
    static async isMemberJoin(clubShortId: number, memberUid: number) {
        const record = await clubMemberModel.findOne({clubShortId, memberUid})
        return !!record
    }

    static async getMemberByClubShortId(clubShortId: number, memberUid: number) {
        return clubMemberModel.findOne({clubShortId, memberUid})
    }

    static async newClubMemberModel(m: IClubMember) {
        return clubMemberModel.create(m)
    }

    // 找本人名下的所有俱乐部
    static async findMemberByUid(uid: number) {
        return clubMemberModel.find({memberUid: uid})
    }

    static async clubMemberCountById(clubId: Types.ObjectId) {
        return await clubMemberModel.countDocuments({_id: clubId})
    }

    static async findMemberByClubShortId(clubShortId: number) {
        return await clubMemberModel.find({clubShortId})
    }

    static async getMemberById(memberId: string) {
        return await clubMemberModel.findById(memberId)
    }

    static async deleteMembersByClubId(clubId: Types.ObjectId) {
        await clubMemberModel.deleteMany({clubId: clubId})
    }

    // 本人创建的俱乐部
    static async getOwnClubMember(uid: number) {
        return clubMemberModel.find({memberUid: uid, isCreator: true})
    }
}
