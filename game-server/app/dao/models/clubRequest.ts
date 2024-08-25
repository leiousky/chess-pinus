import mongoose, {Schema, model} from 'mongoose'

const ObjectId = mongoose.Schema.Types.ObjectId

// 俱乐部请求
export interface IClubRequest {
    // 申请的俱乐部 shortId
    clubShortId: number
    // 申请人 uid
    playerUid: number
    // 申请人 playerId
    playerId: mongoose.Types.ObjectId
    // 申请时间
    createAt: Date
    // 是否同意申请
    isAgree: boolean
}

// 俱乐部请求
const schema = new Schema<IClubRequest>({
    // 申请的俱乐部 shortId
    clubShortId: {
        type: Number,
        default: 0
    },
    // 申请人 uid
    playerUid: {
        type: Number,
        default: 0,
    },
    // 申请人 playerId
    playerId: {
        type: ObjectId,
        default: null,
    },
    // 申请时间
    createAt: {
        type: Date,
        default: Date.now,
    },
    // 是否同意申请
    isAgree: {
        type: Boolean,
        default: false,
    }
})

// 俱乐部请求
const clubRequestModel = model<IClubRequest>('clubRequest', schema)

// 处理mongo
export class ClubRequestModel {
    static async getRequest(clubShortId: number, playerUid: number) {
        return clubRequestModel.findOne({clubShortId, playerUid})
    }

    static async getRequestById(reqId: string) {
        return clubRequestModel.findById(reqId)
    }
    // 新请求
    static async newRequestModel(m: IClubRequest) {
        return clubRequestModel.create(m)
    }

    // 根据 id 查找申请
    static async findRequestByClubShortId(clubShortId: number) {
        return await clubRequestModel.find({clubShortId})
    }
}
