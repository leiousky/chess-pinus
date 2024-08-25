import {Application, FrontendSession} from 'pinus'

export default function (app: Application) {
    return new Handler(app)
}

// center 服
export class Handler {
    constructor(private app: Application) {

    }
}
