// 本地虚拟机测试配置
module.exports = {
    mongo: {
        host: 'localhost',
        port: 27017,
        database: 'chessVm',
        user: '',
        password: ''
    },
    redis: {
        port: 6379,
        host: 'localhost',
    },
    // 开发模式
    debug: true,
    game: {
    },
}
