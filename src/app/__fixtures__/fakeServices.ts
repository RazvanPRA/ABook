import type { BootRepository } from '@/repositories';
import { FakePlaybackNotifier, FakeTtsEngine } from '@/services/tts/testing';
import { InMemoryFileStore, InMemoryKeyValueStore } from '@/storage/testing';
import { createAppServices, type AppServices } from '../dependencies';

/** The real repositories over in-memory stores and a fake voice, as `App` would use them. */
export const fakeServices = () => {
  const kv = new InMemoryKeyValueStore();
  const files = new InMemoryFileStore();
  const tts = new FakeTtsEngine();
  const notifier = new FakePlaybackNotifier();
  const services: AppServices = {
    ...createAppServices({ kv, files }),
    ttsEngine: tts,
    playbackNotifier: notifier,
  };
  return { kv, files, tts, notifier, services };
};

/** Services whose boot repository is replaced (e.g. a slow or failing one). */
export const withBoot = (
  services: AppServices,
  boot: Partial<BootRepository>,
): AppServices => ({
  ...services,
  bootRepository: { ...services.bootRepository, ...boot },
});
