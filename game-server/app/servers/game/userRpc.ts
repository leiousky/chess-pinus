import {NotifyRemoter} from './remote/notifyRemoter'
import {FrontendSession, RemoterClass} from 'pinus'
import {RoomRemoter} from './remote/roomRemoter'

// UserRpc的命名空间自动合并
declare global {
    interface UserRpc {
        game: {
            // 一次性定义一个类自动合并到UserRpc中
            notifyRemoter: RemoterClass<FrontendSession, NotifyRemoter>;
            roomRemoter: RemoterClass<FrontendSession, RoomRemoter>;
        };
    }
}
