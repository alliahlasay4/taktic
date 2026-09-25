import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Zap,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Flame,
} from 'lucide-react';

interface CirclesOnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  setActiveTab: (tab: 'pods' | 'feed' | 'network') => void;
}

interface TourStep {
  targetId: string;
  tab: 'pods' | 'feed' | 'network';
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeColor: string;
  preferredPlacement?: 'top' | 'bottom' | 'auto';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-quick-rooms',
    tab: 'pods',
    title: 'Instant Focus Rooms & Join Codes',
    badge: 'Step 1: Quick Co-Working',
    description:
      'Jump into a silent focus session instantly. Enter a 6-digit room code or click "Quick Room" to host your own sprint with custom timer intervals.',
    icon: KeyRound,
    accentColor: 'from-[#C06C4C] to-[#C87D87]',
    badgeColor: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/30',
    preferredPlacement: 'bottom',
  },
  {
    targetId: 'tour-standing-pods',
    tab: 'pods',
    title: 'Standing Team Pods (30-Day Leases)',
    badge: 'Step 2: Team Spaces',
    description:
      'Permanent virtual spaces reserved for your circle squads. Each pod has a 30-day lease that automatically renews when active members focus.',
    icon: Users,
    accentColor: 'from-[#6B8E6E] to-[#CFA052]',
    badgeColor: 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border-[var(--accent-botanical-sage)]/30',
    preferredPlacement: 'top',
  },
  {
    targetId: 'tour-feed-tab',
    tab: 'feed',
    title: 'Milestone Feed & Cheer Reactions',
    badge: 'Step 3: Social Momentum',
    description:
      'Celebrate habit ring completions, focus streaks, and sprints. Send fire, heart, and sparkle cheers while keeping detailed task notes strictly private.',
    icon: Flame,
    accentColor: 'from-[#CFA052] to-[#C06C4C]',
    badgeColor: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border-[var(--accent-warm-ochre)]/30',
    preferredPlacement: 'bottom',
  },
  {
    targetId: 'tour-invite-partner',
    tab: 'network',
    title: 'Accountability Network & Privacy',
    badge: 'Step 4: Friends & Partners',
    description:
      'Invite partners via magic link or email. Only approved Circle Partners receive your activity broadcasts. Use Solo Ghost Mode anytime to focus invisibly.',
    icon: UserPlus,
    accentColor: 'from-[#C87D87] to-[#6B8E6E]',
    badgeColor: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border-[var(--accent-dusty-rose)]/30',
    preferredPlacement: 'bottom',
  },
];

