import {Application, FrontendSession} from 'pinus'
import errorCode from '../../../constants/errorCode'
import {ArenaManger} from '../domain/manager'
import {GlobalEnum} from '../../../constants/global'

export default function (app: Application) {
    return new Handler(app)
}

// 竞技场服
export class Handler {
    constructor(private app: Application) {

    }

    get arenaManager(): ArenaManger {
        return this.app.get(GlobalEnum.arenaManagerKey)
    }

    /**
     * 竞技场列表
     */
    async list(msg: any, session: FrontendSession) {
        const list = []
        const keys = Object.keys(this.arenaManager.allTasks)
        for (const k of keys) {
            const task = this.arenaManager.allTasks[k]
            list.push(task.toClient())
        }

        return {code: errorCode.ok, msg: list}
    }

    /**
     * 加入竞技场
     */
    async join(msg: any, session: FrontendSession) {
        // 竞技场 id
        const arenaId = msg.arenaId
        const task = this.arenaManager.allTasks[arenaId]
        if (!task) {
            return {code: errorCode.arenaNotExists}
        }
        if (task.isFull()) {
            return {code: errorCode.arenaFull}
        }
        task.joinPlayer(Number(session.uid))
        // TODO save
        // await task.save()
        return {code: errorCode.ok}
    }
}
