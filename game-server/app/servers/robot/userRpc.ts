import {FrontendSession, RemoterClass} from 'pinus'
import {ControllerRemoter} from './remote/controllerRemoter'
import {NotifyRemoter} from './remote/notifyRemoter'
import {RobotRemoter} from './remote/robotRemoter'

// UserRpc的命名空间自动合并
declare global {
    interface UserRpc {
        robot: {
            // 控制器
            controllerRemoter: RemoterClass<FrontendSession, ControllerRemoter>;
            notifyRemoter: RemoterClass<FrontendSession, NotifyRemoter>;
            robotRemoter: RemoterClass<FrontendSession, RobotRemoter>;
        };
    }
}
