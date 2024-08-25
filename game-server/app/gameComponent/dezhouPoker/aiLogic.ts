import services from '../../services'
import {DZCardType, DZPush} from './DZProto'

enum operationType {
    PASS_OR_GIVE_UP = 0,
    FLOW = 1,
    ADD_BET = 2,
    ALL_IN = 3,
}

// 弃/过牌、跟注、加注、alli
const operationRate = {}
operationRate[DZCardType.SINGLE] = [0.3, 0.6, 0.1, 0]
operationRate[DZCardType.ONE_DOUBLE] = [0.2, 0.7, 0.1, 0]
operationRate[DZCardType.TWO_DOUBLE] = [0.1, 0.8, 0.1, 0]
operationRate[DZCardType.THREE] = [0, 0.9, 0.1, 0]
operationRate[DZCardType.SHUN_ZI] = [0, 0.7, 0.3, 0]
operationRate[DZCardType.TONG_HUA] = [0, 0.4, 0.5, 0.1]
operationRate[DZCardType.HU_LU] = [0, 0.4, 0.5, 0.1]
operationRate[DZCardType.TIE_ZHI] = [0, 0.2, 0.7, 0.1]
operationRate[DZCardType.TONG_HUA_SHUN] = [0, 0.2, 0.7, 0.1]
operationRate[DZCardType.KING_TONG_HUA_SHUN] = [0, 0.2, 0.7, 0.1]

//let maxFlowCountArr = [0, 20, 50, 100, 150, 200, 300, 10000000000, 10000000000, 10000000000, 10000000000];
const maxFlowCountArr = [0, 50, 100, 200, 200, 500, 1000, 10000000000, 10000000000, 10000000000, 10000000000]

export class AiLogic {
    static getOperationResult(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID) {
        let operationRateArr: number[]
        if (isMaxChairID) {
            operationRateArr = [0, 0.5, 0.4, 0.1]
        } else {
            operationRateArr = operationRate[maxCardType]
        }
        let rand = services.utils.getRandomNum(0, 100)
        let type = 0
        for (let i = 0; i < operationRateArr.length; ++i) {
            if (rand <= operationRateArr[i] * 100) {
                type = i
                break
            } else {
                rand -= (operationRateArr[i] * 100)
            }
        }
        if (type === operationType.PASS_OR_GIVE_UP) {
            return AiLogic.userPassOrGiveUp(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
        } else if (type === operationType.FLOW) {
            return AiLogic.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
        } else if (type === operationType.ADD_BET) {
            return AiLogic.userAddBet(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
        } else if (type === operationType.ALL_IN) {
            return AiLogic.userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
        } else {
            console.error('getOperationResult err')
            console.error('rand', rand)
            console.error('maxCardType', maxCardType)
            console.error('operationRateArr', operationRateArr)
            console.error('type', type)
            return AiLogic.getOperationResult(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
        }
    }

    static userPassOrGiveUp(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID) {
        // 需要跟注则弃牌，不需跟注接过牌
        if (curTurnBetCount < maxBetCount) {
            if (isMaxChairID) {
                return AiLogic.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
            } else {
                return DZPush.gameUserGiveUpNotify()
            }
        } else {
            return DZPush.gameUserBetNotify(0)
        }
    }

    static userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID) {
        // 判断是否已经超过下注上限,未超过则加注，已超过，则跟注或者弃牌
        if (curTurnBetCount < maxBetCount) {
            const shouldBetCount = maxBetCount - curTurnBetCount
            // 牌最大的玩家，金币不足则allin,金币足够则跟注
            if (isMaxChairID) {
                if (shouldBetCount >= leftCount) {
                    return AiLogic.userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
                } else {
                    return DZPush.gameUserBetNotify(maxBetCount - curTurnBetCount)
                }
            } else {
                // 判断金币是否足够，而且是否超出最大下注金币限制，金币不足则弃牌
                const maxLimitBetCount = bigBlindCount * maxFlowCountArr[maxCardType]
                if (shouldBetCount + totalBetCount > maxLimitBetCount || shouldBetCount > leftCount) {
                    return DZPush.gameUserGiveUpNotify()
                } else {
                    if (shouldBetCount >= leftCount) {
                        return AiLogic.userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
                    } else {
                        return DZPush.gameUserBetNotify(maxBetCount - curTurnBetCount)
                    }
                }
            }
        } else {
            return DZPush.gameUserBetNotify(0)
        }
    }

    static userAddBet(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID) {
        const minLimitBetCount = bigBlindCount + maxBetCount - curTurnBetCount
        // 如果金币不足最小下注金额， 则改为跟注
        if (minLimitBetCount > leftCount) {
            return AiLogic.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
        } else {
            // 计算最大下注金额
            const maxLimitBetCount = bigBlindCount * maxFlowCountArr[maxCardType]
            const maxCount = leftCount > (maxLimitBetCount - totalBetCount) ? (maxLimitBetCount - totalBetCount) : leftCount
            // 如果最大下注金额小于最小下注限制，则改为跟注
            if (maxCount < minLimitBetCount) {
                return AiLogic.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
            } else {
                // 金币足够，则加注金额为最大下注金额和最小下注金额的随机值
                const betCount = minLimitBetCount + services.utils.keepNumberPoint(Math.random() * (maxCount - minLimitBetCount), 2)
                return DZPush.gameUserBetNotify(betCount)
            }
        }
    }

    static userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID) {
        if (isMaxChairID) {
            return DZPush.gameUserBetNotify(-1)
        } else {
            // 计算allin金额是否超过了最大金额限制，如果超过，则用户改为加注
            const maxLimitBetCount = bigBlindCount * maxFlowCountArr[maxCardType]
            if (leftCount + totalBetCount > maxLimitBetCount) {
                return AiLogic.userAddBet(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID)
            } else {
                return DZPush.gameUserBetNotify(-1)
            }
        }
    }
}
