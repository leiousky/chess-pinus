import {PinusWSClient, PinusWSClientEvent} from 'pinus-robot-plugin'

export class Robot {
    constructor() {

    }

    // openid = String(Math.round(Math.random() * 1000));

    pinusClient = new PinusWSClient()
    tick: string

    public connectGate(): void {

        const host = '127.0.0.1'
        const port = '4010'
        this.pinusClient.on(PinusWSClientEvent.EVENT_IO_ERROR, (event) => {
            // 错误处理
            console.error('error', event)
        })
        this.pinusClient.on(PinusWSClientEvent.EVENT_CLOSE, function (event) {
            // 关闭处理
            console.error('close', event)
        })
        this.pinusClient.on(PinusWSClientEvent.EVENT_HEART_BEAT_TIMEOUT, function (event) {
            // 心跳timeout
            console.error('heart beat timeout', event)
        })
        this.pinusClient.on(PinusWSClientEvent.EVENT_KICK, function (event) {
            // 踢出
            console.error('kick', event)
        })

        // this.actor.emit("incr" , "gateConnReq");
        // this.actor.emit('start' , 'gateConn' , this.actor.id);
        this.pinusClient.init({
            host: host,
            port: port
        }, () => {
            // this.actor.emit('end' , 'gateConn' , this.actor.id);
            // 连接成功执行函数
            console.log('gate连接成功')
            this.sayHello()
        })
    }

    sayHello(): void {
        this.pinusClient.request('connector.entryHandler.entry', 'robot', (result: {
            code: number,
            msg: string,
            hello: string,
        }) => {
            // 消息回调
            console.log('entry 返回', JSON.stringify(result))
            // this.actor.emit('end' , 'gateQuery' , this.actor.id);
            // this.pinusClient.disconnect()
        })
    }

    // gateQuery() {
    //     // this.actor.emit("incr" , "gateQueryReq");
    //     // this.actor.emit('start' , 'gateQuery' , this.actor.id);
    //     // 区服 id
    //     const loginReq = {'account': 'cc', 'token': 'cc', 'areaId': 1}
    //     this.pinusClient.request('gate.gateHandler.queryEntry', loginReq, (result: {
    //         code: number,
    //         host: string,
    //         port: number
    //     }) => {
    //         // 消息回调
    //         console.log('gate返回', JSON.stringify(result))
    //         // this.actor.emit('end' , 'gateQuery' , this.actor.id);
    //         this.pinusClient.disconnect()
    //         this.connectToConnector(result)
    //     })
    // }

    // connectToConnector(result: { host: string, port: number }) {
    //     // this.actor.emit("incr" , "loginConnReq");
    //     // this.actor.emit('start' , 'loginConn' , this.actor.id);
    //     this.pinusClient.init({
    //         host: result.host,
    //         port: result.port
    //     }, () => {
    //         // this.actor.emit('end' , 'loginConn' , this.actor.id);
    //         // 连接成功执行函数
    //         console.log('connector连接成功')
    //         // connector.userHandler.getUserList：{"uid":"cc"}
    //         this.getUserQuery({uid: 'cc'})
    //     })
    // }

    // getUserQuery(result: { uid: string }) {
    //
    //     // this.actor.emit("incr" , "loginQueryReq");
    //     // this.actor.emit('start' , 'loginQuery' , this.actor.id);
    //     // 查找用户信息
    //     this.pinusClient.request('connector.userHandler.getUserList', result, (ret: any) => {
    //         // 消息回调
    //         // this.actor.emit('end' , 'loginQuery' , this.actor.id);
    //         // console.log('loginQuery 返回', JSON.stringify(ret));
    //         if (ret.code == 20 && ret.userArr.length > 0) {
    //             // 选择用户
    //             this.getTick(result.uid, ret.userArr[0].userID)
    //         } else {
    //             console.log('no user', JSON.stringify(ret))
    //         }
    //     })
    // }

    // 生成 tick
    // getTick(uid: string, userId: number) {
    //     this.pinusClient.request('connector.userHandler.getTick', {platform: 0, uid, userId}, (ret: any) => {
    //         // 消息回调
    //         // this.actor.emit('end' , 'loginQuery' , this.actor.id);
    //         // console.log('getTick 返回', JSON.stringify(ret));
    //         if (ret.code == 20) {
    //             // 选择用户
    //             this.tick = ret.tick
    //             this.login(ret.userId)
    //         } else {
    //             console.log('no tick', JSON.stringify(ret))
    //         }
    //         // TODO heartbreak
    //     })
    // }

    // login(userId: number) {
    //     this.pinusClient.request('connector.userHandler.login', {userId, tick: this.tick}, (ret: any) => {
    //         // 消息回调
    //         console.log('login 返回', JSON.stringify(ret))
    //         // if (ret.code == 20) {
    //         //     // 选择用户
    //         //     this.tick = ret.tick
    //         //     this.login(ret.userId)
    //         // } else {
    //         //     console.log('no tick', JSON.stringify(ret))
    //         // }
    //     })
    // }
}

export default function () {
    const client = new Robot()
    client.connectGate()
    return client
}
