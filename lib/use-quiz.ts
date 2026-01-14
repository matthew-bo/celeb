"use client";

/**
 * useQuiz Hook
 * 
 * State management for the costume quiz.
 * Reference: README.md §14 (Client state management), §15 (sessionStorage)
 */

import { useReducer, useEffect, useCallback, useMemo } from "react";
import type { QuizResponse, PhotoCues } from "./schema";
import {
  QuizState,
  QuizAction,
  QuizStep,
  QUIZ_STEPS,
  QUESTION_STEPS,
  DEFAULT_QUIZ_ANSWERS,
} from "./quiz-types";

// =============================================================================
// Storage Key
// =============================================================================

const STORAGE_KEY = "costume-quiz-state";

// =============================================================================
// Helper Functions
// =============================================================================

function getStepIndex(step: QuizStep): number {
  return QUIZ_STEPS.indexOf(step);
}

function getQuestionNumber(step: QuizStep): number {
  const idx = QUESTION_STEPS.indexOf(step);
  return idx === -1 ? 0 : idx + 1;
}

function getPreviousStep(current: QuizStep, answers: Partial<QuizResponse>): QuizStep {
  const idx = getStepIndex(current);
  if (idx <= 0) return current;
  
  let prevStep = QUIZ_STEPS[idx - 1];
  
  // Skip q4b_yourgender if going back and genderPref isn't "match"
  if (prevStep === "q4b_yourgender" && answers.genderPref !== "match") {
    return QUIZ_STEPS[idx - 2] ?? current;
  }
  
  return prevStep;
}

function getNextStep(current: QuizStep, answers: Partial<QuizResponse>): QuizStep {
  const idx = getStepIndex(current);
  if (idx >= QUIZ_STEPS.length - 1) return current;
  
  let nextStep = QUIZ_STEPS[idx + 1];
  
  // Skip q4b_yourgender if genderPref isn't "match"
  if (nextStep === "q4b_yourgender" && answers.genderPref !== "match") {
    return QUIZ_STEPS[idx + 2] ?? current;
  }
  
  return nextStep;
}

// =============================================================================
// Initial State
// =============================================================================

function getInitialState(): QuizState {
  return {
    currentStep: "hero",
    answers: { ...DEFAULT_QUIZ_ANSWERS },
    shownCostumeIds: [],
    isSubmitting: false,
    error: null,
  };
}

