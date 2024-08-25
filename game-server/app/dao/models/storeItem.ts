import {Schema, model} from 'mongoose'
import {ItemType} from '../../constants/item'

// 商品表
export interface IStoreItem {
    itemId: ItemType
    price: number
    days: number
    currency: string
}

// 商品表
const schema = new Schema<IStoreItem>({
    // 道具类型 item
    itemId: {
        type: Number,
        default: 0,
    },
    // 价格
    price: {
        type: Number,
        default: 0,
    },
    // 有效天数
    days: {
        type: Number,
        default: 0,
    },
    // 货币单位，非 cny
    currency: {
        type: String,
        default: 'USD'
    }
})

// 商品表
const storeItemModel = model<IStoreItem>('storeItem', schema)

export class StoreItemModel {

    // 所有商品
    static async allGoods() {
        return storeItemModel.find()
    }
}
