import {Schema, model, Types} from 'mongoose'

// 俱乐部
export interface IClub {
    // 俱乐部名
    name: string
    // 俱乐部创建人 uid
    creatorUid: number
    // 俱乐部创建人 id
    creatorId: Types.ObjectId
    // 创建时间
    createAt: Date
    // 俱乐部 shortId
    clubShortId: number
    // 黑名单列表
    blockList: number[]
}

// 俱乐部
const schema = new Schema<IClub>({
    // 俱乐部名
    name: {
        type: String,
        default: ''
    },
    // 俱乐部创建人 uid
    creatorUid: {
        type: Number,
        default: 0
    },
    // 俱乐部创建人 id
    creatorId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    // 创建时间
    createAt: {
        type: Date,
        default: Date.now,
    },
    // 俱乐部 shortId
    clubShortId: {
        type: Number,
        default: 0
    },
    // 黑名单
    blockList: {
        type: [Number],
        default: []
    },
})

// 俱乐部
const clubModel = model<IClub>('club', schema)

export class ClubModel {
    // 根据shortId 查找
    static async getClubByShortId(clubShortId: number) {
        return await clubModel.findOne({clubShortId})
    }

    static async newClubModel(m: IClub) {
        return await clubModel.create(m)
    }

    static async getClubByIdList(clubIdList: Types.ObjectId[]) {
        return await clubModel.find({_id: {$in: clubIdList}})
    }

    static async getClubById(clubId: Types.ObjectId) {
        return await clubModel.findById(clubId)
    }
}

