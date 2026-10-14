import type { SvgIconComponent } from '@mui/icons-material';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { COPY } from './copy';

export const ROUTES = {
  landing: '/',
  routine: '/routine',
  dashboard: '/dashboard',
  community: '/community',
  login: '/login',
  signup: '/signup'
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: SvgIconComponent;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { href: ROUTES.routine, label: COPY.nav.today, icon: TaskAltIcon, end: true },
  { href: ROUTES.dashboard, label: COPY.nav.stats, icon: BarChartRoundedIcon },
  { href: ROUTES.community, label: COPY.nav.community, icon: PeopleAltOutlinedIcon }
];