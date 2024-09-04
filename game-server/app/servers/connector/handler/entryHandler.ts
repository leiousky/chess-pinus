import {Application, FrontendSession} from 'pinus'
import errorCode from '../../../constants/errorCode'
import {checkToken, parseToken} from '../../../util/token'
import {EntryResp, UserInfo} from '../../../types/connector/entry'
import {GateManager} from '../domain/manager'

export default function (app: Application) {
    return new Handler(app)
}

// 网关入口
export class Handler {
    constructor(private app: Application) {

    }

    /**
     * 登录大厅
     */
    async entry(msg: any, session: FrontendSession): Promise<EntryResp> {
        // token
        const token: string = msg.token
        // 用户信息
        const userInfo: UserInfo = msg.userInfo
        if (!token) {
            return EntryResp.error(errorCode.systemErr)
        }
        const authInfo = parseToken(token)
        if (!checkToken(authInfo)) {
            return EntryResp.error(errorCode.invalidToken)
        }
        const uid = authInfo.uid
        if (session.uid) {
            // 下线旧用户
            this.app.get('sessionService').kick(uid.toString())
        }
        session.on('closed', GateManager.onUserLeave)
        // 绑定新账号
        const err = await session.abind(uid.toString())
        if (err) {
            // 绑定用户失败
            console.error('bind uid to session fail', err)
            return GateManager.onBindUidFail()
        }
        // session.set('uid', uid)
        return GateManager.onBindUidSuccess(session, uid, userInfo)
    }
}
