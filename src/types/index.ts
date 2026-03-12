export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserProfile {
  skinType?: string;
  concerns?: string[];
  experience?: string;
  age?: string;
  sensitivities?: string;
  completed: boolean;
}

export interface RoutineProduct {
  id: string;
  name: string;
  type: string;
  timeOfDay: 'AM' | 'PM' | 'Both';
  step: number;
  notes?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'single' | 'multi' | 'text';
  options?: string[];
  field: keyof Omit<UserProfile, 'completed'>;
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'skinType',
    question: "What's your skin type?",
    type: 'single',
    field: 'skinType',
    options: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive', "I'm not sure"]
  },
  {
    id: 'concerns',
    question: "What are your main skin concerns? (Select all that apply)",
    type: 'multi',
    field: 'concerns',
    options: ['Acne / Breakouts', 'Hyperpigmentation', 'Fine lines & aging', 'Dryness', 'Redness / Rosacea', 'Large pores', 'Dullness', 'Dark circles']
  },
  {
    id: 'experience',
    question: "How would you describe your skincare experience?",
    type: 'single',
    field: 'experience',
    options: ['Beginner — just starting out', 'Intermediate — I have a basic routine', 'Advanced — I use multiple actives', 'Expert — I know my ingredients well']
  },
  {
    id: 'age',
    question: "What's your age range?",
    type: 'single',
    field: 'age',
    options: ['Under 25', '25–34', '35–44', '45–54', '55+', 'Prefer not to say']
  },
  {
    id: 'sensitivities',
    question: "Any known sensitivities, allergies, or ingredients you want to avoid?",
    type: 'text',
    field: 'sensitivities',
  }
];
