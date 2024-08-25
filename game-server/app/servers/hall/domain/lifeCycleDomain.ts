import services from '../../../services'
import {Application} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {MatchManager} from './matchDomain'

// 启动
export async function afterStartup(app: Application): Promise<void> {
    await services.parameter.afterAppStartup()
    await (app.get(GlobalEnum.matchManagerKey) as MatchManager).init()
}

export async function beforeShutdown(app: Application) {
    await (app.get(GlobalEnum.matchManagerKey) as MatchManager).beforeShutdown()
}
