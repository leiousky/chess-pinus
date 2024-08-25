export enum RoomProtoType {
    //游戏正在进行
    GAME_STATUS_PLAYING = 1,
    // 用户准备的通知
    USER_READY_NOTIFY = 301,
    // 用户准备的推送
    USER_READY_PUSH = 401,
    // 用户进入房间的推送
    OTHER_USER_ENTRY_ROOM_PUSH = 402,
    // 用户离开房间的通知
    USER_LEAVE_ROOM_NOTIFY = 303,
    // 用户离开房间的回复
    USER_LEAVE_ROOM_RESPONSE = 403,
    // 用户离开房间推送
    USER_LEAVE_ROOM_PUSH = 404,
    // 房间解散的推送
    ROOM_DISMISS_PUSH = 405,
    // 房间用户信息变化的推送
    ROOM_USER_INFO_CHANGE_PUSH = 406,
    // 用户聊天通知
    USER_CHAT_NOTIFY = 307,
    // 用户聊天推送
    USER_CHAT_PUSH = 407,
    // 用户掉线的推送
    USER_OFF_LINE_PUSH = 408,
    // 开设的房间局数用完推送
    ROOM_DRAW_FINISHED_PUSH = 409,
    // 房间提示推送
    ROOM_NOTICE_PUSH = 410,
    GAME_WIN_RATE_NOTIFY = 311,
    GAME_WIN_RATE_PUSH = 411,
    // 玩家断线重连
    USER_RECONNECT_NOTIFY = 312,
    USER_RECONNECT_PUSH = 412,
    // 玩家请求解散房间
    ASK_FOR_DISMISS_NOTIFY = 313,
    ASK_FOR_DISMISS_PUSH = 413,
    // 最终结果推送
    GAME_END_PUSH = 414,
    // 对不起，这局我要赢
    SORRY_I_WILL_WIN_NOTIFY = 415,
    // 获取当前请求解散状态
    ASK_FOR_DISMISS_STATUS_NOTIFY = 316,
    ASK_FOR_DISMISS_STATUS_PUSH = 416,
    // 获取房间需要显示的玩家信息通知
    GET_ROOM_SHOW_USER_INFO_NOTIFY = 317,
    // 获取房间需要显示的玩家信息推送
    GET_ROOM_SHOW_USER_INFO_PUSH = 417,
    // 获取房间场景信息的通知
    GET_ROOM_SCENE_INFO_NOTIFY = 318,
    // 获取房间场景信息的推送
    GET_ROOM_SCENE_INFO_PUSH = 418,
    // 获取房间在线用户信息的通知
    GET_ROOM_ONLINE_USER_INFO_NOTIFY = 319,
    // 获取房间在线用户信息的推送
    GET_ROOM_ONLINE_USER_INFO_PUSH = 419,
}

export enum RoomDismissReason {
    // 正常结束
    none =0,
    // 游戏未开始，房主解散
    ownerAsk = 1,
    // 游戏中，玩家请求解散
    userAsk = 2,
    // 超时未响应
    timeout=4,
    // 达到房间最长时间
    maxTime=5,
}
