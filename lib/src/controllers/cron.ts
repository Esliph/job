import { CronJobParams } from 'cron'
import { Decorator } from '@esliph/decorator'
import { ClassConstructor, Metadata } from '@esliph/metadata'
import { METADATA_KEY_CRON, METADATA_KEY_CRON_OPTIONS } from '../constants'

export type CronOptions = { name: string, alreadyStart?: boolean } & Partial<CronJobParams>

export function Cron(option: Partial<CronOptions>) {
    function handle(target: any, key: string, descriptor: PropertyDescriptor) {
        Metadata.Create.Method({ key: METADATA_KEY_CRON, value: true }, target, key)
        Metadata.Create.Method({ key: METADATA_KEY_CRON_OPTIONS, value: option }, target, key)
    }

    return Decorator.Create.Method(handle)
}

export function isCron(constructor: ClassConstructor, methodName: string) {
    return !!Metadata.Get.Method<boolean>(METADATA_KEY_CRON, constructor, methodName)
}