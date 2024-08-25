import * as crc from 'crc'
import { ServerInfo } from 'pinus'

export function dispatch(s: string , connectors: ServerInfo[]) {
    const index = Math.abs(crc.crc32(s)) % connectors.length
    return connectors[index]
}
