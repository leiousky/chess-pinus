// 消息推送
import {RoomDismissReason, RoomProtoType} from '../../../../constants/roomProto'

export class RoomProto {
    static selfEntryRoomPush(roomUserInfoArr: any, gameData: any, kindId: number, roomID: string, drawID: string) {
        return {
            roomUserInfoArr: roomUserInfoArr,
            gameData: gameData,
            kindId: kindId,
            roomID: roomID,
            drawID: drawID
        }
    }

    static userInfoChangePush(changeInfo: any) {
        return {
            type: RoomProtoType.ROOM_USER_INFO_CHANGE_PUSH,
            data: {
                changeInfo: changeInfo
            }
        }
    }

    // 用户准备
    static userReadyPush(chairId: number) {
        return {
            type: RoomProtoType.USER_READY_PUSH,
            data: {
                chairId: chairId
            }
        }
    }

    // 游戏总结算推送
    static getGameEndPushData(result: any) {
        return {
            type: RoomProtoType.GAME_END_PUSH,
            data: {
                result
            }
        }
    }

    static roomDismissPush(reason: RoomDismissReason) {
        return {
            type: RoomProtoType.ROOM_DISMISS_PUSH,
            data: {
                reason,
            }
        }
    }

    // 玩家离开房间
    static userLeaveRoomPush(roomUserInfo: any) {
        return {
            type: RoomProtoType.USER_LEAVE_ROOM_PUSH,
            data: {
                roomUserInfo,
            }
        }
    }

    // 其它玩家进入房间
    static otherUserEntryRoomPush(roomUserInfo: any) {
        return {
            type: RoomProtoType.OTHER_USER_ENTRY_ROOM_PUSH,
            data: {
                roomUserInfo,
            }
        }
    }

    static getRoomSceneInfoPush(roomUserInfoArr, gameData, roomID, drawID, gameTypeInfo) {
        return {
            type: RoomProtoType.GET_ROOM_SCENE_INFO_PUSH,
            data: {
                roomUserInfoArr: roomUserInfoArr,
                gameData: gameData,
                roomID: roomID,
                drawID: drawID,
                gameTypeInfo: gameTypeInfo
            }
        }
    }

    static getRoomShowUserInfoPush(selfUserInfo, shenSuanZiInfo, fuHaoUserInfoArr) {
        return {
            type: RoomProtoType.GET_ROOM_SHOW_USER_INFO_PUSH,
            data: {
                selfUserInfo: selfUserInfo,
                shenSuanZiInfo: shenSuanZiInfo,
                fuHaoUserInfoArr: fuHaoUserInfoArr
            }
        }
    }

    static getRoomOnlineUserInfoPush(shenSuanZiInfo, fuHaoUserInfoArr) {
        return {
            type: RoomProtoType.GET_ROOM_ONLINE_USER_INFO_PUSH,
            data: {
                shenSuanZiInfo: shenSuanZiInfo,
                fuHaoUserInfoArr: fuHaoUserInfoArr
            }
        }
    }

    static getUserReconnectPushData(gameData) {
        return {
            type: RoomProtoType.USER_RECONNECT_PUSH,
            data: {
                gameData: gameData
            }
        }
    }

    static userLeaveRoomResponse(chairId) {
        return {
            type: RoomProtoType.USER_LEAVE_ROOM_RESPONSE,
            data: {
                chairId: chairId
            }
        }
    }

    static userOffLinePush(chairId: number) {
        return {
            type: RoomProtoType.USER_OFF_LINE_PUSH,
            data: {chairId: chairId}
        }
    }

    static getAskForDismissPushData(chairIdArr, nameArr, scoreArr, tm, chairId) {
        return {
            type: RoomProtoType.ASK_FOR_DISMISS_PUSH,
            data: {
                nameArr: nameArr,
                scoreArr: scoreArr,
                chairIdArr: chairIdArr,
                tm: tm,
                askChairId: chairId
            }
        }
    }

    static getAskDismissStatusPushData(isOnDismiss) {
        return {
            type: RoomProtoType.ASK_FOR_DISMISS_STATUS_PUSH,
            data: {
                isOnDismiss: isOnDismiss
            }
        }
    }
}
