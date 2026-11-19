import type { SvgIconComponent } from '@mui/icons-material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import FlightOutlinedIcon from '@mui/icons-material/FlightOutlined';
import HealingOutlinedIcon from '@mui/icons-material/HealingOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SmokeFreeOutlinedIcon from '@mui/icons-material/SmokeFreeOutlined';
import SmokingRoomsOutlinedIcon from '@mui/icons-material/SmokingRoomsOutlined';
import TrainOutlinedIcon from '@mui/icons-material/TrainOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import type { RegionalLifestyleTag } from '../types/auth';

/** Strips any legacy leading pictograph/emoji prefix and formats snake_case rhythm IDs cleanly. */
export function formatLifestyleTagLabel(tag: string): string {
  const cleaned = tag.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim();
  if (/^[a-z0-9_]+$/.test(cleaned) && cleaned.includes('_')) {
    return cleaned
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return cleaned;
}

const KEYWORD_ICON_RULES: ReadonlyArray<{ keywords: readonly string[]; icon: SvgIconComponent }> = [
  { keywords: ['intermittent'], icon: AccessTimeOutlinedIcon },
  { keywords: ['ramadan', 'fasting', 'periodic', 'lent', 'ekadashi'], icon: NightsStayOutlinedIcon },
  { keywords: ['dinner', 'siesta', 'dawn', 'sabbath', 'household', 'family'], icon: ScheduleOutlinedIcon },
  { keywords: ['healthcare', 'shift', 'hospital', 'night'], icon: LocalHospitalOutlinedIcon },
  { keywords: ['desk', 'sedentary', 'screen', 'office'], icon: LaptopMacOutlinedIcon },
  { keywords: ['travel', 'flight'], icon: FlightOutlinedIcon },
  { keywords: ['commute', 'train'], icon: TrainOutlinedIcon },
  { keywords: ['non-smoker', 'tapering', 'smoke-free'], icon: SmokeFreeOutlinedIcon },
  { keywords: ['midwakh', 'dokha', 'shisha', 'waterpipe', 'moassel', 'vape', 'cigarette', 'smok'], icon: SmokingRoomsOutlinedIcon },
  { keywords: ['winter', 'sunlight', 'vit d'], icon: CloudOutlinedIcon },
  { keywords: ['heat', 'summer'], icon: WbSunnyOutlinedIcon },
  { keywords: ['caffeine', 'coffee'], icon: LocalCafeOutlinedIcon },
  { keywords: ['joint', 'knee', 'back', 'mobility', 'caution', 'pain'], icon: HealingOutlinedIcon }
];

const CATEGORY_ICONS: Record<RegionalLifestyleTag['category'], SvgIconComponent> = {
  schedule: ScheduleOutlinedIcon,
  substance: SmokingRoomsOutlinedIcon,
  culture: NightsStayOutlinedIcon,
  physical: HealingOutlinedIcon,
  environment: WbSunnyOutlinedIcon
};

/** Maps a lifestyle tag label or category to a consistent MUI icon. */
export function getLifestyleTagIcon(
  tag: string,
  category?: RegionalLifestyleTag['category']
): SvgIconComponent {
  const normalized = formatLifestyleTagLabel(tag).toLowerCase();

  for (const rule of KEYWORD_ICON_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.icon;
    }
  }

  if (category && CATEGORY_ICONS[category]) {
    return CATEGORY_ICONS[category];
  }

  return LabelOutlinedIcon;
}
