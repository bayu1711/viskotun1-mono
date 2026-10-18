import { useCallback, useEffect, useRef, useState } from 'react';
import { COPY } from '../data/copy';
import type { RoutineStep } from '../types/routine';
import { formatVoiceName, getCuratedNaturalVoices } from '../utils/voice';

interface UseVoiceCoachOptions {
  steps: RoutineStep[];
  onStepComplete?: (stepIndex: number) => void;
  safetyRule?: string;
  isDayComplete?: boolean;
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

export function useVoiceCoach({ steps, onStepComplete, safetyRule, isDayComplete = false }: UseVoiceCoachOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1.0x
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>(COPY.voiceCoach.idle);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  const speed = SPEED_OPTIONS[speedIndex];
  const timerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Bumped on every cancel so in-flight TTS fetches and stale end events are ignored
  const speechIdRef = useRef(0);
  // Read at the end of a session, after the last set credit has re-rendered
  const isDayCompleteRef = useRef(isDayComplete);

  useEffect(() => {
    isDayCompleteRef.current = isDayComplete;
  }, [isDayComplete]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const selectedVoice = availableVoices[selectedVoiceIndex] || availableVoices[0] || null;

  // Speech callbacks outlive the render that queued them, so they read settings live from a ref
  const settingsRef = useRef({ speed, selectedVoice, isSoundEnabled });

  useEffect(() => {
    settingsRef.current = { speed, selectedVoice, isSoundEnabled };
  }, [speed, selectedVoice, isSoundEnabled]);

  const cycleVoice = useCallback(() => {
    if (availableVoices.length <= 1) return;
    setSelectedVoiceIndex((prev) => (prev + 1) % availableVoices.length);
  }, [availableVoices.length]);

  // Load and rank voices with natural/enhanced speech priority
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const raw = window.speechSynthesis.getVoices();
      if (raw && raw.length > 0) {
        const curated = getCuratedNaturalVoices(raw);
        setAvailableVoices(curated);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const cancelSpeech = useCallback(() => {
    speechIdRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (restTimerRef.current !== null) {
      window.clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    }
  }, []);

  // Safe unmount cleanup per AGENTS.md
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      cancelSpeech();
      clearTimer();
    };
  }, [cancelSpeech, clearTimer]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) return;
      cancelSpeech();
      const speechId = speechIdRef.current;
      const isCurrent = () => speechId === speechIdRef.current;
      const { speed, selectedVoice } = settingsRef.current;

      const speakWithBrowser = () => {
        if (!isCurrent()) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.pitch = 1.0;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }

        utterance.onend = () => {
          utteranceRef.current = null;
          if (onEnd && isCurrent()) onEnd();
        };

        utterance.onerror = () => {
          utteranceRef.current = null;
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      // Query server for Google Cloud TTS audio if configured
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speed,
          voice: selectedVoice?.name
        })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isCurrent()) return;
          if (data?.audioContent) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
            audio.playbackRate = speed;
            audio.onended = () => {
              audioRef.current = null;
              if (onEnd && isCurrent()) onEnd();
            };
            audio.onerror = () => {
              audioRef.current = null;
              speakWithBrowser();
            };
            audioRef.current = audio;
            audio.play().catch(() => {
              speakWithBrowser();
            });
          } else {
            speakWithBrowser();
          }
        })
        .catch(() => {
          speakWithBrowser();
        });
    },
    [cancelSpeech, isSupported]
  );

  const chime = useCallback((kind: 'start' | 'tick' | 'complete') => {
    if (settingsRef.current.isSoundEnabled) playAudioChime(kind);
  }, []);

  const buildStepScript = useCallback((step: RoutineStep, index: number, total: number) => {
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
    (seconds: number, nextStepCallback: () => void, intro = '') => {
      clearTimer();
      setCountdownRemaining(seconds);
      setStatusText(COPY.voiceCoach.countdownActive(seconds));

      chime('start');

      speak(`${intro}${COPY.voiceCoach.holdCountdownStart(seconds)}`, () => {
        let remaining = seconds;
        timerRef.current = window.setInterval(() => {
          remaining -= 1;
          setCountdownRemaining(remaining);

          if (remaining === 10 && remaining > 0) {
            speak(COPY.voiceCoach.secondsRemaining);
          } else if (remaining <= 3 && remaining > 0) {
            chime('tick');
          }

          if (remaining <= 0) {
            clearTimer();
            setCountdownRemaining(null);
            setStatusText(COPY.voiceCoach.countdownComplete);
            chime('complete');
            speak(COPY.voiceCoach.holdFinished, nextStepCallback);
          }
        }, 1000);
      });
    },
    [chime, clearTimer, speak]
  );

  const guideStep = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        const message = isDayCompleteRef.current ? COPY.voiceCoach.finishedAllSteps : COPY.voiceCoach.guidedStepsEnded;
        setIsPlaying(false);
        setIsPaused(false);
        setStatusText(message);
        chime('complete');
        speak(message);
        return;
      }

      const step = steps[index];
      setCurrentStepIndex(index);
      setStatusText(COPY.voiceCoach.stepPacing(index + 1, steps.length));

      chime('start');

      const script = buildStepScript(step, index, steps.length);

      // Wait 2 seconds rest, then run the next action
      const restThen = (next: () => void) => {
        restTimerRef.current = window.setTimeout(() => {
          restTimerRef.current = null;
          next();
        }, 2000);
      };

      speak(script, () => {
        const holdSeconds = step.durationSeconds ?? 0;
        if (holdSeconds > 0 && step.reps <= 1) {
          // One hold per set: the coach guides the whole set, so it credits it
          const runHoldSet = (setNumber: number) => {
            const intro = setNumber > 1 ? COPY.voiceCoach.setAnnouncement(setNumber, step.sets) : '';
            startHoldCountdown(
              holdSeconds,
              () => {
                if (onStepComplete) onStepComplete(index);
                restThen(() => (setNumber < step.sets ? runHoldSet(setNumber + 1) : guideStep(index + 1)));
              },
              intro
            );
          };
          runHoldSet(1);
        } else if (holdSeconds > 0) {
          // Repeated holds or a session timer: the coach only times it, the user logs sets on the card
          startHoldCountdown(holdSeconds, () => restThen(() => guideStep(index + 1)));
        } else {
          // Rep-based steps are logged by the user on the step card, then the user moves on
          setStatusText(COPY.voiceCoach.awaitingNext);
          speak(COPY.voiceCoach.awaitNextPrompt);
        }
      });
    },
    [buildStepScript, chime, onStepComplete, speak, startHoldCountdown, steps]
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
    // On the last step, Next ends the session instead of staying put
    if (isPlaying && currentStepIndex >= steps.length - 1) {
      guideStep(steps.length);
      return;
    }
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
    toggleSound,
    selectedVoice,
    cycleVoice,
    activeVoiceDisplayName: selectedVoice ? formatVoiceName(selectedVoice.name) : null,
    availableVoiceCount: availableVoices.length
  };
}
