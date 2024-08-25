export enum LoginPlatform {
    none,
    // 账号，密码登录
    account = 1,
    // 微信
    weiXin = 2,
    // 手机登录
    mobilePhone = 3,
}

// 用户登录权限
export enum UserPermissionType {
    none = 0,
    // 登录客户端
    loginClient = 0x1,
    // 游戏控制
    gameControl = 0x0100,
}

// 用户在线状态
export enum UserStatus {
    none = 0,
    ready = 1,
    playing = 2,
    offline = 4,
}

// 房间类型
export enum RoomType {
    none = 0,
    // 匹配类型
    normal = 1,
    // 私有房间（房卡房间）
    private = 2,
    // 百人房间
    hundred = 3,
    // 竞技场
    arena = 4,
    club = 5,
}

export enum RoomSettlementMethod {
    none = 0, // 不记分
    gold = 1,                    // 金币模式
    score = 2,                   // 积分模式
    // limitGold = 3,              // 限制金币模式
    diamond = 4, // 钻石模式
    // 战队金币
    clubGold = 5,
}

// 游戏类型
export enum GameType {
    ZJH = 1,             // 扎金花
    NN = 10,             // 牛牛
    BRNN = 11,           // 百人牛牛
    SSS = 20,            // 十三水
    TTZ = 30,            // 推筒子
    HHDZ = 40,           // 红黑大战
    BJL = 50,            // 百家乐
    LHD = 60,            // 龙虎斗
    FISH = 70,           // 捕鱼
    DDZ = 80,            // 斗地主
    BJ = 90,             // 21点
    DZ = 100,            // 德州扑克
    PDK = 110,           // 跑得快
}

// 开始类型
export enum GameRoomStartType {
    none = 0,
    // 手动准备
    allReady = 1,
    // 自动开始
    autoStart = 2,
}

// 广播类型
export enum BroadcastType {
    none = 0,
    // 循环广播
    loop = 1,
    // 系统广播
    system = 2,
    // 大赢家
    bigWin = 3,
}

// 订单状态
export enum OrderStatus {
    // 创建
    created = 0,
    // 完成
    completed = 1,
}
