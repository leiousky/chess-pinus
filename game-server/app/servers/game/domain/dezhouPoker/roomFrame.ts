import {BaseRoomFrame} from '../base/roomFrame'
import {DZGameFrame} from './gameFrame'
import {IBaseRule, IGameRule, IGameTypeInfo} from '../../../../types/interfaceApi'
import {GameRoomStartType, RoomSettlementMethod, RoomType} from '../../../../constants/game'

// 德州房
export class DZRoomFrame extends BaseRoomFrame {
    gameFrameSink: DZGameFrame

    constructor(roomId: string, roomOwnerId: number, gameRule: IGameRule, gameTypeInfo: IGameTypeInfo) {
        let baseRule: IBaseRule
        if (gameRule) {
            baseRule = getBaseRule(gameRule, gameTypeInfo)
        } else {
            // 金豆房默认值
            baseRule = getDefaultDZGoldRule(gameTypeInfo)
        }

        super(roomId, roomOwnerId, baseRule, gameTypeInfo)
    }

    async init(): Promise<void> {
        this.gameFrameSink = new DZGameFrame(this)
    }
}

// 构建rule
function getBaseRule(gameRule: IGameRule, gameTypeInfo: IGameTypeInfo): IBaseRule {
    return {
        chairCount: gameTypeInfo.maxPlayerCount,
        diamondCost: gameRule.diamondCost,
        gameRoomStartType: gameRule.gameRoomStartType,
        goldCost: gameRule.goldCost,
        goldLowerLimit: gameTypeInfo.goldLowerLimit,
        isOwnerPay: gameRule.isOwnerPay,
        kind: gameTypeInfo.kind,
        matchRoom: gameTypeInfo.matchRoom,
        maxBureau: gameTypeInfo.maxDrawCount,
        memberCount: gameTypeInfo.maxPlayerCount,
        minPlayerCount: gameTypeInfo.minPlayerCount,
        roomLevel: gameTypeInfo.level,
        roomSettlementMethod: gameRule.roomSettlementMethod,
        roomType: gameRule.roomType,
        arenaId: gameRule.arenaId,
        clubShortId: gameRule.clubShortId,
        clubRuleId: gameRule.clubRuleId,
    }
}

// 默认德州金豆房规则
function getDefaultDZGoldRule(gameTypeInfo: IGameTypeInfo): IBaseRule {
    return {
        chairCount: gameTypeInfo.maxPlayerCount,
        diamondCost: 0,
        gameRoomStartType: GameRoomStartType.allReady,
        goldCost: 0,
        goldLowerLimit: gameTypeInfo.goldLowerLimit,
        isOwnerPay: false,
        kind: gameTypeInfo.kind,
        matchRoom: gameTypeInfo.matchRoom,
        maxBureau: gameTypeInfo.maxDrawCount,
        memberCount: gameTypeInfo.maxPlayerCount,
        minPlayerCount: gameTypeInfo.minPlayerCount,
        roomLevel: gameTypeInfo.level,
        roomSettlementMethod: RoomSettlementMethod.gold,
        roomType: RoomType.normal,
        arenaId: '',
        clubShortId: 0,
        clubRuleId: '',
    }
}
