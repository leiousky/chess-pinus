import BaseService from './base'
import {IBaseRule, IClubRuleInfo, IGameTypeInfo} from '../types/interfaceApi'

// 转换接口
export default class ApiConvertService extends BaseService {
    constructor() {
        super()
    }

    // 转为俱乐部规则
    toClubRuleInfo(rule: IBaseRule, gameTypeInfo: IGameTypeInfo, roomId: string): IClubRuleInfo {
        return {
            clubShortId: rule.clubShortId,
            diamondCost: rule.diamondCost,
            gameRoomStartType: rule.gameRoomStartType,
            isOwnerPay: rule.isOwnerPay,
            kind: rule.kind,
            maxDrawCount: rule.maxBureau,
            maxPlayerCount: rule.memberCount,
            minPlayerCount: rule.minPlayerCount,
            parameters: gameTypeInfo.parameters,
            roomSettlementMethod: rule.roomSettlementMethod,
            roomId,
        }
    }
}
