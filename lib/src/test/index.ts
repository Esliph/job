import { JobProvider } from '../controllers'
import { Cron } from '../controllers/cron'
import { Job } from '../controllers/job'

@Job({ name: 'my-job', cronTime: '*/5 * * * * *', start: false, executeInStart: false })
class MyJob {
    constructor() { }

    @Cron({ name: 'hello', start: true })
    helloWorld() {
        console.log('Hello!')
    }
}

const controller = new JobProvider()

controller.fabric({
    jobs: [MyJob]
})

const job = controller.getJobByName('my-job.hello')!

if (job) {
    setTimeout(() => {
        job.stop()
    }, 1000 * 3)

    setTimeout(() => {
        job.start()
    }, 1000 * 6)
}