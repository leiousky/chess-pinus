import {Application} from 'pinus'
import {RobotManager} from '../domain/robotManager'
import {GlobalEnum} from '../../../constants/global'
import {IGameTypeInfo} from '../../../types/interfaceApi'

export default function (app: Application) {
    return new RobotRemoter(app)
}

export class RobotRemoter {
    // robotMgr: RobotManager

    constructor(private app: Application) {

    }

    get robotMgr(): RobotManager {
        return this.app.get(GlobalEnum.robotMangerKey)
    }

    // 离开房间
    async robotLeaveRoomNotify(kind: number, uidArr: number[]) {
        await this.robotMgr.robotLeaveRoomNotify(kind, uidArr)
    }

    // 请求添加机器人
    async requestRobotNotify(roomId: string, gameTypeInfo: IGameTypeInfo, robotCount: number) {
        await this.robotMgr.requestRobotNotify(roomId, gameTypeInfo, robotCount)
    }

    async gameTypesUpdateNotify(gameTypes: any) {
        console.log(`gameTypesUpdateNotify: ${JSON.stringify(gameTypes)}`)
    }

    // 获取新机器人
    async getIdleRobot() {
        return this.robotMgr.newIdleRobot()
    }
}
