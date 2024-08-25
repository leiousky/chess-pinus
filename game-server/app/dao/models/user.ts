import mongoose, {HydratedDocument, Types} from 'mongoose'

export interface IUserModel {
    // 帐号
    account: string
    // 渠道ID
    channelID: string
    // 用户唯一ID
    uid: number
    // 昵称
    nickname: string
    // 性别，男0，女1
    sex: number
    // 头像
    avatar: string
    // 金币
    gold: number
    // 保险柜金币
    safeGold: number
    // 保险柜密码
    safePassword: string
    // 充值总额
    rechargeNum: number
    // 充值次数
    rechargeTimes: number
    // 今日赢金币数量
    todayWinGoldCount: number
    // 帐号权限制
    permission: number
    // 银行卡信息
    bankCardInfo: string
    // 支付宝信息
    aliPayInfo: string
    // 我的推广人员ID
    spreaderID: string
    // 自己业绩
    achievement: number
    // 推广信息
    // 直属会员业绩
    directlyMemberAchievement: number
    // 代理会员业绩
    agentMemberAchievement: number
    // 本周下级代理的佣金
    thisWeekLowerAgentCommision: number
    // 可提现佣金
    realCommision: number
    // 总佣金
    totalCommision: number
    // 下级代理总佣金
    lowerAgentCommision: number
    // 直属会员
    directlyMemberCount: number
    // 本周新增直属会员数量
    weekAddedDirectlyMemberCount: number
    // 本月新增直属会员数量
    monthAddedDirectlyMemberCount: number
    // 代理数量
    agentMemberCount: number
    // 本周新增代理数量
    weekAddedAgentMemberCount: number
    // 本月新增代理数量
    monthAddedAgentMemberCount: number
    // 邮件列表
    emailArr: string
    // 创建时间
    createTime: number
    // 最后登录时间
    lastLoginTime: number
    // 最后登录IP
    lastLoginIp: string
    // 竞技场金币
    arenaCoin: number
    // 竞技场积分
    arenaPoint: number
    // 钻石
    diamond: number
    // 最后登录的网关
    frontendId: string
    // 是否机器人
    robot: boolean
}

// 玩家信息
const schema = new mongoose.Schema<IUserModel>({
    account: {type: String, default: ''},                       // 帐号
    channelID: {type: String, default: '0'},                     // 渠道ID

    uid: {type: Number, default: 0},                           // 用户唯一ID
    nickname: {type: String, default: ''},                      // 昵称
    sex: {type: Number, default: 0},                            // 性别，男0，女1
    avatar: {type: String, default: ''},                        // 头像

    gold: {type: Number, default: 0},                           // 金币
    safeGold: {type: Number, default: 0},                       // 保险柜金币
    safePassword: {type: String, default: ''},                  // 保险柜密码

    rechargeNum: {type: Number, default: 0},                    // 充值总额
    rechargeTimes: {type: Number, default: 0},                  // 充值次数

    todayWinGoldCount: {type: Number, default: 0},              // 今日赢金币数量

    permission: {type: Number, default: 1},                     // 帐号权限制

    // 银行卡信息
    bankCardInfo: {type: String, default: ''},

    // 支付宝信息
    aliPayInfo: {type: String, default: ''},

    spreaderID: {type: String, default: ''},                    // 我的推广人员ID
    achievement: {type: Number, default: 0},                    // 自己业绩
    // 推广信息
    directlyMemberAchievement: {type: Number, default: 0},  // 直属会员业绩
    agentMemberAchievement: {type: Number, default: 0},     // 代理会员业绩
    thisWeekLowerAgentCommision: {type: Number, default: 0},// 本周下级代理的佣金
    realCommision: {type: Number, default: 0},              // 可提现佣金
    totalCommision: {type: Number, default: 0},             // 总佣金
    lowerAgentCommision: {type: Number, default: 0},        // 下级代理总佣金

    directlyMemberCount: {type: Number, default: 0},        // 直属会员
    weekAddedDirectlyMemberCount: {type: Number, default: 0},  // 本周新增直属会员数量
    monthAddedDirectlyMemberCount: {type: Number, default: 0}, // 本月新增直属会员数量

    agentMemberCount: {type: Number, default: 0},           // 代理数量
    weekAddedAgentMemberCount: {type: Number, default: 0},  // 本周新增代理数量
    monthAddedAgentMemberCount: {type: Number, default: 0},  // 本月新增代理数量

    emailArr: {type: String, default: ''},                    // 邮件列表

    createTime: {type: Number, default: 0},                     // 创建时间
    lastLoginTime: {type: Number, default: 0},                // 最后登录时间
    // 最后登录IP
    lastLoginIp: {type: String, default: ''},
    frontendId: {
        type: String,
        default: ''
    },
    robot: {
        type: Boolean,
        default: false,
    },
    // 竞技场金币
    arenaCoin: {
        type: Number,
        default: 0,
    },
    // 竞技场积分
    arenaPoint: {
        type: Number,
        default: 0,
    },
    // 钻石
    diamond: {
        type: Number,
        default: 0,
    },
})

// 玩家信息
export const userModel = mongoose.model<IUserModel>('user', schema)

export class UserModel {
    // 根据 uid 查找用户
    static async getUserByUid(uid: number) {
        return userModel.findOne({uid})
    }

    // 根据id查找
    static async getUserById(pid: Types.ObjectId): Promise<HydratedDocument<IUserModel>> {
        return await userModel.findById(pid)
    }

    // 根据 uid列表获取玩家信息
    static async getUsersByUidList(uidList: number[]) {
        return await userModel.find({uid: {$in: uidList}})
    }

    static async update(uid: number, saveData: any) {
        return await userModel.findOneAndUpdate({uid}, saveData)
    }
}
