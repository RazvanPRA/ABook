import type { BootRepository } from '@/repositories';
import { InMemoryFileStore, InMemoryKeyValueStore } from '@/storage/testing';
import { createAppServices, type AppServices } from '../dependencies';

/** The real repositories over in-memory stores, as `App` would use them on a device. */
export const fakeServices = () => {
  const kv = new InMemoryKeyValueStore();
  const files = new InMemoryFileStore();
  return { kv, files, services: createAppServices({ kv, files }) };
};

/** Services whose boot repository is replaced (e.g. a slow or failing one). */
export const withBoot = (
  services: AppServices,
  boot: Partial<BootRepository>,
): AppServices => ({
  ...services,
  bootRepository: { ...services.bootRepository, ...boot },
});
