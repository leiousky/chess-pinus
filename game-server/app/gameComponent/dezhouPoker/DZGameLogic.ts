import {DZCardType} from './DZProto'
import services from '../../services'

//数值掩码
const MASK_COLOR = 0xF0                               // 花色掩码
const MASK_VALUE = 0x0F								//数值掩码

export class DZGameLogic {
    // 扑克数据
    static CARD_DATA_ARRAY: number[] = [
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D,	//方块 A - K
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D,	//梅花 A - K
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D,	//红桃 A - K
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D,	//黑桃 A - K
    ]

    // 获取数值
    static getCardValue(cardData: number) {
        return cardData & MASK_VALUE
    }

    //获取花色
    static getCardColor(cardData: number) {
        return cardData & MASK_COLOR
    }

    //逻辑数值
    static getCardLogicValue(cardData: number) {
        //扑克属性
        const cardValue = DZGameLogic.getCardValue(cardData)
        //转换数值
        return (cardValue === 1) ? (cardValue + 13) : cardValue
    }

    /* 获取牌 */
    static getRandCardList() {
        const tempCardDataArr = this.CARD_DATA_ARRAY.slice()
        const cardDataArr: number[] = []

        const maxCount = tempCardDataArr.length
        let randCount = 0
        let pos = 0
        // 混乱牌
        do {
            pos = Math.floor(Math.random() * (maxCount - randCount))
            cardDataArr[randCount++] = tempCardDataArr[pos]
            tempCardDataArr[pos] = tempCardDataArr[maxCount - randCount]
        } while (randCount < maxCount)
        return cardDataArr
    }

    //排列扑克
    static sortCardList(cardDataArr: any[]) {
        cardDataArr.sort(function (a, b) {
            const aLogicValue = DZGameLogic.getCardLogicValue(a)
            const bLogicValue = DZGameLogic.getCardLogicValue(b)
            if (aLogicValue !== bLogicValue) return bLogicValue - aLogicValue
            else {
                return b - a
            }
        })
    }

    //获取类型
    static getCardType(cardDataArr: number[]) {
        let isSameColor = true
        let isLineCard = true
        const firstColor = DZGameLogic.getCardColor(cardDataArr[0])
        const firstValue = DZGameLogic.getCardLogicValue(cardDataArr[0])

        //牌形分析
        for (let i = 1; i < cardDataArr.length; i++) {
            //数据分析
            if (isSameColor && (DZGameLogic.getCardColor(cardDataArr[i]) !== firstColor)) isSameColor = false
            if (isLineCard && (firstValue !== (DZGameLogic.getCardLogicValue(cardDataArr[i]) + i))) isLineCard = false
            //结束判断
            if (!isSameColor && !isLineCard) break
        }

        //最小同花顺
        if (!isLineCard && (firstValue === 14)) {
            for (let i = 1; i < cardDataArr.length; i++) {
                const logicValue = DZGameLogic.getCardLogicValue(cardDataArr[i])
                if ((firstValue !== (logicValue + i + 8))) break
                if (i === cardDataArr.length - 1) isLineCard = true
            }
        }

        //皇家同花顺
        if (isSameColor && isLineCard && (DZGameLogic.getCardLogicValue(cardDataArr[1]) === 13)) return DZCardType.KING_TONG_HUA_SHUN
        //顺子类型
        if (!isSameColor && isLineCard) return DZCardType.SHUN_ZI
        //同花类型
        if (isSameColor && !isLineCard) return DZCardType.TONG_HUA
        //同花顺类型
        if (isSameColor && isLineCard) return DZCardType.TONG_HUA_SHUN
        //扑克分析
        const analyseResult = DZGameLogic.analyseCardData(cardDataArr)

        //类型判断
        if (analyseResult.fourCount === 1) return DZCardType.TIE_ZHI
        if (analyseResult.doubleCount === 2) return DZCardType.TWO_DOUBLE
        if ((analyseResult.doubleCount === 1) && (analyseResult.threeCount === 1)) return DZCardType.HU_LU
        if ((analyseResult.threeCount === 1) && (analyseResult.doubleCount === 0)) return DZCardType.THREE
        if ((analyseResult.doubleCount === 1) && (analyseResult.singleCount === 3)) return DZCardType.ONE_DOUBLE
        return DZCardType.SINGLE
    }