// =============================================================================
// Reducer
// =============================================================================

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };

    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.field]: action.value },
      };

    case "SET_NESTED_ANSWER": {
      const parent = state.answers[action.parent] ?? {};
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.parent]: { ...parent, [action.field]: action.value },
        },
      };
    }

    case "SET_PHOTO_CUES":
      return {
        ...state,
        answers: { ...state.answers, photoCues: action.cues },
        photoCues: action.cues,
      };

    case "GO_BACK":
      return { ...state, currentStep: getPreviousStep(state.currentStep, state.answers) };

    case "GO_NEXT":
      return { ...state, currentStep: getNextStep(state.currentStep, state.answers) };

    case "RESET":
      return getInitialState();

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.value };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "ADD_SHOWN_COSTUME":
      if (state.shownCostumeIds.includes(action.id)) return state;
      return {
        ...state,
        shownCostumeIds: [...state.shownCostumeIds, action.id],
      };

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, undefined, getInitialState);

  // ---------------------------------------------------------------------------
  // SessionStorage Persistence
  // ---------------------------------------------------------------------------

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QuizState;
        // Don't restore loading or submitting states
        parsed.isSubmitting = false;
        dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Persist to sessionStorage on state change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors (quota, etc.)
    }
  }, [state]);

  // ---------------------------------------------------------------------------
  // History API Integration
  // ---------------------------------------------------------------------------

  // Push state to history when step changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stepIdx = getStepIndex(state.currentStep);
    const url = new URL(window.location.href);
    
    // Only add step param for question steps
    if (state.currentStep.startsWith("q")) {
      url.searchParams.set("step", String(getQuestionNumber(state.currentStep)));
    } else if (state.currentStep === "results") {
      url.searchParams.set("step", "results");
    } else {
      url.searchParams.delete("step");
    }

    // Replace state to avoid building up history
    window.history.replaceState({ stepIdx }, "", url.toString());
  }, [state.currentStep]);

  // Handle popstate (back/forward)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.stepIdx === "number") {
        const step = QUIZ_STEPS[event.state.stepIdx];
        if (step) {
          dispatch({ type: "SET_STEP", step });
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const goToStep = useCallback((step: QuizStep) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const goNext = useCallback(() => {
    dispatch({ type: "GO_NEXT" });
  }, []);

  const setAnswer = useCallback(
    <K extends keyof QuizResponse>(field: K, value: QuizResponse[K]) => {
      dispatch({ type: "SET_ANSWER", field, value });
    },
    []
  );

  const setNestedAnswer = useCallback(
    (
      parent: "boundaries" | "practical" | "closetBoosters",
      field: string,
      value: boolean
    ) => {
      dispatch({ type: "SET_NESTED_ANSWER", parent, field, value });
    },
    []
  );

  const setPhotoCues = useCallback((cues: PhotoCues) => {
    dispatch({ type: "SET_PHOTO_CUES", cues });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setSubmitting = useCallback((value: boolean) => {
    dispatch({ type: "SET_SUBMITTING", value });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const addShownCostume = useCallback((id: string) => {
    dispatch({ type: "ADD_SHOWN_COSTUME", id });
  }, []);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const currentQuestionNumber = useMemo(
    () => getQuestionNumber(state.currentStep),
    [state.currentStep]
  );

  const isQuestionStep = state.currentStep.startsWith("q");
  const canGoBack = getStepIndex(state.currentStep) > 0 && state.currentStep !== "loading";
  const canGoNext = getStepIndex(state.currentStep) < QUIZ_STEPS.length - 1;

  // Check if quiz is complete enough to submit
  const canSubmit = useMemo(() => {
    const { answers } = state;
    return (
      answers.goals &&
      answers.goals.length > 0 &&
      answers.effort !== undefined &&
      answers.universes &&
      answers.universes.length > 0
    );
  }, [state]);

  // Build full QuizResponse for submission
  const buildQuizResponse = useCallback((): QuizResponse | null => {
    const { answers } = state;
    
    if (!canSubmit) return null;

    return {
      goals: answers.goals!,
      nicheTarget: answers.nicheTarget ?? 5,
      effort: answers.effort!,
      budget: answers.budget ?? "dont_care",
      genderPref: answers.genderPref ?? "dont_care",
      userGender: answers.userGender,
      isBlack: answers.isBlack,
      resemblanceTarget: answers.resemblanceTarget ?? 5,
      universes: answers.universes!,
      era: answers.era ?? "any",
      boundaries: {
        noSkinToneChange: answers.boundaries?.noSkinToneChange ?? true,
        avoidCultureSpecific: answers.boundaries?.avoidCultureSpecific ?? false,
        avoidReligious: answers.boundaries?.avoidReligious ?? false,
        avoidPolitical: answers.boundaries?.avoidPolitical ?? false,
        avoidFacePaint: answers.boundaries?.avoidFacePaint ?? false,
        avoidWigs: answers.boundaries?.avoidWigs ?? false,
        avoidControversial: answers.boundaries?.avoidControversial ?? false,
      },
      practical: {
        mustBeComfortable: answers.practical?.mustBeComfortable ?? false,
        mustSurviveCrowdedBar: answers.practical?.mustSurviveCrowdedBar ?? false,
        needsPockets: answers.practical?.needsPockets ?? false,
        indoorOnly: answers.practical?.indoorOnly ?? false,
      },
      closetBoosters: answers.closetBoosters,
      photoCues: answers.photoCues,
    } as QuizResponse;
  }, [state, canSubmit]);

  return {
    // State
    state,
    currentStep: state.currentStep,
    answers: state.answers,
    photoCues: state.photoCues,
    shownCostumeIds: state.shownCostumeIds,
    isSubmitting: state.isSubmitting,
    error: state.error,

    // Derived
    currentQuestionNumber,
    totalQuestions: QUESTION_STEPS.length,
    isQuestionStep,
    canGoBack,
    canGoNext,
    canSubmit,

    // Actions
    goToStep,
    goBack,
    goNext,
    setAnswer,
    setNestedAnswer,
    setPhotoCues,
    reset,
    setSubmitting,
    setError,
    addShownCostume,
    buildQuizResponse,
  };
}

export type UseQuizReturn = ReturnType<typeof useQuiz>;

