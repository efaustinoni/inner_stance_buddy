// Created: 2026-02-13
// Last Updated: 2026-04-08 (ITEM-02: multi-domain flows moved to src/services/orchestrators/)
// This file is a pure compatibility barrel — all logic lives in domain services and orchestrators.

// --- Domain re-exports ---

export type { ExerciseQuarter } from './services/quarterService';
export type { ExerciseWeek, QuestionWithAnswer, WeekWithQuestions } from './services/weekService';
export type { ExerciseQuestion, ImageExtractedData } from './services/questionService';
export type { ExerciseAnswer } from './services/answerService';
export type {
  ProgressTracker,
  ProgressCheckIn,
  TrackerWithQuestion,
  TrackerWithCheckIns,
} from './services/trackerService';

export {
  fetchUserQuarters,
  createQuarter,
  updateQuarter,
  deleteQuarter,
} from './services/quarterService';

export {
  fetchUserWeeks,
  fetchWeekWithQuestions,
  createWeek,
  moveWeekToQuarter,
  updateWeek,
  deleteWeek,
} from './services/weekService';

export {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  extractQuestionsFromImage,
} from './services/questionService';

export { saveAnswer } from './services/answerService';

export {
  createProgressTracker,
  getTrackerForQuestion,
  fetchUserTrackers,
  toggleCheckIn,
  deleteProgressTracker,
  updateCheckInNotes,
} from './services/trackerService';

// --- Orchestrator re-exports ---

export type { DashboardQuestion } from '../services/orchestrators/dashboardOrchestrator';
export { fetchDashboardData } from '../services/orchestrators/dashboardOrchestrator';
export { copyWeekToQuarter } from '../services/orchestrators/copyWeekOrchestrator';
export { fetchTrackerWithCheckIns } from '../services/orchestrators/trackerOrchestrator';
