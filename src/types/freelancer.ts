// ─── Shared Freelancer Types ──────────────────────────────────────────────────

export type ExperienceLevel = "beginner" | "intermediate" | "experienced" | "expert";
export type AvailabilityType = "full-time" | "part-time" | "small-projects";
export type SortOption = "match" | "rating" | "rate-asc" | "recent";

export interface Review { author: string; rating: number; comment: string; date: string; }

export interface Freelancer {
  id: string; name: string; role: string; bio: string;
  skills: string[]; experience: ExperienceLevel; yearsExp: number;
  hourlyRate: number; rating: number; reviews: number; projectsDone: number;
  availability: AvailabilityType; location: string; matchScore: number;
  avatarInitials: string; portfolio: string; github?: string;
  linkedin?: string; dribbble?: string; recentReviews: Review[]; createdAt: string;
}

export interface FreelancerFiltersState {
  q: string;
  roles: string[];
  experience: ExperienceLevel | "all";
  skills: string[];
  minRate: number;
  maxRate: number;
  availability: AvailabilityType | "all";
  minRating: number | 0;
  sort: SortOption;
}

export const DEFAULT_FILTERS: FreelancerFiltersState = {
  q: "", roles: [], experience: "all", skills: [], minRate: 0, maxRate: 500,
  availability: "all", minRating: 0, sort: "match",
};

// ─── Display maps ─────────────────────────────────────────────────────────────

export const EXPERIENCE_LABELS: Record<ExperienceLevel | "all", string> = {
  all: "All Levels", beginner: "Beginner", intermediate: "Intermediate",
  experienced: "Experienced", expert: "Expert",
};

export const AVAILABILITY_LABELS: Record<AvailabilityType | "all", string> = {
  all: "All", "full-time": "Full-Time", "part-time": "Part-Time", "small-projects": "Small Projects",
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "match",    label: "Best Match" },
  { value: "rating",   label: "Highest Rated" },
  { value: "rate-asc", label: "Lowest Rate" },
  { value: "recent",   label: "Most Recent" },
];

export const ROLE_OPTIONS = [
  "Frontend Developer", "Backend Developer", "Fullstack Developer",
  "Mobile Developer", "UI/UX Designer", "Graphic Designer",
  "DevOps / Cloud Engineer", "Data Scientist", "Web Developer",
];

export const RATING_OPTIONS = [
  { value: 0,   label: "Any Rating" },
  { value: 4.0, label: "4.0+ Stars" },
  { value: 4.5, label: "4.5+ Stars" },
  { value: 4.8, label: "4.8+ Stars" },
];

export const AVAILABILITY_COLOR: Record<AvailabilityType, string> = {
  "full-time": "text-success",
  "part-time": "text-yellow-400",
  "small-projects": "text-blue-400",
};
