import type { SvgIconComponent } from '@mui/icons-material';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import { COPY } from '../../data/copy';
import type { AIEngineType } from '../../types/routine';

export interface EngineMeta {
  label: string;
  icon: SvgIconComponent;
}

/** Shared label and MUI icon mapping for assistant inference engines. */
export function getEngineMeta(engine: AIEngineType, copy = COPY): EngineMeta {
  switch (engine) {
    case 'on-device-gemma':
      return { label: copy.assistant.engines.onDeviceGemma, icon: BoltOutlinedIcon };
    case 'server-gemma':
      return { label: copy.assistant.engines.serverGemma, icon: MemoryOutlinedIcon };
    case 'cloud-gemini':
      return { label: copy.assistant.engines.cloudGemini, icon: CloudOutlinedIcon };
    case 'local-rules':
      return { label: copy.assistant.engines.localRules, icon: LockOutlinedIcon };
  }
}
