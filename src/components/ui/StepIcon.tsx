import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import ShowerOutlinedIcon from '@mui/icons-material/ShowerOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import type { StepIconKey } from '../../types/protocol';
import { Icon, type IconSize } from './Icon';

const ICONS: Record<StepIconKey, SvgIconComponent> = {
  'straight-knee': AccessibilityNewIcon,
  'bent-knee': DirectionsWalkIcon,
  stretch: SelfImprovementIcon,
  serum: WaterDropOutlinedIcon,
  microneedle: BlurOnIcon,
  shampoo: ShowerOutlinedIcon
};

interface StepIconProps {
  icon: StepIconKey;
  size?: IconSize;
}

export function StepIcon({ icon, size = 'xl' }: StepIconProps) {
  return <Icon icon={ICONS[icon]} size={size} />;
}