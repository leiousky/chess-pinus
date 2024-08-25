import services from '../../../services'
import {Application} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {RoomManager} from './roomManager'

// 启动
export async function afterStartup() {
    await services.parameter.afterAppStartup()
}

export async function beforeShutdown(app: Application): Promise<void> {
    (app.get(GlobalEnum.roomManagerKey) as RoomManager).beforeShutdown()
}
