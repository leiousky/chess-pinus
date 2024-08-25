import fetch from 'node-fetch'
import * as config from '../../config'
import BaseService from './base'

const paypalConfig = config.paypal

// paypal 支付
export default class PaypalService extends BaseService {
    clientId: string
    secret: string
    baseUrl: string
    returnUrl: string
    cancelUrl: string

    constructor() {
        super()
        this.clientId = paypalConfig.clientId
        this.secret = paypalConfig.secret
        this.baseUrl = paypalConfig.baseUrl
        this.returnUrl = paypalConfig.returnUrl
        this.cancelUrl = paypalConfig.cancelUrl
    }

    // 生成access token
    async generateAccessToken(): Promise<string> {
        try {
            const auth = Buffer.from(
                this.clientId + ':' + this.secret
            ).toString('base64')
            const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
                method: 'POST',
                body: 'grant_type=client_credentials',
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            })

            const data = await response.json() as any
            return data.access_token
        } catch (error) {
            console.error('Failed to generate Access Token:', error)
            return ''
        }
    }

    /**
     * Create an order to start the transaction.
     * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
     */
    async createOrder(amount) {
        const accessToken = await this.generateAccessToken()
        const url = `${this.baseUrl}/v2/checkout/orders`

        const payload = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: amount.toString(),
                    },
                },
            ],
            payment_source: {
                paypal: {
                    experience_context: {
                        // 支付成功的返回地址
                        return_url: this.returnUrl,
                        // 未支付的返回地址
                        cancel_url: this.cancelUrl,
                    }
                }
            }
        }

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            method: 'POST',
            body: JSON.stringify(payload),
        })
        const resp = await this.handleResponse(response)
        if (resp.isOk) {
            // TODO 关联订单号
            // const paypalOrderId = resp.id
            // 返回支付链接
            const approved = resp.jsonResponse.links.filter(value => value.rel === 'approve')
            if (approved.length !== 1) {
                return {isOk: false}
            }
            return {isOk: true, payUrl: approved[0].href}
        } else {
            // 支付失败
            return {isOk: false}
        }
    }

    // 把用户的账户上的钱，迁到商家账号
    async captureOrder(paypalOrderId: string) {
        const accessToken = await this.generateAccessToken()
        const url = `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            method: 'POST',
            // body: JSON.stringify(payload),
        })

        const resp = await this.handleResponse(response)
        if (resp.isOk) {
            return resp.jsonResponse.status === 'COMPLETED'
        } else {
            console.error('capture order fail')
            return false
        }
    }

    async handleResponse(response) {
        try {
            const jsonResponse = await response.json()
            console.log('get response', jsonResponse)
            return {
                isOk: true,
                jsonResponse,
                httpStatusCode: response.status,
            }
        } catch (err) {
            const errorMessage = await response.text()
            console.error('get error response', errorMessage)
            return {
                isOk: false,
            }
        }
    }
}
