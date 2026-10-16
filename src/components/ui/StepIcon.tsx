import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import ShowerOutlinedIcon from '@mui/icons-material/ShowerOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import type { StepIconKey } from '../../types/routine';
import { Icon, type IconSize } from './Icon';

const ICONS: Record<StepIconKey, SvgIconComponent> = {
  'straight-knee': AccessibilityNewIcon,
  'bent-knee': DirectionsWalkIcon,
  stretch: SelfImprovementIcon,
  serum: WaterDropOutlinedIcon,
  microneedle: BlurOnIcon,
  shampoo: ShowerOutlinedIcon,
  fitness: FitnessCenterOutlinedIcon,
  pill: MedicationOutlinedIcon,
  timer: HourglassEmptyIcon,
  heart: MonitorHeartOutlinedIcon,
  science: ScienceOutlinedIcon,
  water: WaterDropOutlinedIcon,
  brain: PsychologyOutlinedIcon,
  sleep: BedtimeOutlinedIcon,
  sun: WbSunnyOutlinedIcon,
  diet: RestaurantOutlinedIcon,
  walk: DirectionsWalkIcon,
  check: TaskAltIcon
};

interface StepIconProps {
  icon: StepIconKey;
  size?: IconSize;
}

export function StepIcon({ icon, size = 'xl' }: StepIconProps) {
  const SvgIcon = ICONS[icon] || ScienceOutlinedIcon;
  return <Icon icon={SvgIcon} size={size} />;
}