    //分析扑克
    static analyseCardData(cardDataArr: number[]) {
        const result = {
            singleCount: 0,
            singleLogicValue: [],
            doubleCount: 0,
            doubleLogicValue: [],
            threeCount: 0,
            threeLogicValue: [],
            fourCount: 0,
            fourLogicValue: []
        }
        //扑克分析
        for (let i = 0; i < cardDataArr.length; i++) {
            //变量定义
            let sameCount = 1
            const sameCardData = [cardDataArr[i], 0, 0, 0]
            const logicValue = DZGameLogic.getCardLogicValue(cardDataArr[i])
            //获取同牌
            for (let j = i + 1; j < cardDataArr.length; j++) {
                //逻辑对比
                if (DZGameLogic.getCardLogicValue(cardDataArr[j]) !== logicValue) break
                //设置扑克
                sameCardData[sameCount++] = cardDataArr[j]
            }
            //保存结果
            switch (sameCount) {
                case 1: {
                    result.singleCount++
                    result.singleLogicValue.push(DZGameLogic.getCardLogicValue(sameCardData[0]))
                    break
                }
                case 2: {
                    result.doubleCount++
                    result.doubleLogicValue.push(DZGameLogic.getCardLogicValue(sameCardData[0]))
                    break
                }
                case 3: {
                    result.threeCount++
                    result.threeLogicValue.push(DZGameLogic.getCardLogicValue(sameCardData[0]))
                    break
                }
                case 4: {
                    result.fourCount++
                    result.fourLogicValue.push(DZGameLogic.getCardLogicValue(sameCardData[0]))
                    break
                }
            }
            //设置递增
            i += (sameCount - 1)
        }
        return result
    }

    //最大牌型
    static fiveFromSeven(handCardDataArr, centerCardDataArr) {
        const tempCardDataArr = handCardDataArr.concat(centerCardDataArr)
        if (tempCardDataArr.length < 5) {
            console.error('fiveFromSeven err count < 5')
        }
        //排列扑克
        DZGameLogic.sortCardList(tempCardDataArr)

        // 获取组合index
        const combinationFlagArrs = services.utils.getCombinationFlagArrs(tempCardDataArr.length, 5)
        // 检索最大组合
        let maxCardType = -1
        let maxCardDataArr = []
        for (let i = 0; i < combinationFlagArrs.length; ++i) {
            const arr = combinationFlagArrs[i]
            const cardData = []
            for (let j = 0; j < arr.length; ++j) {
                if (!arr[j]) continue
                cardData.push(tempCardDataArr[j])
            }
            const cardType = DZGameLogic.getCardType(cardData)
            if (maxCardType < cardType) {
                maxCardType = cardType
                maxCardDataArr = cardData
            } else if (maxCardType === cardType) {
                if (DZGameLogic.compareCard(cardData, maxCardDataArr) === 2) {
                    maxCardType = cardType
                    maxCardDataArr = cardData
                }
            }
        }
        return maxCardDataArr
    }

