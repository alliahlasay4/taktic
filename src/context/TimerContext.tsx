import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(45);
  const [autoStartBreak, setAutoStartBreak] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [pendingSessionData, setPendingSessionData] = useState<{ mins: number; title?: string } | null>(null);

  // Sync timeLeft when mode or preset changes
  useEffect(() => {
    setTimeLeft(getDurationSeconds(mode, preset, customMinutesInput));
    setIsRunning(false);
  }, [mode, preset, customMinutesInput]);

  // Main Timer Loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === 'stopwatch') {
            return prev + 1;
          }
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            soundEngine.playTimerCompleteSound();

            const totalDurSecs = getDurationSeconds(mode, preset, customMinutesInput);
            const elapsedMins = Math.max(1, Math.round(totalDurSecs / 60));

            setPendingSessionData({ mins: elapsedMins, title: selectedTask?.title });
            setShowRatingModal(true);

            if (mode === 'pomodoro' && autoStartBreak) {
              setTimeout(() => {
                setModeState('shortBreak');
                setIsRunning(true);
              }, 1000);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, preset, customMinutesInput, selectedTask, autoStartBreak]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationSeconds(mode, preset, customMinutesInput));
  };

  const setMode = (newMode: TimerMode) => {
    setModeState(newMode);
  };

  const setPreset = (newPreset: PresetOption) => {
    setPresetState(newPreset);
  };

  const clearPendingSessionData = () => {
    setShowRatingModal(false);
    setPendingSessionData(null);
  };

  const submitSessionComplete = (quality?: 'high_flow' | 'moderate' | 'distracted') => {
    if (pendingSessionData) {
      onFocusComplete(pendingSessionData.mins, pendingSessionData.title, quality);
    }
    clearPendingSessionData();
  };

  const totalDuration = getDurationSeconds(mode, preset, customMinutesInput);

  return (
    <TimerContext.Provider
      value={{
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
      }}
    >
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
