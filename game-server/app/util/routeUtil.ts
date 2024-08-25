import {dispatch} from './dispatcher'
import {Session, Application} from 'pinus'

// 大厅
export function hall(session: Session, msg: any, app: Application, cb: (err: Error, serverId ?: string) => void) {
    const serverInfos = app.getServersByType('hall')

    if (!serverInfos || serverInfos.length === 0) {
        cb(new Error('can not find hall servers.'))
        return
    }
    const uid = session.uid
    if (!uid) {
        cb(new Error('login please'))
        return
    }
    const res = dispatch(uid, serverInfos)
    cb(null, res.id)
}

// game
export function game(session: Session, msg: any, app: Application, cb: (err: Error, serverId ?: string) => void) {
    const roomId = session.get('roomId')
    if (!roomId) {
        cb(new Error('room dismiss'))
        return
    }

    const serverInfos = app.getServersByType('game')
    if (!serverInfos || serverInfos.length === 0) {
        cb(new Error('can not find game servers.'))
        return
    }
    const res = dispatch(roomId, serverInfos)
    cb(null, res.id)
}

// 上次有登录，还是走上次登录的 connector
// connector
export function connector(session: Session, msg: any, app: Application, cb: (err: Error, serverId ?: string) => void) {
    if (!session || !session.frontendId) {
        cb(new Error('no session'))
        return
    }
    cb(null, session.frontendId)
}
