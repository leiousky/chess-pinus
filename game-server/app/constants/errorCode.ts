enum errorCode {
    // 成功
    ok = 0,
    // 系统错误
    systemErr = 1,
    // 请求数据
    invalidRequest = 2,
    // 玩家不存在
    invalidUser = 4,
    // 无权限
    noPermission = 6,
    // 短信验证错误
    smsCodeErr = 7,
    // 账号或密码错误
    invalidAccountOrPassword = 8,
    // 获取大厅服务器失败
    getHallFail = 104,
    // 无效token
    invalidToken = 202,
    // 玩家未找到
    userNotFound = 212,
    // 已经在房间中，无法创建新的房间
    alreadyInRoom = 306,
    // 房间不存在
    roomNotExist = 308,
    // 房间已满
    roomFull = 309,
    // 已经在匹配列表中了
    inMatchList = 313,
    // 金币不足，无法开始游戏
    leaveRoomGoldNotEnoughLimit = 402,
    // 房费不足
    roomExpenseNotEnough = 404,
    // 房间已解散
    roomHasDismiss = 405,
    // 房间已解散，请离开房间
    roomDismissShouldExit = 406,
    // 正在游戏中无法离开房间
    canNotLeaveRoom = 407,
    // 竞技场不存在
    arenaNotExists = 10001,
    // 竞技场满员
    arenaFull = 10002,
    // 俱乐部不存在
    clubNotExists = 10003,
    // 已经加入俱乐部
    alreadyInClub = 10004,
    // 已申请
    hasJoinClubRequest = 10005,
    // 未申请
    noJoinClubRequest = 10006,
    // 不能从俱乐部删除自己
    canNotRemoveSelf = 10007,
    // 非创建者不能移除管理员
    canNotRemoveAdmin = 10008,
    // 不能删除战队主
    canNotRemoveCreator = 10009,
    // 解散前先退出房间
    dissolveRoomBeforeDissolveClub = 10010,
}

export default errorCode