export const CirclesOnboardingGuide: React.FC<CirclesOnboardingGuideProps> = ({
  isOpen,
  onClose,
  onComplete,
  setActiveTab,
}) => {
  // Step 0 = Welcome Overview Modal; Step 1-4 = Spotlight Guided Tour
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverDimensions, setPopoverDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 180,
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Measure popover height dynamically
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        setPopoverDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, [currentStep]);

  // Switch tab and locate target element bounding box when step changes
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep === 0) {
      setTargetRect(null);
      return;
    }

    const stepIndex = currentStep - 1;
    const stepConfig = TOUR_STEPS[stepIndex];
    if (!stepConfig) return;

    // Switch active tab in parent view
    setActiveTab(stepConfig.tab);

    const updatePosition = () => {
      const element = document.querySelector(`[data-tour="${stepConfig.targetId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const preference = stepConfig.preferredPlacement || 'auto';

        if (preference === 'top') {
          // If placing above, ensure there is comfortable headroom (approx 190-210px)
          if (rect.top < 190 || rect.bottom > window.innerHeight) {
            const scrollDelta = rect.top - 200;
            window.scrollBy({ top: scrollDelta, behavior: 'smooth' });
          }
        } else {
          // If element is offscreen, scroll it gently into view
          const isOutOfView = rect.top < 80 || rect.bottom > window.innerHeight - 80;
          if (isOutOfView) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        // Re-read rect after scroll
        setTimeout(() => {
          const freshRect = element.getBoundingClientRect();
          setTargetRect(freshRect);
        }, 150);
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(updatePosition, 180);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, currentStep, setActiveTab]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  // ==========================================
  // PHASE 1: WELCOME OVERVIEW MODAL (STEP 0)
  // ==========================================
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-7 shadow-2xl text-[var(--text-primary)] animate-in zoom-in-95 duration-200">
          {/* Decorative Gradient Flare */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-[#C06C4C]/25 via-[#C87D87]/20 to-[#6B8E6E]/20 blur-3xl pointer-events-none" />

          {/* Close / Skip button */}
          <button
            type="button"
            onClick={handleSkip}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
            aria-label="Skip Guide"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-3.5 sm:mb-5">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-lg shadow-[#C06C4C]/25 shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-lg sm:text-2xl text-[var(--text-primary)] leading-tight">
                  Welcome to Social Circles
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  New
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5">
                Silent virtual co-working & private social accountability.
              </p>
            </div>
          </div>

          {/* Core Feature Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 my-3.5 sm:my-5">
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60">
              <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
                <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[11px] sm:text-xs text-[var(--text-primary)]">
                  Silent Focus Rooms
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  Join or create sprint rooms with 6-digit invite codes and ambient timers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60">
              <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] shrink-0">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[11px] sm:text-xs text-[var(--text-primary)]">
                  Standing Team Pods
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  30-day recurring co-working links for squads and study groups.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60">
              <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0">
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[11px] sm:text-xs text-[var(--text-primary)]">
                  Milestone Feed
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  Celebrate ring closures and focus marathons with interactive cheers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60">
              <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[11px] sm:text-xs text-[var(--text-primary)]">
                  Privacy & Ghost Mode
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                  Task details stay masked; toggle Solo Ghost Mode anytime to go invisible.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition py-1 cursor-pointer"
            >
              Skip, I know how it works
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white shadow-md shadow-[var(--accent-terracotta)]/25 transition active:scale-95 cursor-pointer"
            >
              <span>Start Interactive Tour</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: SPOTLIGHT GUIDED TOUR (STEPS 1-4)
  // ==========================================
  const stepIndex = currentStep - 1;
  const currentStepData = TOUR_STEPS[stepIndex];
  if (!currentStepData) return null;

  const StepIcon = currentStepData.icon;

  // Compute Viewport-Safe Popover Positioning & Pointing Arrow
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const margin = isMobile ? 12 : 16;
  const popoverWidth = Math.min(isMobile ? 320 : 380, window.innerWidth - (isMobile ? 24 : 32));
  const popoverHeight = popoverDimensions.height || (isMobile ? 180 : 230);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let popoverTop = 0;
  let popoverLeft = 0;
  let arrowPlacement: 'top' | 'bottom' | 'none' = 'top';
  let arrowOffsetLeft = popoverWidth / 2;

  if (targetRect) {
    // Horizontal alignment centered on target element
    popoverLeft = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    popoverLeft = Math.max(margin, Math.min(popoverLeft, viewportWidth - popoverWidth - margin));

    // Arrow points directly to target center
    arrowOffsetLeft = Math.max(24, Math.min(targetRect.left + targetRect.width / 2 - popoverLeft, popoverWidth - 24));

    // Vertical placement logic:
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const preference = currentStepData.preferredPlacement || 'auto';

    if (preference === 'top' || (preference === 'auto' && spaceAbove > spaceBelow && spaceAbove >= popoverHeight + 8)) {
      // Place above target
      popoverTop = Math.max(margin, targetRect.top - popoverHeight - (isMobile ? 10 : 14));
      arrowPlacement = 'bottom';
    } else if (preference === 'bottom' || spaceBelow >= popoverHeight + margin + 8) {
      // Place below target
      popoverTop = targetRect.bottom + (isMobile ? 10 : 14);
      arrowPlacement = 'top';
    } else if (spaceAbove >= popoverHeight + margin + 8) {
      // Fallback above target
      popoverTop = targetRect.top - popoverHeight - (isMobile ? 10 : 14);
      arrowPlacement = 'bottom';
    } else {
      // Screen space constrained: pick roomiest side without covering key buttons
      if (spaceAbove >= spaceBelow) {
        popoverTop = Math.max(margin, targetRect.top - popoverHeight - (isMobile ? 8 : 12));
        arrowPlacement = 'bottom';
      } else {
        popoverTop = Math.max(margin, Math.min(targetRect.bottom + (isMobile ? 8 : 12), viewportHeight - popoverHeight - margin));
        arrowPlacement = 'top';
      }
    }

    // Absolute safety clamp
    popoverTop = Math.max(margin, Math.min(popoverTop, viewportHeight - popoverHeight - margin));
  } else {
    // Fallback centered HUD
    popoverTop = viewportHeight / 2 - popoverHeight / 2;
    popoverLeft = viewportWidth / 2 - popoverWidth / 2;
    arrowPlacement = 'none';
  }

  // SVG Cutout Coordinates (with 6px-8px breathing room)
  const cutoutPadding = isMobile ? 6 : 8;
  const cutoutX = targetRect ? Math.max(0, targetRect.left - cutoutPadding) : 0;
  const cutoutY = targetRect ? Math.max(0, targetRect.top - cutoutPadding) : 0;
  const cutoutW = targetRect ? Math.min(viewportWidth - cutoutX, targetRect.width + cutoutPadding * 2) : 0;
  const cutoutH = targetRect ? Math.min(viewportHeight - cutoutY, targetRect.height + cutoutPadding * 2) : 0;

  return (
    <>
      {/* SVG Spotlight Cutout Overlay (100% Crisp, ZERO Blur on Target Element) */}
      <svg
        className="fixed inset-0 z-50 w-full h-full pointer-events-auto transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen with dark overlay */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight hole: 100% transparent & crisp */}
            {targetRect && (
              <rect
                x={cutoutX}
                y={cutoutY}
                width={cutoutW}
                height={cutoutH}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Semi-transparent dark curtain with spotlight cutout */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Pulsating Glowing Border around the active spotlight target */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none rounded-2xl border-2 border-[var(--accent-terracotta)] ring-3 sm:ring-4 ring-[var(--accent-terracotta)]/25 shadow-[0_0_24px_rgba(192,108,76,0.45)] transition-all duration-300"
          style={{
            top: `${cutoutY}px`,
            left: `${cutoutX}px`,
            width: `${cutoutW}px`,
            height: `${cutoutH}px`,
          }}
        />
      )}

      {/* Floating Pointing Tour Tooltip Card (Compact & Mobile-Optimized) */}
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          top: `${popoverTop}px`,
          left: `${popoverLeft}px`,
          width: `${popoverWidth}px`,
          zIndex: 60,
        }}
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 sm:p-4 shadow-2xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-200 transition-all"
      >
        {/* Pointer Arrow Indicator positioned dynamically toward target */}
        {arrowPlacement === 'top' && (
          <div
            style={{ left: `${arrowOffsetLeft}px` }}
            className="absolute -top-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-[var(--card-surface)] filter drop-shadow-[0_-2px_1px_rgba(0,0,0,0.2)]"
          />
        )}
        {arrowPlacement === 'bottom' && (
          <div
            style={{ left: `${arrowOffsetLeft}px` }}
            className="absolute -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[var(--card-surface)] filter drop-shadow-[0_2px_1px_rgba(0,0,0,0.2)]"
          />
        )}

        {/* Card Header & Step Counter Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${currentStepData.badgeColor}`}>
            <StepIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>{currentStepData.badge}</span>
          </span>

          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[var(--text-muted)]">
            {currentStep} / {TOUR_STEPS.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-heading font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1 leading-snug">
          {currentStepData.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-snug sm:leading-relaxed mb-2.5">
          {currentStepData.description}
        </p>

        {/* Progress Step Dots */}
        <div className="flex items-center justify-center gap-1 my-2">
          {TOUR_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === stepIndex
                  ? 'w-4 sm:w-5 bg-[var(--accent-terracotta)]'
                  : idx < stepIndex
                  ? 'w-1.5 bg-[var(--accent-botanical-sage)]'
                  : 'w-1.5 bg-[var(--border-subtle)]'
              }`}
            />
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-1.5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                aria-label="Previous Step"
              >
                <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 rounded-lg sm:rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-2.5 sm:px-3.5 py-1 text-[11px] sm:text-xs font-bold text-white shadow-xs transition active:scale-95 min-h-[28px] sm:min-h-[32px] cursor-pointer"
            >
              <span>{currentStep === TOUR_STEPS.length ? 'Finish' : 'Next Step'}</span>
              {currentStep === TOUR_STEPS.length ? (
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : (
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
