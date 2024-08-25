import services from '../../../services'
import {RobotManager} from './robotManager'
import {Application} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {ControllerManager} from './controllerManager'

// 启动
export async function afterStartup(app: Application) {
    await services.parameter.afterAppStartup()
    await (app.get(GlobalEnum.robotControllerMangerKey) as ControllerManager).afterStartAll()
    await (app.get(GlobalEnum.robotMangerKey) as RobotManager).afterStartAll()
}

export async function beforeShutdown(app: Application) {
    await (app.get(GlobalEnum.robotControllerMangerKey) as ControllerManager).beforeShutdown()
    await (app.get(GlobalEnum.robotMangerKey) as RobotManager).beforeShutdown()
}
