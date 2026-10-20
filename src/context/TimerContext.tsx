import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Task } from '../types';
import { soundEngine } from '../lib/audio';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch';
export type PresetOption = 25 | 50 | 90 | 'custom';

interface TimerContextType {
  mode: TimerMode;
  preset: PresetOption;
  customMinutesInput: number;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  selectedTask: Task | null;
  autoStartBreak: boolean;
  showRatingModal: boolean;
  pendingSessionData: { mins: number; title?: string } | null;
  
  // Actions
  toggleTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: TimerMode) => void;
  setPreset: (preset: PresetOption) => void;
  setCustomMinutesInput: (mins: number) => void;
  setAutoStartBreak: (auto: boolean) => void;
  setSelectedTask: (task: Task | null) => void;
  setShowRatingModal: (show: boolean) => void;
  clearPendingSessionData: () => void;
  submitSessionComplete: (quality?: 'high_flow' | 'moderate' | 'distracted') => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: React.ReactNode;
  onFocusComplete: (durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => void;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children, onFocusComplete }) => {
  const [mode, setModeState] = useState<TimerMode>('pomodoro');
  const [preset, setPresetState] = useState<PresetOption>(25);
  const [customMinutesInput, setCustomMinutesInputState] = useState<number>(45);
  const [autoStartBreak, setAutoStartBreakState] = useState<boolean>(false);
  const [selectedTask, setSelectedTaskState] = useState<Task | null>(null);

  // Helper to get total duration in seconds
  const getDurationSeconds = (m: TimerMode, p: PresetOption, customMins: number): number => {
    if (m === 'shortBreak') return 5 * 60;
    if (m === 'longBreak') return 15 * 60;
    if (m === 'stopwatch') return 0;
    if (p === 'custom') return Math.max(1, customMins) * 60;
    return p * 60;
  };

  const [timeLeft, setTimeLeft] = useState<number>(getDurationSeconds('pomodoro', 25, 45));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rating Modal state
  const [showRatingModal, setShowRatingModalState] = useState<boolean>(false);
  const [pendingSessionData, setPendingSessionData] = useState<{ mins: number; title?: string } | null>(null);

  // Sync timeLeft when mode or preset changes
  useEffect(() => {
    setTimeLeft(getDurationSeconds(mode, preset, customMinutesInput));
    setIsRunning(false);
  }, [mode, preset, customMinutesInput]);

  const selectedTaskRef = useRef(selectedTask);
  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  const autoStartBreakRef = useRef(autoStartBreak);
  useEffect(() => {
    autoStartBreakRef.current = autoStartBreak;
  }, [autoStartBreak]);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const presetRef = useRef(preset);
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  const customMinutesInputRef = useRef(customMinutesInput);
  useEffect(() => {
    customMinutesInputRef.current = customMinutesInput;
  }, [customMinutesInput]);

  const onFocusCompleteRef = useRef(onFocusComplete);
  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
  }, [onFocusComplete]);

  // Main Timer Loop (Wall-clock based to prevent background tab throttling drift)
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (mode === 'stopwatch') {
      const startTimestamp = Date.now() - timeLeft * 1000;
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        // Guard update: only set state when elapsed integer second actually changes
        setTimeLeft((prev) => (prev !== elapsed ? elapsed : prev));
      }, 500);
    } else {
      const endTime = Date.now() + timeLeft * 1000;
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeLeft(0);
          setIsRunning(false);
          soundEngine.playTimerCompleteSound();

          const totalDurSecs = getDurationSeconds(
            modeRef.current,
            presetRef.current,
            customMinutesInputRef.current
          );
          const elapsedMins = Math.max(1, Math.round(totalDurSecs / 60));

          setPendingSessionData({ mins: elapsedMins, title: selectedTaskRef.current?.title });
          setShowRatingModalState(true);

          if (modeRef.current === 'pomodoro' && autoStartBreakRef.current) {
            setTimeout(() => {
              setModeState('shortBreak');
              setIsRunning(true);
            }, 1000);
          }
        } else {
          // Guard update: only set state when remaining integer second actually changes
          setTimeLeft((prev) => (prev !== remaining ? remaining : prev));
        }
      }, 500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getDurationSeconds(modeRef.current, presetRef.current, customMinutesInputRef.current));
  }, []);

  const setMode = useCallback((newMode: TimerMode) => {
    setModeState(newMode);
  }, []);

  const setPreset = useCallback((newPreset: PresetOption) => {
    setPresetState(newPreset);
  }, []);

  const setCustomMinutesInput = useCallback((mins: number) => {
    setCustomMinutesInputState(mins);
  }, []);

  const setAutoStartBreak = useCallback((auto: boolean) => {
    setAutoStartBreakState(auto);
  }, []);

  const setSelectedTask = useCallback((task: Task | null) => {
    setSelectedTaskState(task);
  }, []);

  const setShowRatingModal = useCallback((show: boolean) => {
    setShowRatingModalState(show);
  }, []);

  const clearPendingSessionData = useCallback(() => {
    setShowRatingModalState(false);
    setPendingSessionData(null);
  }, []);

  const submitSessionComplete = useCallback((quality?: 'high_flow' | 'moderate' | 'distracted') => {
    setPendingSessionData((currentData) => {
      if (currentData) {
        onFocusCompleteRef.current(currentData.mins, currentData.title, quality);
      }
      return null;
    });
    setShowRatingModalState(false);
  }, []);

  const totalDuration = useMemo(
    () => getDurationSeconds(mode, preset, customMinutesInput),
    [mode, preset, customMinutesInput]
  );

  const contextValue = useMemo<TimerContextType>(
    () => ({
      mode,
      preset,
      customMinutesInput,
      timeLeft,
      totalDuration,
      isRunning,
      selectedTask,
      autoStartBreak,
      showRatingModal,
      pendingSessionData,
      toggleTimer,
      resetTimer,
      setMode,
      setPreset,
      setCustomMinutesInput,
      setAutoStartBreak,
      setSelectedTask,
      setShowRatingModal,
      clearPendingSessionData,
      submitSessionComplete,
    }),
    [
      mode,
      preset,
      customMinutesInput,
      timeLeft,
      totalDuration,
      isRunning,
      selectedTask,
      autoStartBreak,
      showRatingModal,
      pendingSessionData,
      toggleTimer,
      resetTimer,
      setMode,
      setPreset,
      setCustomMinutesInput,
      setAutoStartBreak,
      setSelectedTask,
      setShowRatingModal,
      clearPendingSessionData,
      submitSessionComplete,
    ]
  );

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
