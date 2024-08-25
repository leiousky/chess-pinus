import {RemoterClass, FrontendSession} from 'pinus'
import {NotifyRemoter} from './remote/notifyRemoter'
import {GateRemoter} from './remote/gateRemoter'

// UserRpc的命名空间自动合并
declare global {
    interface UserRpc {
        connector: {
            // 网关操作
            gateRemoter: RemoterClass<FrontendSession, GateRemoter>;
            // 服务器接收通知
            notifyRemoter: RemoterClass<FrontendSession, NotifyRemoter>;
        };
    }
}
