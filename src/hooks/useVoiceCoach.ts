import { useCallback, useEffect, useRef, useState } from 'react';
import { COPY } from '../data/copy';
import type { ProtocolStep } from '../types/protocol';

interface UseVoiceCoachOptions {
  steps: ProtocolStep[];
  onStepComplete?: (stepIndex: number) => void;
  safetyRule?: string;
}

const SPEED_OPTIONS = [0.9, 1.0, 1.15] as const;

function playAudioChime(kind: 'start' | 'tick' | 'complete') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (kind === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      window.setTimeout(() => ctx.close().catch(() => {}), 400);
    } else if (kind === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      window.setTimeout(() => ctx.close().catch(() => {}), 200);
    } else if (kind === 'complete') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
      window.setTimeout(() => ctx.close().catch(() => {}), 700);
    }
  } catch {
    // Gracefully ignore blocked or unsupported AudioContext
  }
}

export function useVoiceCoach({ steps, onStepComplete, safetyRule }: UseVoiceCoachOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1.0x
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>(COPY.voiceCoach.idle);

  const speed = SPEED_OPTIONS[speedIndex];
  const timerRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Safe unmount cleanup per AGENTS.md
  useEffect(() => {
    return () => {
      cancelSpeech();
      clearTimer();
    };
  }, [cancelSpeech, clearTimer]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) return;
      cancelSpeech();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        utteranceRef.current = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [cancelSpeech, isSupported, speed]
  );

  const buildStepScript = useCallback((step: ProtocolStep, index: number, total: number) => {
    const stepNum = index + 1;
    let details = '';

    if (step.durationSeconds && step.durationSeconds > 0) {
      details = COPY.voiceCoach.script.timedHoldDetail(step.sets, step.durationSeconds, step.detail);
    } else if (step.reps > 0) {
      details = COPY.voiceCoach.script.repsDetail(step.sets, step.reps, step.detail);
    } else {
      const unit = step.setLabel || COPY.voiceCoach.script.defaultDosesUnit;
      const dose = step.statValue ? `, ${step.statValue}` : '';
      details = COPY.voiceCoach.script.dosageDetail(step.sets, unit, dose, step.detail);
    }

    if (step.tempo) {
      details += COPY.voiceCoach.script.prescribedTempo(step.tempo);
    }

    return COPY.voiceCoach.stepAnnouncement(stepNum, total, step.action, details);
  }, []);

  const startHoldCountdown = useCallback(
    (seconds: number, nextStepCallback: () => void) => {
      clearTimer();
      setCountdownRemaining(seconds);
      setStatusText(COPY.voiceCoach.countdownActive(seconds));

      if (isSoundEnabled) {
        playAudioChime('start');
      }

      speak(COPY.voiceCoach.holdCountdownStart(seconds), () => {
        let remaining = seconds;
        timerRef.current = window.setInterval(() => {
          remaining -= 1;
          setCountdownRemaining(remaining);

          if (remaining === 10 && remaining > 0) {
            speak(COPY.voiceCoach.secondsRemaining);
          } else if (remaining <= 3 && remaining > 0) {
            if (isSoundEnabled) playAudioChime('tick');
          }

          if (remaining <= 0) {
            clearTimer();
            setCountdownRemaining(null);
            setStatusText(COPY.voiceCoach.countdownComplete);
            if (isSoundEnabled) playAudioChime('complete');
            speak(COPY.voiceCoach.holdFinished, nextStepCallback);
          }
        }, 1000);
      });
    },
    [clearTimer, isSoundEnabled, speak]
  );

  const guideStep = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setStatusText(COPY.voiceCoach.finishedAllSteps);
        if (isSoundEnabled) playAudioChime('complete');
        speak(COPY.voiceCoach.finishedAllSteps);
        return;
      }

      const step = steps[index];
      setCurrentStepIndex(index);
      setStatusText(COPY.voiceCoach.stepPacing(index + 1, steps.length));

      if (isSoundEnabled) playAudioChime('start');

      const script = buildStepScript(step, index, steps.length);

      speak(script, () => {
        // If step has a timed hold, start the countdown
        if (step.durationSeconds && step.durationSeconds > 0) {
          startHoldCountdown(step.durationSeconds, () => {
            if (onStepComplete) onStepComplete(index);
            // Wait 2 seconds rest, then advance to next step
            window.setTimeout(() => {
              guideStep(index + 1);
            }, 2000);
          });
        } else {
          // Non-timed step: complete and optionally pause or wait for user action
          if (onStepComplete) onStepComplete(index);
        }
      });
    },
    [buildStepScript, isSoundEnabled, onStepComplete, speak, startHoldCountdown, steps]
  );

  const startCoach = useCallback(() => {
    if (!isSupported) return;
    setIsPlaying(true);
    setIsPaused(false);

    // If a safety rule is provided, read it first on initial launch
    if (currentStepIndex === 0 && safetyRule) {
      speak(`${COPY.voiceCoach.safetyReminder(safetyRule)}. ${COPY.voiceCoach.readyToBegin}`, () => {
        guideStep(0);
      });
    } else {
      guideStep(currentStepIndex);
    }
  }, [currentStepIndex, guideStep, isSupported, safetyRule, speak]);

  const pauseCoach = useCallback(() => {
    cancelSpeech();
    clearTimer();
    setIsPlaying(false);
    setIsPaused(true);
    setStatusText(COPY.voiceCoach.pause);
  }, [cancelSpeech, clearTimer]);

  const resumeCoach = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    guideStep(currentStepIndex);
  }, [currentStepIndex, guideStep]);

  const stopCoach = useCallback(() => {
    cancelSpeech();
    clearTimer();
    setIsPlaying(false);
    setIsPaused(false);
    setCountdownRemaining(null);
    setCurrentStepIndex(0);
    setStatusText(COPY.voiceCoach.idle);
  }, [cancelSpeech, clearTimer]);

  const nextStep = useCallback(() => {
    cancelSpeech();
    clearTimer();
    setCountdownRemaining(null);
    const nextIdx = Math.min(steps.length - 1, currentStepIndex + 1);
    setCurrentStepIndex(nextIdx);
    if (isPlaying) {
      guideStep(nextIdx);
    }
  }, [cancelSpeech, clearTimer, currentStepIndex, guideStep, isPlaying, steps.length]);

  const prevStep = useCallback(() => {
    cancelSpeech();
    clearTimer();
    setCountdownRemaining(null);
    const prevIdx = Math.max(0, currentStepIndex - 1);
    setCurrentStepIndex(prevIdx);
    if (isPlaying) {
      guideStep(prevIdx);
    }
  }, [cancelSpeech, clearTimer, currentStepIndex, guideStep, isPlaying]);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((prev) => (prev + 1) % SPEED_OPTIONS.length);
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
  }, []);

  return {
    isPlaying,
    isPaused,
    currentStepIndex,
    speed,
    isSoundEnabled,
    countdownRemaining,
    statusText,
    isSupported,
    startCoach,
    pauseCoach,
    resumeCoach,
    stopCoach,
    nextStep,
    prevStep,
    cycleSpeed,
    toggleSound
  };
}
