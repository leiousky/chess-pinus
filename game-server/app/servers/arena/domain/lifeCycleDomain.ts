import services from '../../../services'
import {Application} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {ArenaManger} from './manager'

// 启动
export async function afterStartup(app: Application) {
    await services.parameter.afterAppStartup()
    const mgr = (app.get(GlobalEnum.arenaManagerKey) as ArenaManger)
    mgr.afterStartAll()
}

// 关闭
export async function beforeShutdown(app: Application) {
    const mgr = (app.get(GlobalEnum.arenaManagerKey) as ArenaManger)
    mgr.beforeShutdown()
}