    //对比扑克
    static compareCard(firstDataArr, nextDataArr) {
        if (firstDataArr.length !== nextDataArr.length) {
            console.error('compareCard err: card count err')
            return 0
        }
        //获取类型
        const nextType = DZGameLogic.getCardType(nextDataArr)
        const firstType = DZGameLogic.getCardType(firstDataArr)
        //类型判断
        //大
        if (firstType > nextType) return 2
        //小
        if (firstType < nextType) return 1
        //简单类型
        switch (firstType) {
            case DZCardType.SINGLE: {
                for (let i = 0; i < firstDataArr.length; i++) {
                    const nextValue = this.getCardLogicValue(nextDataArr[i])
                    const firstValue = this.getCardLogicValue(firstDataArr[i])
                    // 大
                    if (firstValue > nextValue) return 2
                    // 小
                    else if (firstValue < nextValue) return 1
                    // 平
                    else if (i === firstDataArr.length - 1) return 0
                }
                break
            }
            case DZCardType.ONE_DOUBLE:
            case DZCardType.TWO_DOUBLE:
            case DZCardType.THREE:
            case DZCardType.TIE_ZHI:
            case DZCardType.HU_LU: {
                //分析扑克
                const analyseResultNext = this.analyseCardData(nextDataArr)
                const analyseResultFirst = this.analyseCardData(firstDataArr)
                //四条数值
                if (analyseResultFirst.fourCount > 0) {
                    let nextValue = analyseResultNext.fourLogicValue[0]
                    let firstValue = analyseResultFirst.fourLogicValue[0]
                    //比较四条
                    if (firstValue !== nextValue) return (firstValue > nextValue) ? 2 : 1
                    //比较单牌
                    firstValue = analyseResultFirst.singleLogicValue[0]
                    nextValue = analyseResultFirst.singleLogicValue[0]
                    if (firstValue !== nextValue) return (firstValue > nextValue) ? 2 : 1
                    else return 0
                }
                //三条数值
                if (analyseResultFirst.threeCount > 0) {
                    let nextValue = analyseResultNext.threeLogicValue[0]
                    let firstValue = analyseResultFirst.threeLogicValue[0]
                    //比较三条
                    if (firstValue !== nextValue) return (firstValue > nextValue) ? 2 : 1
                    //葫芦牌型
                    if (DZCardType.HU_LU === firstType) {
                        //比较对牌
                        firstValue = analyseResultFirst.doubleLogicValue[0]
                        nextValue = analyseResultFirst.doubleLogicValue[0]
                        if (firstValue !== nextValue) return (firstValue > nextValue) ? 2 : 1
                        else return 0
                    } else {
                        //散牌数值
                        for (let i = 0; i < analyseResultFirst.singleLogicValue.length; i++) {
                            const nextValue = analyseResultNext.singleLogicValue[i]
                            const firstValue = analyseResultFirst.singleLogicValue[i]
                            //大
                            if (firstValue > nextValue) return 2
                            //小
                            else if (firstValue < nextValue) return 1
                            //等
                            else if (i === (analyseResultFirst.singleCount - 1)) return 0
                        }
                    }
                }

                //对子数值
                for (let i = 0; i < analyseResultFirst.doubleCount; i++) {
                    const nextValue = analyseResultNext.doubleLogicValue[i]
                    const firstValue = analyseResultFirst.doubleLogicValue[i]
                    //大
                    if (firstValue > nextValue) return 2
                    //小
                    else if (firstValue < nextValue) return 1
                }

                //比较单牌
                {
                    //散牌数值
                    for (let i = 0; i < analyseResultFirst.singleCount; i++) {
                        const nextValue = analyseResultNext.singleLogicValue[i]
                        const firstValue = analyseResultFirst.singleLogicValue[i]
                        // 大
                        if (firstValue > nextValue) return 2
                        // 小
                        else if (firstValue < nextValue) return 1
                        // 等
                        else if (i === (analyseResultFirst.singleCount - 1)) return 0
                    }
                }
                break
            }
            case DZCardType.SHUN_ZI:
            case DZCardType.TONG_HUA_SHUN: {
                // 数值判断
                const nextValue = this.getCardLogicValue(nextDataArr[0])
                const firstValue = this.getCardLogicValue(firstDataArr[0])

                const isFirstmin = (firstValue === (this.getCardLogicValue(firstDataArr[1]) + 9))
                const isNextmin = (nextValue === (this.getCardLogicValue(nextDataArr[1]) + 9))

                //大小顺子
                if (isFirstmin && !isNextmin) return 1
                //大小顺子
                else if (!isFirstmin && isNextmin) return 2
                //等同顺子
                else {
                    //平
                    if (firstValue === nextValue) return 0
                    return (firstValue > nextValue) ? 2 : 1
                }
            }
            case DZCardType.TONG_HUA: {
                //散牌数值
                for (let i = 0; i < firstDataArr.length; i++) {
                    const nextValue = this.getCardLogicValue(nextDataArr[i])
                    const firstValue = this.getCardLogicValue(firstDataArr[i])
                    // 大
                    if (firstValue > nextValue) return 2
                    // 小
                    else if (firstValue < nextValue) return 1
                    // 平
                    else if (i === firstDataArr.length - 1) return 0
                }
            }
        }
        return 0
    }

