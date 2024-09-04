import {FrontendOrBackendSession, HandlerCallback, pinus, RouteRecord} from 'pinus'
import {preload} from './preload'
import {disconnectDb, initCounter, initDb} from './app/dao/initDb'
import * as config from './config'
import * as routeUtils from './app/util/routeUtil'
import {newRedisClient} from './app/dao/initRedis'
import {GlobalEnum} from './app/constants/global'
import {initRoomManager} from './app/servers/game/domain/roomManager'
import {initMatchManager} from './app/servers/hall/domain/matchDomain'
import {initControllerManager} from './app/servers/robot/domain/controllerManager'
import {initRobotManager} from './app/servers/robot/domain/robotManager'
import {initArenaManager} from './app/servers/arena/domain/manager'
import errorCode from './app/constants/errorCode'

/**
 *  替换全局Promise
 *  自动解析sourcemap
 *  捕获全局错误
 */
preload()

/**
 * Init app for client.
 */
const app = pinus.createApp()
app.set('name', 'chess')

// 添加 filter
app.set('errorHandler', (err: Error, msg: any, resp: any, session: FrontendOrBackendSession, cb: HandlerCallback) => {
    if (err.message == 'noLogin') {
        // tick失败
        cb(null, {code: errorCode.invalidUser})
    } else {
        // 未知错误
        throw err
    }
})

// 不需要登录
const needNotLogin = {
    'connector.entryHandler.entry': true
}

app.before(async (routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, cb: HandlerCallback) => {
    if (needNotLogin[routeRecord.route]) {
        return cb(null)
    }
    console.log(`received route ${routeRecord.route}, msg ${JSON.stringify(msg)}`)
    if (!session.uid) {
        // 未登录
        cb(new Error('noLogin'))
    } else {
        cb(null)
    }
})

// set route
app.configure('all', async function () {
    app.route('hall', routeUtils.hall)
    app.route('game', routeUtils.game)
    app.route('connector', routeUtils.connector)
})

// app configuration
app.configure('all', 'connector', async function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: config.pinus.heartbeat,
            useDict: true,
            useProtobuf: false
        })
    await initDb()
    await newRedisClient(app)
})

app.configure('all', 'hall', async function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: config.pinus.heartbeat,
            useDict: true,
            useProtobuf: false
        })
    await initDb()
    await newRedisClient(app)
    await initMatchManager(app)
})

app.configure('all', 'center', async function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: config.pinus.heartbeat,
            useDict: true,
            useProtobuf: false
        })
    await initDb()
    await newRedisClient(app)
})

app.configure('all', 'game', async function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: config.pinus.heartbeat,
            useDict: true,
            useProtobuf: false
        })
    await initDb()
    await newRedisClient(app)
    await initRoomManager(app)
})
app.configure('all', 'robot', async function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: config.pinus.heartbeat,
            useDict: true,
            useProtobuf: false
        })
    await initDb()
    await newRedisClient(app)
    await initControllerManager(app)
    await initRobotManager(app)
})

app.configure('all', 'http', async function () {
    await initDb()
    app.loadConfig(GlobalEnum.httpConfKey, require.resolve('./config/servers.json'))
})


app.configure('all', 'arena', async function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: config.pinus.heartbeat,
            useDict: true,
            useProtobuf: false
        })
    await initDb()
    await newRedisClient(app)
    await initArenaManager(app)
})

// master 只有一个
app.configure('all', 'master', async function () {
    // 初始化一次
    await initDb()
    await initCounter()
    await disconnectDb()
})

// start app
app.start()

