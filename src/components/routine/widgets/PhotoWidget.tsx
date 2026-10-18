'use client';

import React, { useRef, useState } from 'react';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { toast } from 'sonner';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/routine';
import { Spinner } from '../../feedback/Spinner';
import { CircleButton } from '../../ui/CircleButton';
import { Icon } from '../../ui/Icon';
import { PillButton } from '../../ui/PillButton';

interface PhotoWidgetProps {
  field: DataCollectionField;
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_DEMO_PHOTO = COPY.morphing.widgets.photo.demoPhotoSvg(
  COPY.morphing.widgets.photo.demoPhotoSvgText
);

export function PhotoWidget({ field, value, onChange }: PhotoWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const currentPhoto = typeof value === 'string' && value.length > 0 ? value : '';
  const isCloudStored =
    currentPhoto.startsWith('http://') ||
    currentPhoto.startsWith('https://') ||
    currentPhoto.startsWith('/api/media/');

  const processAndUploadFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error(COPY.morphing.widgets.photo.invalidFile);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'photos');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error('No media URL returned from upload server');
      }

      onChange(data.url);
      toast.success(COPY.morphing.widgets.photo.uploadSuccess);
    } catch (err: any) {
      console.warn('[PhotoWidget] Cloud Storage upload failed, falling back to local preview:', err?.message || err);
      // Fallback seamlessly to local data URL so the user's routine workflow isn't blocked
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          onChange(result);
          toast.info(COPY.morphing.widgets.photo.uploadError);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processAndUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      void processAndUploadFile(file);
    }
  };

  return (
    <div className="w-full">
      {isUploading ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-tile border border-ink/15 bg-canvas p-8 shadow-inner">
          <Spinner className="h-7 w-7 text-ink" />
          <p className="mt-3 text-xs font-medium text-ink">
            {COPY.morphing.widgets.photo.uploading}
          </p>
        </div>
      ) : currentPhoto ? (
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
                label={COPY.morphing.widgets.photo.removePhoto}
                size={36}
                onClick={() => onChange('')}
                className="bg-white/90 backdrop-blur"
              >
                <Icon icon={DeleteOutlineIcon} size="sm" />
              </CircleButton>
            </div>
            {isCloudStored && (
              <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-3xs font-medium text-ink/80 backdrop-blur shadow-2xs">
                <Icon icon={CloudDoneOutlinedIcon} size="xs" className="text-mint" />
                <span>Cloud Storage</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-2xs text-ink/60">
            {COPY.morphing.widgets.photo.attached}
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
          <p className="mt-1 text-2xs text-ink/60">
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
              {COPY.morphing.widgets.photo.uploadButton}
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
              {COPY.morphing.widgets.photo.demoCaptureButton}
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
