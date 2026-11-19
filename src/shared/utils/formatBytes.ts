import { formatDecimal } from './formatDecimal';

/** Unit suffixes, from `format.bytes` in ro.json. */
export interface ByteUnits {
  B: string;
  KB: string;
  MB: string;
  GB: string;
}

const ORDER = ['B', 'KB', 'MB', 'GB'] as const;
const STEP = 1024;
/** B and KB are whole numbers ("512 KB"); MB and GB keep one decimal ("1,2 MB"). */
const DECIMALS = { B: 0, KB: 0, MB: 1, GB: 1 } as const;

/** Human file size: "512 KB", "1,2 MB". Negative or NaN sizes count as 0. */
export const formatBytes = (bytes: number, units: ByteUnits): string => {
  let value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let index = 0;
  while (index < ORDER.length - 1) {
    const unit = ORDER[index] ?? 'B';
    const rounded = Number(value.toFixed(DECIMALS[unit]));
    if (rounded < STEP) {
      break;
    }
    value /= STEP;
    index += 1;
  }
  const unit = ORDER[index] ?? 'B';
  return `${formatDecimal(value, DECIMALS[unit])} ${units[unit]}`;
};
