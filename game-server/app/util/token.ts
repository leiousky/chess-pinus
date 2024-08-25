import {createCipheriv, createDecipheriv, createHash} from 'crypto'
import * as config from '../../config'

// 生成 16 bytes 的 iv
const iv = Buffer.from(createHash('sha256').update(config.game.tokenIv).digest('base64').slice(0, 16), 'utf8')
// 生成 32 bytes 的 key
const key = Buffer.from(createHash('sha256').update(config.game.tokenPwd).digest('base64').slice(0, 32), 'utf8')

export function createToken(uid: number, serverId: string) {
    const msg = Date.now() + '|' + uid + '|' + serverId
    const cipher = createCipheriv('aes256', key, iv)
    let enc = cipher.update(msg, 'utf8', 'hex')
    enc += cipher.final('hex')
    return enc
}

export function parseToken(token: string) {
    const decipher = createDecipheriv('aes256', key, iv)
    let dec: string
    try {
        dec = decipher.update(token, 'hex', 'utf8')
        dec += decipher.final('utf8')
    } catch (err) {
        console.error('[token] fail to decrypt token. %j', token)
        return null
    }
    const ts = dec.split('|')
    if (ts.length !== 3) {
        return null
    }
    return {uid: Number(ts[1]), serverID: ts[2], timeKey: Number(ts[0])}
}

export function checkToken(authInfo: { serverID: string; timeKey: number; uid: number }) {
    if (!authInfo || !authInfo.serverID || !authInfo.timeKey || !authInfo.uid) {
        return false
    }
    const nowTime = Date.now()
    return ((nowTime - authInfo.timeKey) < config.game.tokenUsefulTime)
}