    static selectMaxUser(allUserCardArr) {
        const winnerList = []
        // First数据
        let winnerID: number
        for (let i = 0; i < allUserCardArr.length; i++) {
            if (allUserCardArr[i]) {
                winnerID = i
                break
            }
            //过滤全零
            if (i === allUserCardArr.length - 1) return winnerList
        }
        //查找最大用户
        for (let i = winnerID + 1; i < allUserCardArr.length; i++) {
            if (!allUserCardArr[i]) continue
            if (this.compareCard(allUserCardArr[i], allUserCardArr[winnerID]) > 1) {
                winnerID = i
            }
        }

        //查找相同数据
        winnerList.push(winnerID)
        for (let i = 0; i < allUserCardArr.length; i++) {
            if (i === winnerID || !allUserCardArr[i]) continue
            if (this.compareCard(allUserCardArr[i], allUserCardArr[winnerID]) === 0) {
                winnerList.push(i)
            }
        }
        return winnerList
    }

    static getKeyCardArr(cardDataArr) {
        if (cardDataArr.length < 5) return
        const cardType = this.getCardType(cardDataArr)
        // 单牌显示最大的一张
        switch (cardType) {
            case DZCardType.SINGLE:
                // eslint-disable-next-line no-case-declarations
                let maxCardData = cardDataArr[0]
                for (let i = 1; i < cardDataArr.length; ++i) {
                    if (this.getCardLogicValue(maxCardData) < this.getCardLogicValue(cardDataArr[i])) {
                        maxCardData = cardDataArr[i]
                    }
                }
                return [maxCardData]
            case DZCardType.ONE_DOUBLE:
            case DZCardType.TWO_DOUBLE:
            case DZCardType.THREE:
            case DZCardType.TIE_ZHI:
                // eslint-disable-next-line no-case-declarations
                const result = {
                    singleCardData: [],
                    doubleCardData: [],
                    threeCardData: [],
                    fourCardData: []
                }
                //扑克分析
                for (let i = 0; i < cardDataArr.length; i++) {
                    //变量定义
                    let sameCount = 1
                    const sameCardData = [cardDataArr[i], 0, 0, 0]
                    const logicValue = this.getCardLogicValue(cardDataArr[i])
                    //获取同牌
                    for (let j = i + 1; j < cardDataArr.length; j++) {
                        //逻辑对比
                        if (this.getCardLogicValue(cardDataArr[j]) !== logicValue) break
                        //设置扑克
                        sameCardData[sameCount++] = cardDataArr[j]
                    }
                    //保存结果
                    switch (sameCount) {
                        case 1: {
                            result.singleCardData.push(sameCardData[0])
                            break
                        }
                        case 2: {
                            result.doubleCardData.push(sameCardData[0])
                            result.doubleCardData.push(sameCardData[1])
                            break
                        }
                        case 3: {
                            result.threeCardData.push(sameCardData[0])
                            result.threeCardData.push(sameCardData[1])
                            result.threeCardData.push(sameCardData[2])
                            break
                        }
                        case 4: {
                            result.fourCardData.push(sameCardData[0])
                            result.fourCardData.push(sameCardData[1])
                            result.fourCardData.push(sameCardData[2])
                            result.fourCardData.push(sameCardData[3])
                            break
                        }
                    }
                    //设置递增
                    i += (sameCount - 1)
                }
                if (cardType === DZCardType.ONE_DOUBLE || cardType === DZCardType.TWO_DOUBLE) {
                    return result.doubleCardData
                } else if (cardType === DZCardType.THREE) {
                    return result.threeCardData
                } else if (cardType === DZCardType.TIE_ZHI) {
                    return result.fourCardData
                }
                break
            default:
                return cardDataArr
        }
    }
}

