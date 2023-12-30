import { Metadata } from '@esliph/metadata'

export type ClassConstructor<T = any> = new (...args: any[]) => T

export function getMethodsInClassByMetadataKey<Metadata = any>(classConstructor: ClassConstructor, key: string) {
    return getMethodNamesByClass(classConstructor)
        .map(methodName => ({ method: methodName, metadata: Metadata.Get.Method<Metadata>(key, classConstructor, methodName) }))
        .filter(({ metadata }) => !!metadata)
}

export function getMethodNamesByClass({ prototype }: ClassConstructor) {
    return Object.getOwnPropertyNames(prototype).filter(name => typeof prototype[name] === 'function' && name !== 'constructor') as string[]
}