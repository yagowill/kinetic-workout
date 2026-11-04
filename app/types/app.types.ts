// Tipos de domínio usados pela interface.
// Eles traduzem as linhas do banco para o formato que as telas consomem.

import type { WorkoutItem, WorkoutPlan } from './database.types'

export type AnamnesisStatus = 'complete' | 'pending'

export interface StudentAnamnesisData {
  primaryGoal: string
  experienceLevel: string
  weeklyFrequency: number
  jointPains: string[]
  medicalConditions: string[]
  additionalNotes: string
}

export interface StudentSummary {
  id: string
  name: string
  phone: string
  goal: string
  weeklyFrequency: number
  experienceLevel: string
  anamnesisStatus: AnamnesisStatus
  jointPains: string[]
  accessToken: string | null
  avatarColor: string
}

export interface StudentDetail {
  student: StudentSummary
  anamnesis: StudentAnamnesisData | null
}

export interface ExerciseOption {
  id: string
  name: string
  targetMuscle: string
  muscleGroup: string
  muscleLabel: string
  gifUrl: string
}

export interface WorkoutItemView {
  id: string
  exerciseId: string
  name: string
  muscleGroup: string
  muscleLabel: string
  gifUrl: string
  sets: number
  reps: string
  restSeconds: number
}

export interface WorkoutDivisionView {
  id: string
  label: string
  focus: string
  items: WorkoutItemView[]
}

export interface WorkoutEditorData {
  student: StudentSummary
  anamnesis: StudentAnamnesisData | null
  plan: WorkoutPlan
  divisions: WorkoutDivisionView[]
}

export interface PublicWorkoutPlanPayload {
  plan: Omit<WorkoutPlan, 'access_token'>
  student_name: string | null
  items: WorkoutItem[]
}

export interface PublicWorkoutPlanData {
  studentName: string
  plan: Omit<WorkoutPlan, 'access_token'>
  divisions: WorkoutDivisionView[]
}
