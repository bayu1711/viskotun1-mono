import { describe, expect, it } from 'vitest';
import HealingOutlinedIcon from '@mui/icons-material/HealingOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined';
import SmokeFreeOutlinedIcon from '@mui/icons-material/SmokeFreeOutlined';
import SmokingRoomsOutlinedIcon from '@mui/icons-material/SmokingRoomsOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import { formatLifestyleTagLabel, getLifestyleTagIcon } from '../lifestyleTags';

describe('lifestyleTags helper', () => {
  it('preserves clean labels and strips legacy leading emojis', () => {
    expect(formatLifestyleTagLabel('Ramadan Fasting Observer')).toBe('Ramadan Fasting Observer');
    expect(formatLifestyleTagLabel('🌙 Ramadan Fasting Observer')).toBe('Ramadan Fasting Observer');
    expect(formatLifestyleTagLabel('🌧️ Low Winter Sunlight / Vit D')).toBe('Low Winter Sunlight / Vit D');
    expect(formatLifestyleTagLabel('✈️ Frequent Travel')).toBe('Frequent Travel');
    expect(formatLifestyleTagLabel('12-hour shifts')).toBe('12-hour shifts');
  });

  it('maps lifestyle tags and categories to consistent MUI icons', () => {
    expect(getLifestyleTagIcon('Ramadan Fasting Observer')).toBe(NightsStayOutlinedIcon);
    expect(getLifestyleTagIcon('Midwakh / Dokha Tobacco')).toBe(SmokingRoomsOutlinedIcon);
    expect(getLifestyleTagIcon('Non-Smoker')).toBe(SmokeFreeOutlinedIcon);
    expect(getLifestyleTagIcon('Healthcare Shift Work')).toBe(LocalHospitalOutlinedIcon);
    expect(getLifestyleTagIcon('Desk-bound Sedentary (>8 hrs)')).toBe(LaptopMacOutlinedIcon);
    expect(getLifestyleTagIcon('Gulf Summer Heat Adaptation')).toBe(WbSunnyOutlinedIcon);
    expect(getLifestyleTagIcon('Knee sensitivity')).toBe(HealingOutlinedIcon);
    expect(getLifestyleTagIcon('Custom note')).toBe(LabelOutlinedIcon);
    expect(getLifestyleTagIcon('Custom physical note', 'physical')).toBe(HealingOutlinedIcon);
  });
});
