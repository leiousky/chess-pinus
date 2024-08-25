import {Application, FrontendSession} from 'pinus'
import errorCode from '../../../constants/errorCode'
import {ControllerManager} from '../domain/controllerManager'
import {GlobalEnum} from '../../../constants/global'
import {modifyInventoryValueRecordModel} from '../../../dao/models/modifyInventoryValueRecord'

export default function (app: Application) {
    return new Handler(app)
}

// 机器人管理
export class Handler {
    controllerManager: ControllerManager

    constructor(private app: Application) {
        this.controllerManager = app.get(GlobalEnum.robotControllerMangerKey)
    }

    async getGameControllerData(msg: any, session: FrontendSession) {
        return {
            code: errorCode.ok, msg: {data: this.controllerManager.getGameControllerData(msg.kindID)}
        }
    }

    async modifyInventoryValue(msg: any, session: FrontendSession) {
        if (!msg.kind || (typeof msg.count !== 'number')) {
            return {code: errorCode.invalidRequest}
        }
        const gameControllerData = this.controllerManager.getGameControllerData(msg.kind)
        if (gameControllerData) {
            await this.controllerManager.robotGoldChanged(msg.kind, msg.count)
            const saveData = {
                uid: session.uid,
                kind: msg.kind,
                count: msg.count,
                leftCount: gameControllerData.curInventoryValue,
                createTime: Date.now()
            }
            await modifyInventoryValueRecordModel.create(saveData)
        }
    }
}
