import { errorCodes } from '@react-native-documents/picker';
import { createDocumentsPdfPicker, FALLBACK_PDF_NAME } from '..';

type Pick = NonNullable<Parameters<typeof createDocumentsPdfPicker>[0]>;

const picker = (impl: () => Promise<unknown>) =>
  createDocumentsPdfPicker(jest.fn(impl) as unknown as Pick);

const file = (overrides: object = {}) => ({
  uri: 'content://com.android.providers.downloads/document/12',
  name: 'ion-rebreanu.pdf',
  size: 3_800_000,
  ...overrides,
});

describe('createDocumentsPdfPicker', () => {
  it('asks for PDFs only and returns name, uri and size', async () => {
    const pick = jest.fn(async () => [file()]);
    const result = await createDocumentsPdfPicker(
      pick as unknown as Pick,
    ).pickPdf();
    expect(pick).toHaveBeenCalledWith({ type: ['application/pdf'] });
    expect(result).toEqual({
      name: 'ion-rebreanu.pdf',
      uri: file().uri,
      sizeBytes: 3_800_000,
    });
  });

  it('falls back on a name and a 0 size the provider does not give', async () => {
    const result = await picker(async () => [
      file({ name: '  ', size: null }),
    ]).pickPdf();
    expect(result).toMatchObject({ name: FALLBACK_PDF_NAME, sizeBytes: 0 });
    const noName = await picker(async () => [file({ name: null })]).pickPdf();
    expect(noName?.name).toBe(FALLBACK_PDF_NAME);
  });

  it('returns null when the user closes the picker, or nothing comes back', async () => {
    const cancelled = Object.assign(new Error('closed'), {
      code: errorCodes.OPERATION_CANCELED,
    });
    await expect(
      picker(() => Promise.reject(cancelled)).pickPdf(),
    ).resolves.toBeNull();
    await expect(picker(async () => []).pickPdf()).resolves.toBeNull();
  });

  it('rethrows any other error', async () => {
    const busy = Object.assign(new Error('busy'), {
      code: errorCodes.IN_PROGRESS,
    });
    await expect(picker(() => Promise.reject(busy)).pickPdf()).rejects.toBe(
      busy,
    );
    const plain = new Error('boom');
    await expect(picker(() => Promise.reject(plain)).pickPdf()).rejects.toBe(
      plain,
    );
  });
});
