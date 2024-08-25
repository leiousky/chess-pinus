declare const config: {
    mongo: {
        host: string
        port: number
        database: string
        user: string
        password: string
    },
    redis: {
        port: number
        host: string
        password: string
        username: string
    },
    // 开发模式
    debug: boolean
    // 框架配置
    pinus: {
        // 心跳包时间
        heartbeat: number
    },
    // id计数器
    idCounter: [
        {
            name: string
            starter: number
        },
    ],
    account: {
        // 最大密码长度
        maxPasswordLen: number
        // 最大账号长度
        maxAccountLen: number
        // bcrypt saltRound 次数
        saltRound: number
    },
    game: {
        tokenIv: string
        tokenPwd: string
        tokenUsefulTime: number
        timeToDissolveIdleRoom: number
        exitWaitTimeSeconds: number
        noAnswerWaitTimeSeconds: number
        answerExitSeconds: number
        // 机器人匹配游戏时间间隔(微秒)
        robotMatchGameInterval: number
        // 匹配间隔
        matchGameIntervalTime: number
    },
    // paypal 支付
    paypal: {
        isSandBox: boolean
        clientId: string
        secret: string
        // 线上地址
        // https://api-m.paypal.com
        baseUrl: string
        // 支付成功，跳转下一地址，将账单 capture 到商家账户
        returnUrl: string
        // 支付失败
        cancelUrl: string
    },
}

export = config
