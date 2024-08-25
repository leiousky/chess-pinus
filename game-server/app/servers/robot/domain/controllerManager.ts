import {Application, cancelJob, scheduleJob} from 'pinus'
import services from '../../../services'
import {gameControlDataModel, IGameControlModel} from '../../../dao/models/gameControlData'
import {inventoryValueExtractRecordModel} from '../../../dao/models/inventoryValueExtractRecord'
import {HydratedDocument} from 'mongoose'
import {GlobalEnum} from '../../../constants/global'

// 库存值衰减间隔
const extractProfitIntervalTime = 60 * 60 * 1000

export class ControllerManager {
    gameControllerDataArr: HydratedDocument<IGameControlModel>[]
    curRobotWinRateList: object
    scheduleTaskExtractProfitId: number

    constructor() {
        this.init()
    }

    init() {
        this.gameControllerDataArr = []
        this.curRobotWinRateList = {}
    }

    async afterStartAll() {
        this.init()
        await this.loadControllerConfig()
    }

    async beforeShutdown() {
        cancelJob(this.scheduleTaskExtractProfitId)
        await this.saveAllGameControllerData()
    }

    async loadControllerConfig() {
        this.gameControllerDataArr = await services.parameter.loadGameController()
        for (const config of this.gameControllerDataArr) {
            this.updateRobotWinRate(config.kind)
        }
        this.scheduleTaskExtractProfitId = scheduleJob({
            start: Date.now() + extractProfitIntervalTime,
            period: extractProfitIntervalTime,
        }, this.scheduleTaskExtractProfit.bind(this))
    }

    updateRobotWinRate(kind: number) {
        const gameControllerData = this.getGameControllerData(kind)
        if (!gameControllerData) return
        let robotWinRateInfo = null
        const robotWinRateArr = gameControllerData.robotWinRateArr
        if (!robotWinRateArr || robotWinRateArr.length === 0) {
            this.curRobotWinRateList[kind] = 0
        }
        let index = robotWinRateArr.length - 1
        for (let i = 0; i < robotWinRateArr.length; ++i) {
            if (!!robotWinRateInfo && robotWinRateInfo.inventoryValue <= robotWinRateArr[i].inventoryValue) continue
            if (robotWinRateArr[i].inventoryValue >= gameControllerData.curInventoryValue) {
                robotWinRateInfo = robotWinRateArr[i]
                index = i
            }
        }
        if (index === 0) {
            this.curRobotWinRateList[kind] = robotWinRateArr[0].winRate
        } else if (index === robotWinRateArr.length - 1) {
            this.curRobotWinRateList[kind] = robotWinRateArr[robotWinRateArr.length - 1].winRate
        } else {
            const min = robotWinRateArr[index - 1]
            const max = robotWinRateArr[index]
            if (max.inventoryValue - min.inventoryValue === 0) {
                this.curRobotWinRateList[kind] = min.winRate
            } else {
                this.curRobotWinRateList[kind] = (max.winRate - min.winRate) / (max.inventoryValue - min.inventoryValue) * (gameControllerData.curInventoryValue - min.inventoryValue) + min.winRate
            }
        }

        console.debug('robotGoldChanged curInventoryValue:' + gameControllerData.curInventoryValue)
        console.debug('robotGoldChanged curRobotWinRate:' + this.curRobotWinRateList[kind] + '，kind:' + kind)
    }

    getGameControllerData(kind: number) {
        for (const key in this.gameControllerDataArr) {
            if (this.gameControllerDataArr[key]) {
                if (this.gameControllerDataArr[key].kind === kind) {
                    return this.gameControllerDataArr[key]
                }
            }
        }
        return null
    }

    async scheduleTaskExtractProfit() {
        for (let i = 0; i < this.gameControllerDataArr.length; ++i) {
            const gameControllerData = this.gameControllerDataArr[i]
            const rate = gameControllerData.extractionRatio
            if (rate <= 0) continue
            const inventoryValue = gameControllerData.curInventoryValue
            if (inventoryValue <= gameControllerData.minInventoryValue) continue
            let count = 0
            if (inventoryValue > 0) {
                count = gameControllerData.curInventoryValue * (rate / 10000)
            } else {
                count = 0
            }
            if (count > 0) {
                await this.robotGoldChanged(gameControllerData.kind, count * -1)
            }
            // 创建抽水记录
            const saveData = {
                kind: gameControllerData.kind,
                count: count,
                leftCount: gameControllerData.curInventoryValue,
                createTime: Date.now()
            }
            await inventoryValueExtractRecordModel.create(saveData)
            // 存储库存值
            await gameControllerData.save()
        }
    }

    getCurRobotWinRate(kind: number) {
        return this.curRobotWinRateList[kind] || 0
    }

    async robotGoldChanged(kind: number, count: number) {
        if (typeof count === 'number') {
            const gameControllerData = this.getGameControllerData(kind)
            if (!gameControllerData) {
                console.error('gameControllerData not find, kind:' + kind)
                return
            }
            gameControllerData.curInventoryValue += count
            await gameControllerData.save()
            this.updateRobotWinRate(kind)
        }
    }

    async updateGameControllerData(kind: number, data: any) {
        const record = await gameControlDataModel.findOneAndUpdate({kind: kind}, data)
        if (record) {
            for (let i = 0; i < this.gameControllerDataArr.length; ++i) {
                if (this.gameControllerDataArr[i].kind === kind) {
                    this.gameControllerDataArr[i] = record
                    break
                }
            }
            this.updateRobotWinRate(kind)
        }
    }

    async addInventoryValue() {
        console.log('addInventoryValue=============')
    }

    async saveAllGameControllerData() {
        for (let i = 0; i < this.gameControllerDataArr.length; ++i) {
            const gameControllerData = this.gameControllerDataArr[i]
            await gameControllerData.save()
        }
    }
}

export async function initControllerManager(app: Application) {
    const mgr = new ControllerManager()
    app.set(GlobalEnum.robotControllerMangerKey, mgr)
}
