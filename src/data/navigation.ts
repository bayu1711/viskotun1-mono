import type { SvgIconComponent } from '@mui/icons-material';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { COPY } from './copy';

export const ROUTES = {
  routine: '/',
  dashboard: '/dashboard',
  community: '/community'
} as const;

export interface NavItem {
  to: string;
  label: string;
  icon: SvgIconComponent;
  end?: boolean;
}

export const navItems: NavItem[] = [
{ to: ROUTES.routine, label: COPY.nav.today, icon: TaskAltIcon, end: true },
{ to: ROUTES.dashboard, label: COPY.nav.stats, icon: BarChartRoundedIcon },
{ to: ROUTES.community, label: COPY.nav.community, icon: PeopleAltOutlinedIcon }];