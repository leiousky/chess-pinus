import {Application} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {ControllerManager} from '../domain/controllerManager'
import errorCode from '../../../constants/errorCode'
import {modifyInventoryValueRecordModel} from '../../../dao/models/modifyInventoryValueRecord'

export default function (app: Application) {
    return new ControllerRemoter(app)
}

export class ControllerRemoter {
    // controllerManager: ControllerManager

    constructor(private app: Application) {
    }

    get controllerManager(): ControllerManager {
        return this.app.get(GlobalEnum.robotControllerMangerKey)
    }

    async getCurRobotWinRate(kind: number): Promise<number> {
        return this.controllerManager.getCurRobotWinRate(kind)
    }

    async robotGoldChanged(kind: number, count: number) {
        await this.controllerManager.robotGoldChanged(kind, count)
    }

    async getGameControllerData(kindId: number) {
        return this.controllerManager.getGameControllerData(kindId)
    }

    async updateGameControllerData(kind: number, data: any) {
        await this.controllerManager.updateGameControllerData(kind, data)
    }

    async modifyInventoryValue(uid: number, kind: number, count: number) {
        if (!kind || (typeof count !== 'number')) {
            return {code: errorCode.invalidRequest}
        }
        const gameControllerData = this.controllerManager.getGameControllerData(kind)
        if (gameControllerData) {
            await this.controllerManager.robotGoldChanged(kind, count)
            const saveData = {
                uid: uid,
                kind: kind,
                count: count,
                leftCount: gameControllerData.curInventoryValue,
                createTime: Date.now()
            }
            await modifyInventoryValueRecordModel.create(saveData)
        }
    }
}
