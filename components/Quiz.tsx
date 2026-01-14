"use client";

/**
 * Quiz Component
 * 
 * Main quiz orchestrator that renders the appropriate step.
 * Reference: README.md §6 Content: Final Quiz Questions.
 */

import { useEffect, useState } from "react";
import { useQuiz } from "@/lib/use-quiz";
import {
  QUESTION_CONFIG,
  GOAL_OPTIONS,
  EFFORT_OPTIONS,
  GENDER_OPTIONS,
  USER_GENDER_OPTIONS,
  SKIN_COLOR_OPTIONS,
  UNIVERSE_OPTIONS,
  ERA_OPTIONS,
  PRACTICAL_OPTIONS,
  CLOSET_OPTIONS,
} from "@/lib/quiz-types";
import type { QuizResponse, Recommendation, RecommendResponse, PhotoCues } from "@/lib/schema";

import { Hero } from "./Hero";
import { QuizStepper } from "./QuizStepper";
import { QuestionCard } from "./QuestionCard";
import { ChoiceChips } from "./ChoiceChips";
import { SingleSelect } from "./SingleSelect";
import { Slider } from "./Slider";
import { ToggleList } from "./ToggleList";
import { PhotoUpload } from "./PhotoUpload";
import { LoadingState } from "./LoadingState";
import { ResultsGrid } from "./ResultsGrid";
import { ChevronRight } from "./icons";

type AppState = "quiz" | "loading" | "results" | "error";

interface QuizProps {
  onSubmit: (quiz: QuizResponse) => Promise<void>;
  appState: AppState;
  recommendations?: Recommendation[];
  meta?: RecommendResponse["meta"] | null;
  onReset: () => void;
  onMoreLikeThis: (
    costumeId: string,
    direction?: string
  ) => Promise<Recommendation[] | null>;
  shownCostumeIds: string[];
}

