import {GameFrameBase} from '../base/gameFrame'
import {IRoomFrame} from '../../../../types/interfaceApi'
import {
    DZGameStatus,
    DZOperationType,
    DZProtoType,
    DZPush,
    DZUserStatus, DZWinType
} from '../../../../gameComponent/dezhouPoker/DZProto'
import {UserStatus} from '../../../../constants/game'
import {AiLogic} from '../../../../gameComponent/dezhouPoker/aiLogic'
import services from '../../../../services'
import {DZGameLogic} from '../../../../gameComponent/dezhouPoker/DZGameLogic'

export class DZGameFrame extends GameFrameBase {
    // 游戏状态
    gameStatus: DZGameStatus
    // 庄家 id
    bankerUserChairId: number
    // 当前行动用户
    currentUserChairId: number
    // 用户状态
    userStatusArr: DZUserStatus[]
    // 公共牌
    publicCardArr: number[]
    // 已显示的公共牌
    showPublicCardArr: number[]
    // 所有用户的牌
    allUserCardArr: number[][]
    // 当前轮下注金额
    curTurnBetCountArr: number[]
    // 当前轮玩家操作状态
    curTurnOperationStatus: boolean[]
    // 当前轮的最大下注
    curTurnMaxBetCount: number
    // 总下注金额
    totalBetCountArr: number[]
    // 玩家全押的状态
    allInUserStatus: boolean[]
    curMaxCardChairId: number
    maxCardTypeArr: number[]

    constructor(roomFrame: IRoomFrame) {
        super(roomFrame)
        this.gameStatus = DZGameStatus.NONE
        this.bankerUserChairId = -1
    }

