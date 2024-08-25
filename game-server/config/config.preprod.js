// 线上测试配置
module.exports = {
    mongo: {
        host: 'localhost',
        port: 27017,
        database: 'chessPreprod',
        user: '',
        password: ''
    },
    redis: {
        port: 6380,
        host: 'localhost',
    },
    // 开发模式
    debug: true,
    game: {
    },
}
