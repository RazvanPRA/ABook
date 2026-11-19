import {
  Book,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  Circle,
  Download,
  Ellipsis,
  FileHeadphone,
  Headphones,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Trash,
  Upload,
  X,
} from 'lucide-react-native';

/** Lucide icons used by the mockups, under stable app names (kebab-case, like Lucide's own). */
export const icons = {
  book: Book,
  bookmark: Bookmark,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  circle: Circle,
  download: Download,
  'file-headphone': FileHeadphone,
  headphones: Headphones,
  moon: Moon,
  'more-horizontal': Ellipsis,
  pause: Pause,
  play: Play,
  plus: Plus,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  search: Search,
  settings: Settings,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  'sliders-horizontal': SlidersHorizontal,
  trash: Trash,
  upload: Upload,
  x: X,
} as const;

export type IconName = keyof typeof icons;

/** Playback glyphs are drawn filled in the mockups. */
export const FILLED_BY_DEFAULT: ReadonlySet<IconName> = new Set<IconName>([
  'play',
  'pause',
]);
