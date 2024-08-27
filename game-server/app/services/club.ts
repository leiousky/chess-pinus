import BaseService from './base'
import {IClubRuleReq} from "../types/hall/club";
import {GameType} from "../constants/game";

export default class ClubService extends BaseService {
    constructor() {
        super()
    }

    // 检查规则是否合法
    isRuleValid(clubRule: IClubRuleReq): boolean {
        if (!clubRule.kind) {
            // 没有游戏类型
            return false
        }
        if (clubRule.kind == GameType.DZ) {
            // 德州
            if (clubRule.maxPlayerCount > 9 || clubRule.minPlayerCount < 2) {
                // 人数不对
                return false
            }
            if (clubRule.maxDrawCount < 0) {
                // 局数不对
                return false
            }
        }
        // TODO 非德州
        return true
    }
}
