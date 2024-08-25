import {Application} from 'pinus'
import {GateManager} from '../domain/manager'

export default function (app: Application) {
    return new GateRemoter(app)
}

export class GateRemoter {
    constructor(private app: Application) {

    }

    async userLeaveRoom(uid: string) {
        await GateManager.userLeaveRoom(uid)
    }

    async userEntryRoom(uid: string, roomId: string) {
        await GateManager.userEntryRoom(uid, roomId)
    }
}
