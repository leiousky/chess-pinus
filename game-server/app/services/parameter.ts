import BaseService from './base'
import * as defaultParameters from '../../config/publicParameter'
import * as defaultGameTypes from '../../config/gameTypes'
import * as defaultProfit from '../../config/profit'
import * as defaultGameController from '../../config/gameController'
import {IPublicParameterModel, publicParameterModel} from '../dao/models/publicParameter'
import {pinus} from 'pinus'
import {GlobalEnum} from '../constants/global'
import {gameTypeModel} from '../dao/models/gameType'
import services from './index'
import {agentProfitModel} from '../dao/models/agentProfit'
import {HydratedDocument} from 'mongoose'
import {gameControlDataModel} from '../dao/models/gameControlData'
import {IGameConfig, IGameTypeInfo} from '../types/interfaceApi'
import {RoomType} from '../constants/game'
import {ClubConfigModel} from "../dao/models/clubConfig";

// 加载配置
export default class ParameterService extends BaseService {
    constructor() {
        super()
    }

    // 启动后加载配置
    async afterAppStartup() {
        await this.loadPublicParameter()
        await this.loadGameTypes()
        await this.loadAgentProfit()
        await this.loadGameConfig()
    }

    // 载入配置
    async loadPublicParameter() {
        const records = await publicParameterModel.find()
        const isSave = pinus.app.getServerId() == 'center'
        const recordMap = this.services.utils.modelArrayToMap(records, 'key')
        const publicParameters = {}
        for (const key in defaultParameters) {
            if (recordMap[key]) {
                // 有，使用数据库的值
                publicParameters[key] = this.parseParameter(recordMap[key])
            } else {
                if (isSave) {
                    // 保存
                    await publicParameterModel.create({
                        key: key,
                        value: defaultParameters[key].value.toString(),
                        describe: defaultParameters[key].describe,
                        type: defaultParameters[key].type,
                    })
                }
                publicParameters[key] = defaultParameters[key].value
            }
        }
        pinus.app.set(GlobalEnum.publicParameterKey, publicParameters)
    }

    // 加载游戏类型
    async loadGameTypes() {
        const isSave = pinus.app.getServerId() == 'center'
        const records = await gameTypeModel.find()
        if (records.length == 0) {
            const gameTypes = defaultGameTypes.slice()
            const gameTypeInfos: IGameTypeInfo[] = []
            // 保存的记录
            const newRecords = []
            for (let i = 0; i < gameTypes.length; i++) {
                const newGameTypeInfo = this.fromJsGameTypeInfo(gameTypes[i])
                gameTypeInfos.push(newGameTypeInfo)
                newRecords.push(newGameTypeInfo)
            }
            if (isSave) {
                // 写入数据库
                await gameTypeModel.insertMany(newRecords)
            }
            pinus.app.set(GlobalEnum.gameTypesKey, gameTypeInfos)
        } else {
            const gameTypeInfos: IGameTypeInfo[] = []
            for (let i = 0; i < records.length; i++) {
                const newGameTypeInfo = this.fromMongoGameTypeInfo(records[i])
                gameTypeInfos.push(newGameTypeInfo)
            }
            pinus.app.set(GlobalEnum.gameTypesKey, gameTypeInfos)
        }
    }

    // 加载 profit
    async loadAgentProfit() {
        const isSave = pinus.app.getServerId() == 'center'
        const records = await agentProfitModel.find()
        if (records.length == 0) {
            // 没记录，加载默认配置
            const profits = defaultProfit.slice()
            let profit: any
            for (let i = 0; i < profits.length; i++) {
                profit = profits[i]
                profit.index = this.services.utils.getUniqueIndex()
            }
            if (isSave) {
                // 写入数据库
                await agentProfitModel.insertMany(profits)
            }
            pinus.app.set(GlobalEnum.agentProfitKey, profits)
        } else {
            pinus.app.set(GlobalEnum.agentProfitKey, records)
        }
    }

    // 获取返回给客户端的配置
    buildClientParameter(publicParameter: any) {
        const showKeyArr = {
            platformTip: true,
            loopBroadcastContent: true,
            minKeepGold: true,
            minWithdrawCash: true,
            minRechargeCount: true,
            oneRMBToGold: true,
            offlineRechargeOwnerName: true,
            offlineRechargeBankName: true,
            offlineRechargeBankCardNum: true,
            rechargeService: true,
            shopItems: true,
            withdrawCashBillPercentage: true,
            rechargeConfig: true
        }
        const clientParameter = {}
        for (const key in publicParameter) {
            if (publicParameter[key]) {
                if (showKeyArr[key]) {
                    clientParameter[key] = publicParameter[key]
                }
            }
        }
        return clientParameter
    }

    parseParameter(record: HydratedDocument<IPublicParameterModel>) {
        switch (record.type) {
            case 'number':
                return Number(record.value)
            case 'boolean':
                return record.value === 'true'
            case 'json':
                return JSON.parse(record.value)
            case 'string':
                return record.value
            default:
                console.error('unknown public parameter type', record.type)
                return record.value
        }
    }

    async loadGameController() {
        const records = await gameControlDataModel.find()
        if (records.length == 0) {
            // 没记录，加载默认配置
            // 写入数据库
            await gameControlDataModel.insertMany(defaultGameController)
            // 重新查找 model
            return gameControlDataModel.find()
        } else {
            return records
        }
    }

    // 给客户端的消息
    clientGameTypes() {
        const gameTypes = pinus.app.get(GlobalEnum.gameTypesKey)
        return gameTypes.map((gameType: IGameTypeInfo) => {
            return this.toClientGameTypeInfo(gameType)
        })
    }

    // 根据 id 获取  gameType
    getGameTypeInfoById(gameTypeId: string): IGameTypeInfo {
        const gameTypes = pinus.app.get(GlobalEnum.gameTypesKey)
        const list = gameTypes.filter((gameType: IGameTypeInfo) => {
            return gameType.gameTypeID == gameTypeId
        })
        if (list.length == 1) {
            return list[0]
        }
        return null
    }

    fromMongoGameTypeInfo(model: HydratedDocument<IGameTypeInfo>): IGameTypeInfo {
        return {
            baseScore: model.baseScore,
            expenses: model.expenses,
            gameTypeID: model.gameTypeID,
            goldLowerLimit: model.goldLowerLimit,
            goldUpper: model.goldUpper,
            hundred: model.hundred,
            kind: model.kind,
            level: model.level,
            matchRoom: model.matchRoom,
            maxDrawCount: model.maxDrawCount,
            maxPlayerCount: model.maxPlayerCount,
            maxRobotCount: model.maxRobotCount,
            minPlayerCount: model.minPlayerCount,
            minRobotCount: model.minRobotCount,
            parameters: model.parameters,
            roomType: RoomType.normal,
        }
    }

    fromJsGameTypeInfo(gameTypeInfo: IGameTypeInfo) {
        if (!gameTypeInfo.gameTypeID) {
            gameTypeInfo.gameTypeID = services.utils.getUniqueIndex()
        }
        return gameTypeInfo
    }


    toClientGameTypeInfo(gameTypeInfo: IGameTypeInfo) {
        const obj = services.utils.deepClone(gameTypeInfo)
        obj.parameters = JSON.stringify(obj.parameters)
        return obj
    }

    // 加载配置
    async loadGameConfig(): Promise<IGameConfig> {
        const config: IGameConfig = {
            club: {drawCountOpts: [], playerCountOpts: [], roomDiamond: 0}
        }
        config.club = await ClubConfigModel.getClubConfig()
        pinus.app.set(GlobalEnum.gameConfigKey, config)
        return config
    }

}
