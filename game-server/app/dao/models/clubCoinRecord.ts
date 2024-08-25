import {Schema, model, Types} from 'mongoose'

// 俱乐部金币操作
export interface IClubCoinRecord {
    // 俱乐部 id
    clubId: Types.ObjectId
    clubShortId: number
    // 被操作成员 id
    memberPlayerId: Types.ObjectId
    memberUid: number
    // 操作人
    operatorPlayerId: Types.ObjectId
    operatorUid: number
    // 金币变化
    addCoin: number
    // 创建时间
    createAt: Date
}

// 俱乐部金币操作记录
const schema = new Schema<IClubCoinRecord>({
    // 俱乐部名
    clubId: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    clubShortId: {
        type: Number,
        default: 0,
    },
    // 俱乐部成员 id
    memberPlayerId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    // 成员 uid
    memberUid: {
        type: Number,
        default: 0
    },
    operatorPlayerId: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    operatorUid: {
        type: Number,
        default: 0,
    },
    addCoin: {
        type: Number,
        default: 0,
    },
    createAt: {
        type: Date,
        default: new Date(),
    }
})

// 俱乐部金币操作
const clubCoinRecordModel = model<IClubCoinRecord>('clubCoinRecord', schema)

export class ClubCoinRecordModel {
    // 新建记录
    static async addRecord(m: IClubCoinRecord) {
        await clubCoinRecordModel.create(m)
    }

    // 获取记录
    static async getRecord(clubShortId: number, count: number, start?: string,) {
        if (!start || start == '') {
            // 从最新的开始
            return await clubCoinRecordModel.find({clubShortId}).sort({'_id': -1}).limit(count)
        }
        const lastId = new Types.ObjectId(start)
        return await clubCoinRecordModel.find({_id: {$lt: lastId}, clubShortId}).limit(count)
    }
}
