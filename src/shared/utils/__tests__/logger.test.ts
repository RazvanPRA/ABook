import { logger } from '../logger';

describe('logger', () => {
  it('prefixes development warnings and forwards the details', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('invalid value', { key: 'abk:settings' });
    expect(warn).toHaveBeenCalledWith('[abook] invalid value', {
      key: 'abk:settings',
    });
    warn.mockRestore();
  });
});
