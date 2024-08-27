import {Schema, model, Types} from 'mongoose'
import {GameRoomStartType, RoomSettlementMethod} from "../../constants/game";

// 俱乐部规则
export interface IClubRule {
    // 规则名
    name: string
    // 房间类型
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
    // 俱乐部 id
    clubShortId: number
    clubId: Types.ObjectId
    // 参数
    parameters: {
        blindBetCount: number,
        preBetCount: number,
        maxTake: number
    },
}


// 俱乐部规则
const schema = new Schema<IClubRule>({
    name: {
        type: String,
        default: '',
    },
    kind: {
        type: Number,
        default: 0,
    },
    diamondCost: {
        type: Number,
        default: 0,
    },
    roomSettlementMethod: {
        type: Number,
        default: 0,
    },
    gameRoomStartType: {
        type: Number,
        default: 0,
    },
    isOwnerPay: {
        type: Boolean,
        default: false,
    },
    minPlayerCount: {
        type: Number,
        default: 0,
    },
    maxPlayerCount: {
        type: Number,
        default: 0,
    },
    clubShortId: {
        type: Number,
        default: 0,
    },
    clubId: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    parameters: {
        type: Object,
        default: null,
    }
})

// 俱乐部规则
const clubRuleModel = model<IClubRule>('clubRule', schema)

export class ClubRuleModel {

    // 新建规则
    static async addOrUpdateRule(ruleId: string, m: IClubRule) {
        // 更新
        const result = await clubRuleModel.findByIdAndUpdate(ruleId, m)
        if (!result) {
            // 新建
            return await clubRuleModel.create(m)
        }
        return result
    }

    // 获取规则
    static async findRules(clubShortId: number, kind: number) {
        return await clubRuleModel.find({clubShortId, kind})
    }

    // 根据 id 获取规则
    static async getRuleById(ruleId: string) {
        return await clubRuleModel.findById(ruleId)
    }

    // 根据 id 删除
    static async delRuleById(ruleId: string) {
        return await clubRuleModel.findByIdAndDelete(ruleId)
    }
}
