import {Application,} from 'pinus'
import services from '../../../services'

export default function (app: Application) {
    return new NotifyRemoter(app)
}

export class NotifyRemoter {
    constructor(private app: Application) {

    }


    async reloadParameterNotify() {
        await services.parameter.afterAppStartup()
    }
}
