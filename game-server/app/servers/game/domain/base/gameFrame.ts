// game frame 接口
import {IGameFrame, IRoomFrame} from '../../../../types/interfaceApi'

// gameFrame 基类
export class GameFrameBase implements IGameFrame {
    roomFrame: IRoomFrame

    constructor(roomFrame: IRoomFrame) {
        this.roomFrame = roomFrame
    }

    // sendData(msg: any, chairIdArr?: number[]) {
    //     if (!chairIdArr) {
    //         chairIdArr = []
    //         const userArr = this.roomFrame.getUserArr()
    //         for (const key in Object.keys(userArr)) {
    //             if (userArr[key]) {
    //                 chairIdArr.push(userArr[key].chairId)
    //             }
    //         }
    //     }
    //     const uidAndFrontedIdArr: { uid: string, sid: string }[] = []
    //     for (let i = 0; i < chairIdArr.length; ++i) {
    //         const user = this.roomFrame.getUserByChairId(chairIdArr[i])
    //         if (!!user && (user.userStatus & UserStatus.offline) === 0 && !user.userInfo.robot) {
    //             uidAndFrontedIdArr.push({uid: user.userInfo.uid, sid: user.userInfo.frontendId})
    //         }
    //     }
    //     if (uidAndFrontedIdArr.length > 0) {
    //         console.debug('game frame, sendData', msg)
    //     }
    // }

    async receivePlayerMessage(chairId: number, msg: any) {
        console.debug('receive playerMessage', chairId, msg)
    }

    async onEventUserEntry(chairId: number) {
        console.debug('onEventUserEntry', chairId)
    }

    async getEnterGameData(chairId: number) {
        console.debug('getEnterGameData', chairId)
        return null
    }

    async onEventGameStart() {
        console.debug('onEventGameStart')
    }

    async onEventGamePrepare() {
        console.debug('onEventGamePrepare')
    }

    async isUserEnableLeave(chairId: number) {
        console.debug('isUserEnableLeave', chairId)
        return false
    }

    async onEventUserOffline(chairId: number) {
        console.debug('onEventUserOffline', chairId)
    }

    async onEventUserLeave(chairId: number) {
        console.debug('onEventUserLeave', chairId)
    }

    async onGetFinalResultData() {
        console.debug('getFinalResultData')
        return null
    }

    async onEventRoomDismiss(msg: any) {
        console.debug('onEventRoomDismiss', msg)

    }

    async onGetCurrentScoreArr(): Promise<any> {
        console.debug('onGetCurrentScoreArr')
        return []
    }

    async onSetGameWinRate(chairId: number, rate: number): Promise<void> {
        console.debug('onSetGameWinRate', chairId, rate)
    }

    async onEventUserOffLine(chairId: number): Promise<void> {
        console.debug('onEventUserOffLine', chairId)
    }
}
