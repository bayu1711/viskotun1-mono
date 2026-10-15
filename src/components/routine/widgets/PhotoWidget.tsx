'use client';

import React, { useRef } from 'react';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/protocol';
import { CircleButton } from '../../ui/CircleButton';
import { Icon } from '../../ui/Icon';
import { PillButton } from '../../ui/PillButton';

interface PhotoWidgetProps {
  field: DataCollectionField;
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_DEMO_PHOTO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f7f5f0"/><circle cx="200" cy="150" r="80" fill="%23eedcc6"/><ellipse cx="200" cy="140" rx="35" ry="25" fill="%23dfcaa9" opacity="0.8"/><text x="200" y="270" font-family="sans-serif" font-size="12" fill="%232b2927" text-anchor="middle">Milestone Clinical Photograph</text></svg>`;

export function PhotoWidget({ field, value, onChange }: PhotoWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPhoto = typeof value === 'string' && value.length > 0 ? value : '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      {currentPhoto ? (
        <div className="mt-4 flex flex-col items-center">
          <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-tile border border-ink/15 bg-canvas shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto}
              alt={COPY.morphing.widgets.photo.previewAlt}
              className="h-full w-full object-cover"
            />
            <div className="absolute right-2 top-2">
              <CircleButton
                label="Remove photo"
                size={36}
                onClick={() => onChange('')}
                className="bg-white/90 backdrop-blur"
              >
                <Icon icon={DeleteOutlineIcon} size="sm" />
              </CircleButton>
            </div>
          </div>
          <p className="mt-2 text-2xs text-ink/45 lowercase">
            ✓ photo attached to milestone record
          </p>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-tile border-2 border-dashed border-ink/20 bg-ink/5 p-6 text-center transition-colors hover:border-ink/40 hover:bg-ink/10"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-sm">
            <Icon icon={CameraAltOutlinedIcon} size="md" />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">
            {COPY.morphing.widgets.photo.uploadPrompt}
          </p>
          <p className="mt-1 text-2xs text-ink/50">
            {COPY.morphing.widgets.photo.dropHint}
          </p>

          <div className="mt-4 flex gap-2">
            <PillButton
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Icon icon={UploadFileOutlinedIcon} size="sm" className="mr-1 inline" />
              Upload file
            </PillButton>
            <PillButton
              type="button"
              variant="inverse"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChange(DEFAULT_DEMO_PHOTO);
              }}
            >
              Load Demo Capture
            </PillButton>
          </div>
        </div>
      )}

      {field.instructions && (
        <div className="mt-4 rounded-tile bg-ink/5 p-3 text-2xs text-ink/75 leading-relaxed text-left">
          <p className="font-semibold text-ink">
            {COPY.morphing.widgets.photo.instructionsLabel}
          </p>
          <p className="mt-1">{field.instructions}</p>
        </div>
      )}
    </div>
  );
}
