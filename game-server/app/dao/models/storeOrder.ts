import {Schema, model, Types} from 'mongoose'
import {OrderStatus} from '../../constants/game'
import {ItemType} from '../../constants/item'

// 商品订单
export interface IStoreOrder {
    // 商品 id
    storeItemId: Types.ObjectId
    // 商品价格
    storePrice: number
    // 购买的 itemId
    itemId: ItemType
    // 有效天数
    days: number
    // 需要支付的金额
    payPrice: number
    // 货币币种
    currency: string
    // paypal 订单号
    paypalOrderId: string
    // 订单状态
    status: OrderStatus
    // 创建时间
    createdAt: Date
    // 支付完成时间
    completedAt: Date
}

// 商品订单
const schema = new Schema<IStoreOrder>({
    storeItemId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    storePrice: {
        type: Number,
        default: 0,
    },
    itemId: {
        type: Number,
        default: 0,
    },
    days: {
        type: Number,
        default: 0,
    },
    payPrice: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    paypalOrderId: {
        type: String,
        default: '',
    },
    status: {
        type: Number,
        default: OrderStatus.created,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
    completedAt: {
        type: Date,
        default: new Date(),
    }
})

// 商品订单
const storeOrderModel = model<IStoreOrder>('storeOrder', schema)

export class StoreOrderModel {

    // 新建订单
    static async newOrder(m: IStoreOrder) {
        return await storeOrderModel.create(m)
    }

    // 更新 paypal 订单号
    static async updatePaypalOrder(orderId: string, paypalOrderId: string) {
        const order = await storeOrderModel.findById(orderId)
        if (!order) {
            // 订单不存在
            return false
        }
        order.paypalOrderId = paypalOrderId
        await order.save()
    }

    // 完成订单
    static async completedOrder(orderId: string) {
        const order = await storeOrderModel.findById(orderId)
        if (!order) {
            // 订单不存在
            return false
        }
        order.status = OrderStatus.completed
        order.completedAt = new Date()
        await order.save()
    }
}
