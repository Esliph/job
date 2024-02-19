import { ClassConstructor } from '@esliph/metadata'
import { JobController } from './controller'

export function Bootstrap({ jobs }: { jobs: ClassConstructor[] }) {
    JobController.fabric({ jobs })

    return new JobController()
}