export function Quiz({ 
  onSubmit, 
  appState, 
  recommendations = [],
  meta,
  onReset,
  onMoreLikeThis,
  shownCostumeIds,
}: QuizProps) {
  const quiz = useQuiz();
  const {
    currentStep,
    answers,
    currentQuestionNumber,
    totalQuestions,
    isQuestionStep,
    canGoBack,
    goBack,
    goNext,
    goToStep,
    setAnswer,
    setNestedAnswer,
    setPhotoCues,
    buildQuizResponse,
    reset,
  } = quiz;

  // Local state for photo processing
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  // Sync app state with quiz state
  useEffect(() => {
    if (appState === "loading" && currentStep !== "loading") {
      goToStep("loading");
    } else if (appState === "results" && currentStep !== "results") {
      goToStep("results");
    } else if (appState === "error" && currentStep === "loading") {
      // Go back to photo step on error
      goToStep("q11_photo");
    }
  }, [appState, currentStep, goToStep]);

  // Get config for current question
  const questionConfig = QUESTION_CONFIG.find((q) => q.step === currentStep);

  // Handle photo upload - extract features then submit
  const handlePhotoSelected = async (file: File) => {
    setIsPhotoProcessing(true);
    
    try {
      // Call the photo-features API to extract cues
      const formData = new FormData();
      formData.append("photo", file);
      
      const response = await fetch("/api/photo-features", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const cues: PhotoCues = await response.json();
        // Store the photo cues in quiz state
        setPhotoCues(cues);
      }
      // If API fails, cues will default to null - that's fine
      
    } catch (error) {
      console.error("Photo analysis failed:", error);
      // Continue without photo cues - don't block the flow
    } finally {
      setIsPhotoProcessing(false);
      // Submit the quiz after photo processing (or failure)
      handleSubmit();
    }
  };

  // Handle quiz submission
  const handleSubmit = async () => {
    const quizResponse = buildQuizResponse();
    if (quizResponse) {
      await onSubmit(quizResponse);
    }
  };

  // Handle skip on optional questions
  const handleSkip = () => {
    if (currentStep === "q10_closet") {
      goNext();
    } else if (currentStep === "q11_photo") {
      handleSubmit();
    }
  };

  // Handle full reset
  const handleFullReset = () => {
    reset();
    onReset();
  };

  // Custom navigation for gender - skip q4b if not "match"
  const handleGenderNext = () => {
    if (answers.genderPref === "match") {
      goNext(); // Goes to q4b_yourgender
    } else {
      goToStep("q5_resemblance"); // Skip to resemblance
    }
  };

  // Check if current step can proceed
  const canProceed = (): boolean => {
    switch (currentStep) {
      case "q1_goals":
        return (answers.goals?.length ?? 0) > 0;
      case "q3_effort":
        return answers.effort !== undefined;
      case "q4_gender":
        return answers.genderPref !== undefined;
      case "q4b_yourgender":
        return answers.userGender !== undefined;
      case "q6_universe":
        return (answers.universes?.length ?? 0) > 0;
      case "q8_skincolor":
        return answers.isBlack !== undefined;
      default:
        return true; // Optional questions or sliders
    }
  };

  // Render next button
  const renderNextButton = (options?: { isLast?: boolean; showSkip?: boolean; customHandler?: () => void }) => {
    const { isLast = false, showSkip = false, customHandler } = options ?? {};
    
    return (
      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={customHandler ?? (isLast ? handleSubmit : goNext)}
          disabled={!canProceed()}
          className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-base font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px] touch-manipulation"
        >
          {isLast ? "Show me my costumes" : "Continue"}
          {!isLast && <ChevronRight className="w-5 h-5" />}
        </button>
        
        {showSkip && (
          <button
            onClick={handleSkip}
            className="text-base text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 py-2 transition-colors touch-manipulation"
          >
            Skip this step
          </button>
        )}
      </div>
    );
  };

  // Render based on current step
  const renderStep = () => {
    switch (currentStep) {
      case "hero":
        return <Hero onStart={() => goToStep("q1_goals")} />;

      case "loading":
        return <LoadingState />;

      case "results": {
        const quizResponse = buildQuizResponse();
        if (!quizResponse) {
          return null;
        }
        return (
          <ResultsGrid
            recommendations={recommendations}
            meta={meta}
            quiz={quizResponse}
            onReset={handleFullReset}
            onMoreLikeThis={onMoreLikeThis}
            shownCostumeIds={shownCostumeIds}
          />
        );
      }

      case "q1_goals":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <ChoiceChips
              options={GOAL_OPTIONS}
              selected={answers.goals ?? []}
              onChange={(selected) => setAnswer("goals", selected)}
              maxSelect={2}
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q2_niche":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <Slider
              value={answers.nicheTarget ?? 5}
              onChange={(v) => setAnswer("nicheTarget", v as 1|2|3|4|5|6|7|8|9|10)}
              leftLabel="Everyone gets it"
              centerLabel="Some people get it"
              rightLabel="Deep cut"
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q3_effort":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <SingleSelect
              options={EFFORT_OPTIONS}
              selected={answers.effort}
              onChange={(v) => setAnswer("effort", v)}
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q4_gender":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <SingleSelect
              options={GENDER_OPTIONS}
              selected={answers.genderPref}
              onChange={(v) => setAnswer("genderPref", v)}
            />
            {renderNextButton({ customHandler: handleGenderNext })}
          </QuestionCard>
        );

      case "q4b_yourgender":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <SingleSelect
              options={USER_GENDER_OPTIONS}
              selected={answers.userGender}
              onChange={(v) => setAnswer("userGender", v)}
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q5_resemblance":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <Slider
              value={answers.resemblanceTarget ?? 5}
              onChange={(v) => setAnswer("resemblanceTarget", v as 1|2|3|4|5|6|7|8|9|10)}
              leftLabel="Just the vibe"
              rightLabel="Dead ringer"
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q6_universe":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <ChoiceChips
              options={UNIVERSE_OPTIONS}
              selected={answers.universes ?? []}
              onChange={(selected) => setAnswer("universes", selected)}
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q7_era":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <SingleSelect
              options={ERA_OPTIONS}
              selected={answers.era}
              onChange={(v) => setAnswer("era", v)}
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q8_skincolor":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <div className="flex gap-3">
              {SKIN_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setAnswer("isBlack", option.value)}
                  className={`
                    flex-1 px-6 py-4 rounded-2xl text-base font-medium transition-all min-h-[56px] touch-manipulation
                    border-2
                    ${
                      answers.isBlack === option.value
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                        : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-500"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {renderNextButton()}
          </QuestionCard>
        );

      case "q9_practical":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
          >
            <ToggleList
              options={PRACTICAL_OPTIONS}
              values={answers.practical ?? {}}
              onChange={(field, value) =>
                setNestedAnswer("practical", field, value)
              }
            />
            {renderNextButton()}
          </QuestionCard>
        );

      case "q10_closet":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
            optional
          >
            <ToggleList
              options={CLOSET_OPTIONS}
              values={answers.closetBoosters ?? {}}
              onChange={(field, value) =>
                setNestedAnswer("closetBoosters", field, value)
              }
            />
            {renderNextButton({ showSkip: true })}
          </QuestionCard>
        );

      case "q11_photo":
        return (
          <QuestionCard
            headline={questionConfig!.headline}
            subline={questionConfig!.subline}
            optional
          >
            <PhotoUpload
              onPhotoSelected={handlePhotoSelected}
              onSkip={handleSubmit}
              isProcessing={isPhotoProcessing}
            />
          </QuestionCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress stepper - only show on question steps */}
      {isQuestionStep && currentStep !== "loading" && currentStep !== "results" && (
        <QuizStepper
          currentQuestion={currentQuestionNumber}
          totalQuestions={totalQuestions}
          onBack={goBack}
          canGoBack={canGoBack}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center py-8">
        {renderStep()}
      </main>
    </div>
  );
}
