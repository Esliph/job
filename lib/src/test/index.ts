import { Bootstrap } from '../controllers/bootstrap'
import { Cron } from '../controllers/cron'
import { Job } from '../controllers/job'

@Job({ name: 'my-job', cronTime: '*/5 * * * * *', start: false, alreadyStart: false, ignore: false })
class MyJob {
    constructor() { }

    @Cron({ name: 'hello', start: true })
    helloWorld() {
        console.log('Hello!')
    }
}

const controller = Bootstrap({
    jobs: [MyJob]
})

const job = controller.getJobByName('my-job.hello')!

setTimeout(() => {
    job.stop()
}, 1000 * 3)

setTimeout(() => {
    job.start()
}, 1000 * 6)