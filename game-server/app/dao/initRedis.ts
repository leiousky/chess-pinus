import {createClient} from 'redis'
import * as config from '../../config'
import * as util from 'util'
import {Application} from 'pinus'
import {GlobalEnum} from '../constants/global'
import Redis from 'ioredis'

export async function newRedisClient(app: Application) {
    const client = await newIoRedisClient()
    app.set(GlobalEnum.redisLocalKey, client)
}

// https://github.com/redis/node-redis
export async function newNodeRedisClient() {
    // redis[s]://[[username][:password]@][host][:port][/db-number]
    return createClient({url: getRedisUrl()})
}

// 使用 io redis 库
// https://github.com/redis/ioredis
export async function newIoRedisClient() {
    return new Redis({
        host: config.redis.host,
        port: config.redis.port,
    })
}

function getRedisUrl() {
    let url: string
    const redisConf = config.redis
    if (redisConf.username && redisConf.password) {
        url = util.format('redis://%s:%s@%s:%s', redisConf.username, redisConf.password, redisConf.host, redisConf.port)
    } else {
        url = util.format('redis://%s:%s', redisConf.host, redisConf.port)
    }
    return url
}
