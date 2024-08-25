// 默认配置
module.exports = {
    mongo: {
        host: 'localhost',
        port: 27017,
        database: 'chess',
        user: '',
        password: ''
    },
    redis: {
        port: 6379,
        host: 'localhost',
        password: '',
        username: '',
    },
    // 开发模式
    debug: false,
    // 框架配置
    pinus: {
        // 心跳包时间
        heartbeat: 30,
    },
    // id计数器
    idCounter: [
        {
            // 俱乐部 id
            name: 'club',
            starter: 100001
        },
        {
            // 用户 id
            name: 'uid',
            starter: 1000001
        }
    ],
    account: {
        // 最大密码长度
        maxPasswordLen: 20,
        // 最大账号长度
        maxAccountLen: 20,
        // 最少8次
        saltRound: 8,
    },
    game: {
        // token iv, 16位随机字段
        tokenIv: '4OQxmYDB1Lj8ra97',
        tokenPwd: '8YFi.c7sK?eP.,aG',
        // 30秒有效
        tokenUsefulTime: 30000,
        // 解散闲置房间的最长时间
        timeToDissolveIdleRoom: 60 * 60 * 1000,
        exitWaitTimeSeconds: 30,
        noAnswerWaitTimeSeconds: 120,
        answerExitSeconds: 30,
        // 机器人匹配游戏时间间隔(微秒)
        robotMatchGameInterval: 10000,
        // 匹配间隔
        matchGameIntervalTime: 5000,
    },
    // paypal 支付
    paypal: {
        isSandBox: true,
        clientId: 'AWxI2rqE68_YcRkMLNar4-jpQUTrahMR5TmEExLQSNzXf8Q67xYDKucI0MoRMn_e75t1Rx6wNzaagYKt',
        secret: 'EMDzXUTLxuBHy3hD-1of2936aqdqtyq5j7kUxJpStOzjkiUeZKSTU83sRaRHID0rT6uPlPcSD7opGz6q',
        // 线上地址
        // https://api-m.paypal.com
        baseUrl: 'https://api-m.sandbox.paypal.com',
        // 支付成功，跳转下一地址，将账单 capture 到商家账户
        returnUrl: 'http://localhost:8888/paypal/paysuccess',
        // 支付失败
        cancelUrl: 'http://localhost:8888/paypal/paycancel',
    },
}
