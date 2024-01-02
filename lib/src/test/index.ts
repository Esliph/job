import { Bootstrap } from '../controllers/bootstrap'
import { Cron } from '../controllers/cron'
import { Job } from '../controllers/job'

@Job({ name: 'my-job', cronTime: '*/5 * * * * *', start: false, alreadyStart: false })
class MyJob {
    constructor() { }

    @Cron({ name: 'hello', start: true })
    helloWorld() {
        console.log('Hello!')
    }
}

Bootstrap([MyJob])