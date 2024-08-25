import {RemoterClass, FrontendSession} from 'pinus'
import {ArenaRemoter} from './remote/arenaRemoter'

// UserRpc的命名空间自动合并
declare global {
    interface UserRpc {
        arena: {
            // 竞技场
            arenaRemoter: RemoterClass<FrontendSession, ArenaRemoter>;
        };
    }
}
