import type { SvgIconComponent } from '@mui/icons-material';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { COPY } from './copy';
import type { LocaleCopy } from './locales/types';

export const ROUTES = {
  landing: '/',
  about: '/about',
  uae: '/uae',
  routine: '/routine',
  dashboard: '/dashboard',
  community: '/community',
  profile: '/profile',
  login: '/login',
  signup: '/signup',
  admin: '/admin',
  legal: '/legal',
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  termsOfUse: '/legal/terms-of-use',
  disclaimer: '/legal/disclaimer',
  cookies: '/legal/cookies',
  aiTransparency: '/legal/ai-transparency'
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: SvgIconComponent;
  end?: boolean;
}

export function getNavItems(copy: LocaleCopy = COPY as unknown as LocaleCopy): NavItem[] {
  return [
    { href: ROUTES.routine, label: copy.nav.today, icon: TaskAltIcon, end: true },
    { href: ROUTES.dashboard, label: copy.nav.stats, icon: BarChartRoundedIcon },
    { href: ROUTES.community, label: copy.nav.community, icon: PeopleAltOutlinedIcon }
  ];
}

export const navItems: NavItem[] = getNavItems();