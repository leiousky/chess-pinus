import {ServiceType} from './index'

/** service基类
 * 不能用 static 方法
 */
export default class BaseService {
    services: ServiceType

    constructor() {}
}
