# Assessment Submission and Scoring Implementation

## Summary
Implemented complete assessment submission and scoring system with automatic objective score calculation and detailed results display.

## Changes Made

### 1. Server Functions (app/server/assessments.ts)
- **Updated `submitAssessment`**: Modified to calculate `objective_score` based on `is_correct` field in `question_options`
  - For objective questions (single_choice, multiple_choice, rating, date, boolean): Points awarded only when `is_correct` is true
  - For essay questions (short_text, long_text): Score preserved for manual grading
  - Total score = objective_score + essay_score

- **Added `getAssessmentResults`**: New server function to fetch detailed results
  - Returns session info with scores
  - Returns question-by-question results showing:
    - User's answer
    - Correct answer (for objective questions)
    - Whether answer was correct
    - Score awarded vs max score

### 2. Results Page (app/routes/assessments.$id.results.tsx)
New route displaying assessment results after submission:
- Score summary cards (total, objective, essay)
- Session information (participant, template, submission time)
- Statistics (total questions, correct/incorrect answers, accuracy %)
- Detailed question-by-question breakdown:
  - Shows user's answer with correct/incorrect indicator
  - Shows correct answer if user was wrong
  - Shows score breakdown
- Responsive design for mobile and desktop

### 3. Updated Take Assessment Page (app/routes/assessments.$id.take.tsx)
- Modified redirect after submission to go to results page
- Changed from `/assessments` to `/assessments/$id/results`

### 4. Route Tree (app/routeTree.gen.ts)
- Added new `/assessments/$id/results` route
- Updated all type definitions to include new route

### 5. Seed Data (seed_assessment_questions.sql)
- Created seed file with 6 sample questions:
  - 4 objective questions (single_choice, multiple_choice, boolean)
  - 1 essay question (long_text)
  - 1 rating question
- Each objective question has `is_correct` field set appropriately
- Score values configured for each option

## How It Works

1. **Taking Assessment**: User answers questions at `/assessments/$id/take`
2. **Auto-save**: Responses are auto-saved as user progresses
3. **Submission**: When user clicks "Submit Penilaian":
   - All responses are saved to `assessment_responses`
   - `objective_score` is calculated by checking `is_correct` for each selected option
   - `essay_score` is sum of manually awarded scores for essay questions
   - `total_score` = `objective_score` + `essay_score`
   - `submitted_at` timestamp is recorded
4. **Results Display**: User is redirected to `/assessments/$id/results` showing:
   - Final scores
   - Correct/incorrect answers
   - Detailed breakdown

## Database Schema Used

```sql
-- assessment_responses table stores individual answers
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL,
  question_id UUID,
  selected_option_id UUID,
  answer_text TEXT,
  awarded_score DECIMAL DEFAULT 0,
  reviewer_note TEXT
);

-- assessment_attempts table stores overall scores
CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY,
  objective_score DECIMAL DEFAULT 0,
  essay_score DECIMAL DEFAULT 0,
  total_score DECIMAL DEFAULT 0,
  submitted_at TIMESTAMPTZ
);

-- question_options table has is_correct flag
CREATE TABLE question_options (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL,
  option_label TEXT NOT NULL,
  option_value TEXT NOT NULL,
  score_value DECIMAL DEFAULT 0,
  is_correct BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 1
);
```

## Testing

To test the implementation:
1. Run dev server: `pnpm run dev`
2. Navigate to `/assessments`
3. Click "Penilaian Baru" to create a new assessment
4. Select a participant and template
5. Click "Mulai Penilaian" to start
6. Answer questions and submit
7. View results page with scores and correct answers

## Files Modified
- app/server/assessments.ts (199 lines added)
- app/routes/assessments.$id.results.tsx (425 lines, new file)
- app/routes/assessments.$id.take.tsx (3 lines modified)
- app/routeTree.gen.ts (26 lines modified)
- seed_assessment_questions.sql (197 lines, new file)