    async resetGame() {
        this.gameStatus = DZGameStatus.NONE       // 游戏状态
        this.currentUserChairId = -1
        this.userStatusArr = []
        this.publicCardArr = []
        this.showPublicCardArr = []
        this.allUserCardArr = []
        this.curTurnBetCountArr = []
        this.curTurnOperationStatus = []
        this.curTurnMaxBetCount = 0
        this.totalBetCountArr = []
        this.allInUserStatus = []
        // 机器人相关
        this.curMaxCardChairId = -1
        this.maxCardTypeArr = []
        // 初始化属性
        for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
            this.userStatusArr.push(DZUserStatus.NONE)
            this.allUserCardArr.push([])
            this.curTurnBetCountArr.push(0)
            this.totalBetCountArr.push(0)
            this.allInUserStatus.push(false)
            this.curTurnOperationStatus.push(false)
        }
    }

    async receivePlayerMessage(chairId: number, msg: any) {
        const type = msg.type || null
        const data = msg.data || null
        if (!type || !data) return

        if (type === DZProtoType.GAME_USER_BET_NOTIFY) {
            await this.onUserBet(chairId, data)
        } else if (type === DZProtoType.GAME_USER_GIVE_UP_NOTIFY) {
            await this.onUserGiveUp(chairId)
        }
    }

    async startGame() {
        // 初始化数据
        await this.resetGame()
        // 修改游戏状态
        this.gameStatus = DZGameStatus.PLAYING
        // 修改玩家状态
        const playingChairIDArr = []
        const gameTypeInfo = this.roomFrame.getGameTypeInfo()
        const parameter = gameTypeInfo.parameters || {maxTake: 0, blindBetCount: 0, preBetCount: 0}
        for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
            const user = this.roomFrame.getUserByChairId(i)
            this.userStatusArr[i] = user ? DZUserStatus.PLAYING : DZUserStatus.NONE
            if (user) {
                playingChairIDArr.push(i)
                // 金币不足最低带入金币的玩家，自动补齐
                const isUpdate = await this.roomFrame.setTakeChip(user)
                if (isUpdate) {
                    await this.roomFrame.sendDataToAll(DZPush.gameUserUpdateTakeGoldPush(i, user.takeChip))
                }
                // if (user.takeChip < minTake) {
                //     if (user.gold > maxTake) {
                //         user.takeChip = maxTake
                //     } else {
                //         user.takeChip = user.gold
                //     }
                //     await this.roomFrame.sendDataToAll(DZPush.gameUserUpdateTakeGoldPush(i, user.takeChip))
                // }
            }
        }
        // 确定庄家
        if (this.bankerUserChairId === -1) {
            // 第一局随机庄家
            this.bankerUserChairId = playingChairIDArr[services.utils.getRandomNum(0, playingChairIDArr.length - 1)]
        } else {
            // 上局的庄家的左手边用户为新的庄家
            for (let i = 1; i < this.roomFrame.getGameRule().chairCount; ++i) {
                const chairID = (this.bankerUserChairId + i) % this.roomFrame.getGameRule().chairCount
                if (playingChairIDArr.indexOf(chairID) !== -1) {
                    this.bankerUserChairId = chairID
                    break
                }
            }
        }
        // 洗牌
        const allCardData = DZGameLogic.getRandCardList()
        // 设置公共牌
        this.publicCardArr = allCardData.splice(0, 5)
        // 发牌
        for (let i = 0; i < playingChairIDArr.length; ++i) {
            this.allUserCardArr[playingChairIDArr[i]] = allCardData.splice(0, 2)
        }
        // 是否做牌型控制
        if (Math.random() < this.roomFrame.getCurRobotWinRate()) {
            const robotChairIDArr = []
            for (let i = 0; i < playingChairIDArr.length; ++i) {
                const user = this.roomFrame.getUserByChairId(playingChairIDArr[i])
                if (!user) continue
                if (user.robot) robotChairIDArr.push(i)
            }
            if (robotChairIDArr.length > 0) {
                // 调整牌，让机器人拿最大牌
                let maxCardDataArr = null
                this.curMaxCardChairId = -1
                for (let i = 0; i < this.allUserCardArr.length; ++i) {
                    if (this.allUserCardArr[i].length > 0) {
                        const cardArr = DZGameLogic.fiveFromSeven(this.allUserCardArr[i], this.publicCardArr)
                        if (!maxCardDataArr || DZGameLogic.compareCard(cardArr, maxCardDataArr) === 2) {
                            maxCardDataArr = cardArr
                            this.curMaxCardChairId = i
                        }
                    }
                }
                // 将最大牌型给机器人
                if (robotChairIDArr.indexOf(this.curMaxCardChairId) === -1) {
                    const robotChairID = robotChairIDArr[services.utils.getRandomNum(0, robotChairIDArr.length - 1)]
                    const tempArr = this.allUserCardArr[robotChairID]
                    this.allUserCardArr[robotChairID] = this.allUserCardArr[this.curMaxCardChairId]
                    this.allUserCardArr[this.curMaxCardChairId] = tempArr
                }
            }
        }
        // 记录最大的牌类型
        for (let i = 0; i < this.allUserCardArr.length; ++i) {
            if (this.allUserCardArr[i].length === 0) {
                this.maxCardTypeArr.push(0)
            } else {
                this.maxCardTypeArr.push(DZGameLogic.getCardType(DZGameLogic.fiveFromSeven(this.allUserCardArr[i], this.publicCardArr)))
            }
        }
        // 设置下盲注
        const blindBetArr = []
        let tempChairID = this.bankerUserChairId
        do {
            const chairID = ++tempChairID % this.roomFrame.getGameRule().chairCount
            if (playingChairIDArr.indexOf(chairID) !== -1) {
                blindBetArr.push(chairID)
            }
        } while (blindBetArr.length < 3)
        const bindBetCount = parameter.blindBetCount
        await this.updateUserBet(blindBetArr[0], bindBetCount)         // 小盲
        await this.updateUserBet(blindBetArr[1], bindBetCount * 2)     // 大盲
        // 设置当前行动用户
        this.currentUserChairId = blindBetArr[2]
        // 设置下前注
        const preBetCount = parameter['preBetCount']
        if (preBetCount > 0) {
            for (let i = 0; i < playingChairIDArr.length; ++i) {
                await this.updateUserBet(playingChairIDArr[i], preBetCount)
            }
        }
        // 发送游戏开始消息
        for (let i = 0; i < playingChairIDArr.length; ++i) {
            await this.roomFrame.sendData(DZPush.gameStartPush(this.bankerUserChairId, this.allUserCardArr[playingChairIDArr[i]],
                this.currentUserChairId, this.curTurnMaxBetCount, this.curTurnBetCountArr, this.userStatusArr, this.roomFrame.drawId), [playingChairIDArr[i]])
        }
        // 离线用户和机器人操作
        await this.checkAutoOperation()
    }

    // 游戏结束
    async gameEnd() {
        // 修改操作用户ID
        this.currentUserChairId = -1
        // 获取可能赢的玩家的ID
        const leftChairArr = []
        for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
            if ((this.userStatusArr[i] === DZUserStatus.PLAYING)) {
                leftChairArr.push(i)
            }
        }
        const winType = (leftChairArr.length === 1) ? DZWinType.ONLY_ONE : DZWinType.MAX_CARD
        let winChairIDArr = []
        if (winType === DZWinType.ONLY_ONE) {
            winChairIDArr = leftChairArr
        }
        // 计算总下注
        let totalBetCount = 0
        for (let i = 0; i < this.totalBetCountArr.length; ++i) {
            totalBetCount += this.totalBetCountArr[i]
        }
        // 复制总下注金额
        const tempTotalBetCountArr = this.totalBetCountArr.slice()
        // 初始化玩家赢分
        const winCountArr = []
        for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
            if (this.userStatusArr[i] === DZUserStatus.NONE) {
                winCountArr.push(0)
            } else {
                winCountArr.push(-this.totalBetCountArr[i])
            }
        }
        const calculate = function (chairIDArr: any[]) {
            console.log('=============calculate chairIDArr: ', chairIDArr, tempTotalBetCountArr)
            // 没有赢的玩家，退回剩余下注金额
            if (chairIDArr.length === 0) {
                for (let i = 0; i < tempTotalBetCountArr.length; ++i) {
                    winCountArr[i] += tempTotalBetCountArr[i]
                }
            } else if (chairIDArr.length === 1) {
                const winChairID = chairIDArr[0]
                const betCount = tempTotalBetCountArr[winChairID]
                for (let i = 0; i < tempTotalBetCountArr.length; ++i) {
                    if (tempTotalBetCountArr[i] <= betCount) {
                        winCountArr[winChairID] += tempTotalBetCountArr[i]
                        tempTotalBetCountArr[i] = 0
                    } else {
                        winCountArr[winChairID] += betCount
                        tempTotalBetCountArr[i] -= betCount
                    }
                }
                calculate([])
            } else {
                // 获取所有用户的最大牌型
                const allUserCardArr = []
                for (let i = 0; i < this.allUserCardArr.length; ++i) {
                    if (chairIDArr.indexOf(i) !== -1) {
                        const maxCardDataArr = DZGameLogic.fiveFromSeven(this.allUserCardArr[i], this.publicCardArr)
                        allUserCardArr.push(maxCardDataArr)
                    } else {
                        allUserCardArr.push(null)
                    }
                }
                // 计算赢牌玩家列表
                const winList = DZGameLogic.selectMaxUser(allUserCardArr)
                if (winChairIDArr.length === 0) {
                    winChairIDArr = winList.slice()
                }
                // 获取该次比拼中最小的下注金额
                let minBetCount = tempTotalBetCountArr[0]
                for (let i = 1; i < tempTotalBetCountArr.length; ++i) {
                    if (chairIDArr.indexOf(i) === -1) continue
                    if (tempTotalBetCountArr[i] < minBetCount) {
                        minBetCount = tempTotalBetCountArr[i]
                    }
                }
                // 计算赢金币总额
                const chairArr = []
                let winCount = 0
                for (let i = 0; i < tempTotalBetCountArr.length; ++i) {
                    if (chairIDArr.indexOf(i) === -1) continue
                    winCount += minBetCount
                    tempTotalBetCountArr[i] -= minBetCount
                    // 如果还有剩余金币，则可继续下一轮比牌
                    if (tempTotalBetCountArr[i] > 0) {
                        chairArr.push(i)
                    }
                }
                // 赢的人平分金币
                for (let i = 0; i < winCountArr.length; ++i) {
                    if (winList.indexOf(i) === -1) continue
                    winCountArr[i] += (winCount / winList.length)
                }
                // 剩余下注金额大于0的用户，继续下一轮比牌
                calculate(chairArr)
            }
        }.bind(this)

        calculate(leftChairArr)
        const scoreChangeArr = []
        // TODO 德州不抽水
        // const profitPercentage = parseInt(this.roomFrame.publicParameter["profitPercentage"] || 5);
        const profitPercentage = 0
        for (let i = 0; i < winCountArr.length; ++i) {
            if (winCountArr[i] === 0) continue
            const user = this.roomFrame.getUserByChairId(i)
            if (!user) continue
            scoreChangeArr.push({
                uid: user.uid,
                score: winCountArr[i]
            })
            // 更新takeGold
            if (winCountArr[i] > 0) {
                user.takeChip += (winCountArr[i] * (1 - profitPercentage / 100))
            } else {
                user.takeChip += winCountArr[i]
            }
        }
        // 延迟发送结果，并结算
        this.gameStatus = DZGameStatus.NONE
        await this.roomFrame.sendDataToAll(DZPush.gameResultPush(this.allUserCardArr, winCountArr, winChairIDArr, winType, this.showPublicCardArr, totalBetCount))
        await this.roomFrame.concludeGame(scoreChangeArr)
    }

    // 用户下注
    async onUserBet(chairId: number, data: { count: string | number }) {
        const user = this.roomFrame.getUserByChairId(chairId)
        // 检验用户是否合理
        if (this.currentUserChairId !== chairId || !user) {
            console.error('onUserBet', 'not cur user')
            return
        }
        // 检查下注金额是否有效
        if ((typeof data.count !== 'number') || (data.count < 0 && data.count !== -1)) {
            console.error('onUserBet', 'bet count err:' + data.count)
            return
        }
        // 判断金币是否足够
        if (data.count > 0 && (user.takeChip < (this.totalBetCountArr[chairId] + data.count))) {
            console.error('onUserBet', 'not enough gold')
            return
        }
        let operationType = DZOperationType.NONE
        // 过牌
        if (data.count === 0) {
            if (this.curTurnBetCountArr[chairId] !== this.curTurnMaxBetCount) {
                console.error('onUserBet', 'can not pass')
                return
            }
            operationType = DZOperationType.PASS
        }
        // all in
        else if (data.count === -1) {
            // 下注剩余所有金币
            const leftGold = user.takeChip - this.totalBetCountArr[chairId]
            await this.updateUserBet(chairId, leftGold)
            // 记录all in状态
            this.allInUserStatus[chairId] = true

            operationType = DZOperationType.ALL_IN
        }
        // 跟注或者加注
        else {
            // 下注总额不得小于当前最大下注额
            if (this.totalBetCountArr[chairId] + data.count < this.curTurnMaxBetCount) {
                console.error('onUserBet', 'total bet count can not lower to curTurnMaxBetCount')
                return
            }
            // 计算操作类型
            if (this.curTurnMaxBetCount < this.totalBetCountArr[chairId] + data.count) {
                operationType = DZOperationType.ADD_BET
            } else {
                operationType = DZOperationType.FLOW
            }

            // 更新下注金额
            await this.updateUserBet(chairId, data.count)
        }
        // 修改状态
        this.curTurnOperationStatus[chairId] = true
        // 该轮完成
        if (await this.isCurTurnFinished()) {
            // 发送玩家下注通知
            await this.roomFrame.sendDataToAll(DZPush.gameUserBetPush(chairId, data.count, this.curTurnBetCountArr[chairId], -1, 0, 0, operationType))
            // 开始下一路
            await this.startNextTurn()
        } else {
            // 计算下一个操作玩家
            for (let i = 1; i < this.roomFrame.getGameRule().chairCount; ++i) {
                const tempChairID = (this.currentUserChairId + i) % this.userStatusArr.length
                if ((this.userStatusArr[tempChairID] !== DZUserStatus.PLAYING) || (this.allInUserStatus[tempChairID])) continue
                this.currentUserChairId = tempChairID
                break
            }
            // 发送玩家下注通知
            await this.roomFrame.sendDataToAll(DZPush.gameUserBetPush(chairId, data.count, this.curTurnBetCountArr[chairId], this.currentUserChairId, this.curTurnBetCountArr[this.currentUserChairId], this.curTurnMaxBetCount, operationType))
            // 检查自动操作
            await this.checkAutoOperation()
        }
    }

    async updateUserBet(chairId, betCount) {
        this.curTurnBetCountArr[chairId] += betCount
        this.totalBetCountArr[chairId] += betCount

        if (this.curTurnBetCountArr[chairId] > this.curTurnMaxBetCount) {
            this.curTurnMaxBetCount = this.curTurnBetCountArr[chairId]
        }
    }

    async isCurTurnFinished() {
        // 判断是否只有一个玩家
        let playingUserCount = 0
        for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
            if ((this.userStatusArr[i] === DZUserStatus.PLAYING)) {
                playingUserCount++
            }
        }
        // 只有一个正在玩的玩家
        if (playingUserCount <= 1) return true

        let isFinishedTurn = false
        for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
            if ((this.userStatusArr[i] === DZUserStatus.PLAYING) && !this.allInUserStatus[i] && (this.curTurnBetCountArr[i] < this.curTurnMaxBetCount || !this.curTurnOperationStatus[i])) break
            if (i === this.userStatusArr.length - 1) {
                isFinishedTurn = true
            }
        }
        return isFinishedTurn
    }

    async startNextTurn() {
        // 所有牌已发完，游戏结束
        if (this.showPublicCardArr.length === 5) {
            await this.gameEnd()
        } else {
            // 判断是否只剩下一个可操作用户，如果只存在一个可操作用户，发所有牌并结算
            let enableOperateUserCount = 0
            let playingUserCount = 0
            for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
                if ((this.userStatusArr[i] === DZUserStatus.PLAYING)) {
                    playingUserCount++
                    if (!this.allInUserStatus[i]) {
                        enableOperateUserCount++
                    }
                }
            }
            // 只有一个正在玩的玩家
            if (playingUserCount <= 1) {
                await this.gameEnd()
            }
            // 只有一个可操作玩家，发完所有牌，结束游戏
            else if (enableOperateUserCount <= 1) {
                this.showPublicCardArr = this.publicCardArr
                await this.gameEnd()
            } else {
                // 发牌开始下一轮
                if (this.showPublicCardArr.length === 0) {
                    this.showPublicCardArr = this.publicCardArr.slice(0, 3)
                } else {
                    this.showPublicCardArr.push(this.publicCardArr[this.showPublicCardArr.length])
                }
                // 将当前轮下注放入奖池中
                let totalBetCount = 0
                for (let i = 0; i < this.curTurnBetCountArr.length; ++i) {
                    if (this.userStatusArr[i] === DZUserStatus.NONE) continue
                    // 计算总奖池金额
                    totalBetCount += this.totalBetCountArr[i]
                }
                // 清理当前轮数据
                this.curTurnMaxBetCount = 0
                this.curTurnBetCountArr = []
                this.curTurnOperationStatus = []
                for (let i = 0; i < this.roomFrame.getGameRule().chairCount; ++i) {
                    this.curTurnBetCountArr.push(0)
                    this.curTurnOperationStatus.push(false)
                }
                // 计算下一个操作的玩家
                for (let i = 1; i < this.roomFrame.getGameRule().chairCount; ++i) {
                    const chairID = (this.currentUserChairId + i) % this.userStatusArr.length
                    if ((this.userStatusArr[chairID] !== DZUserStatus.PLAYING) || (this.allInUserStatus[chairID])) continue
                    this.currentUserChairId = chairID
                    break
                }
                // 发送发牌推送
                await this.roomFrame.sendDataToAll(DZPush.gameSendPublicCardPush(this.showPublicCardArr, this.currentUserChairId, 0, this.curTurnMaxBetCount, totalBetCount))
                // 检查自动操作
                await this.checkAutoOperation()
            }
        }
    }

    // 检查当前用户是否需要自动操作
    async checkAutoOperation() {
        // 判定是否参与当局游戏
        if (this.userStatusArr[this.currentUserChairId] !== DZUserStatus.PLAYING) return
        const user = this.roomFrame.getUserByChairId(this.currentUserChairId)
        // 机器人则执行AI操作
        if (user.robot) {
            await this.robotAutoOperation(this.currentUserChairId)
        }
        // 玩家离线则执行自动操作
        else {
            if ((user.userStatus & UserStatus.offline) === 0) return
            await this.offlineUserAutoOperation(this.currentUserChairId)
        }
    }

    async robotAutoOperation(chairID: number) {
        const user = this.roomFrame.getUserByChairId(chairID)
        if (!user || !user.robot) return
        if (this.currentUserChairId !== chairID) return
        if (this.userStatusArr[chairID] !== DZUserStatus.PLAYING) return
        if (this.gameStatus !== DZGameStatus.PLAYING) return
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        setTimeout(function () {
            if (self.currentUserChairId !== chairID) return
            if (self.userStatusArr[chairID] !== DZUserStatus.PLAYING) return
            if (self.gameStatus !== DZGameStatus.PLAYING) return
            const parameter = self.roomFrame.getGameTypeInfo().parameters || {blindBetCount: 10, preBetCount: 0}
            const blindBetCount = parameter.blindBetCount
            const preBetCount = parameter.preBetCount || 0
            const maxCardType = self.maxCardTypeArr[chairID]
            const leftCount = user.takeChip - self.totalBetCountArr[chairID]
            const res = AiLogic.getOperationResult(maxCardType, self.curTurnBetCountArr[chairID], self.curTurnMaxBetCount,
                self.totalBetCountArr[chairID] - preBetCount, leftCount, blindBetCount * 2, this.curMaxCardChairID === chairID)
            self.receivePlayerMessage(chairID, res)
        }, services.utils.getRandomNum(2000, 4000))
    }

    async offlineUserAutoOperation(chairID: number) {
        if (this.userStatusArr[chairID] !== DZUserStatus.PLAYING) return
        if (this.gameStatus !== DZGameStatus.PLAYING) return
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        setTimeout(function () {
            if (self.userStatusArr[chairID] !== DZUserStatus.PLAYING) return
            if (self.gameStatus !== DZGameStatus.PLAYING) return
            if (self.currentUserChairId !== chairID) return
            const user = self.roomFrame.getUserByChairId(chairID)
            if (!user || (user.userStatus & UserStatus.offline) === 0) return
            // 过或者弃牌
            if (self.curTurnBetCountArr[chairID] < self.curTurnMaxBetCount) {
                self.receivePlayerMessage(chairID, DZPush.gameUserGiveUpNotify())
            } else {
                self.receivePlayerMessage(chairID, DZPush.gameUserBetNotify(0))
            }
        }, 2000)
    }

    async onUserGiveUp(chairID: number) {
        const user = this.roomFrame.getUserByChairId(chairID)
        // 检验用户是否合理
        if (this.currentUserChairId !== chairID || !user) {
            console.error('onUserBet', 'not cur user')
            return
        }
        // 修改玩家状态
        this.userStatusArr[chairID] = DZUserStatus.GIVE_UP
        if (await this.isCurTurnFinished()) {
            // 发送玩家玩家放弃消息
            await this.roomFrame.sendDataToAll(DZPush.gameUserGiveUpPush(chairID, -1, 0, 0))
            // 开始下一轮
            await this.startNextTurn()
        } else {
            // 计算下一个操作玩家
            for (let i = 1; i < this.roomFrame.getGameRule().chairCount; ++i) {
                const chairID = (this.currentUserChairId + i) % this.userStatusArr.length
                if ((this.userStatusArr[chairID] !== DZUserStatus.PLAYING) || (this.allInUserStatus[chairID])) continue
                this.currentUserChairId = chairID
                break
            }
            // 发送玩家下注通知
            await this.roomFrame.sendDataToAll(DZPush.gameUserGiveUpPush(chairID, this.currentUserChairId, this.curTurnBetCountArr[this.currentUserChairId], this.curTurnMaxBetCount))
            // 检查自动操作
            await this.checkAutoOperation()
        }
    }

    async getEnterGameData(chairId: number) {
        const gameData: any = {
            gameStatus: this.gameStatus,
            gameTypeInfo: services.parameter.toClientGameTypeInfo(this.roomFrame.getGameTypeInfo()),
            profitPercentage: parseInt(this.roomFrame.publicParameter.profitPercentage || 5)
        }
        if (this.gameStatus === DZGameStatus.NONE) {
            return gameData
        } else if (this.gameStatus === DZGameStatus.PLAYING) {
            gameData.currentUserChairID = this.currentUserChairId
            gameData.bankerUserChairID = this.bankerUserChairId
            gameData.userStatusArr = this.userStatusArr
            gameData.showPublicCardArr = this.showPublicCardArr
            gameData.curTurnBetCountArr = this.curTurnBetCountArr
            gameData.totalBetCountArr = this.totalBetCountArr
            gameData.curTurnMaxBetCount = this.curTurnMaxBetCount
            gameData.allInUserStatus = this.allInUserStatus
            gameData.selfCardArr = this.allUserCardArr[chairId]
            return gameData
        }
    }

    async onEventGameStart() {
        await this.startGame()
    }

    async onEventUserEntry(chairId: number) {
        const user = this.roomFrame.getUserByChairId(chairId)
        if (user && !user.takeChip) {
            const parameter = this.roomFrame.getGameTypeInfo().parameters || {maxTake: 0}
            const maxTake = parameter.maxTake
            console.log('take gold', user.gold, 'maxTake', maxTake, user)
            if (user.gold > maxTake) {
                user.takeChip = maxTake
            } else {
                user.takeChip = user.gold
            }
        } else {
            console.log('invalid user info to take gold')
        }
    }

    async onEventUserLeave(chairId: number) {
        if (this.gameStatus !== DZGameStatus.PLAYING || this.userStatusArr[chairId] === DZUserStatus.NONE) {
            return
        } else {
            this.userStatusArr[chairId] = DZUserStatus.NONE
            this.allInUserStatus[chairId] = false
            await this.roomFrame.writeUserGameResult([{
                uid: this.roomFrame.getUserByChairId(chairId).uid,
                score: -this.totalBetCountArr[chairId]
            }])
        }
    }

    async isUserEnableLeave(chairId: number): Promise<boolean> {
        return (this.userStatusArr[chairId] !== DZUserStatus.PLAYING)
    }
}
