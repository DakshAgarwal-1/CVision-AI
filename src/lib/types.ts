export type Profile = {
  id: string;
  user_id: string | null;
  name: string;
  title: string;
  avatar_url: string | null;
  cv_score: number;
  bio: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  university: string | null;
  graduation_year: number | null;
  created_at: string;
  updated_at: string;
};

export type CV = {
  id: string;
  user_id: string | null;
  filename: string;
  file_size: number;
  raw_text: string | null;
  parsed_skills: string[];
  experience_years: number;
  education: string | null;
  score: number;
  status: string;
  candidate_name: string | null;
  uploaded_at: string;
  created_at: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_range: string | null;
  description: string | null;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  match_score: number;
  match_strength: string;
  posted_date: string;
  is_remote: boolean;
  created_at: string;
};

export type SkillGap = {
  id: string;
  skill_name: string;
  current_level: number;
  target_level: number;
  priority: string;
  category: string;
  created_at: string;
};

export type LearningResource = {
  id: string;
  skill_name: string;
  title: string;
  provider: string;
  resource_type: string;
  url: string | null;
  duration_hours: number;
  difficulty: string;
  rating: number;
  priority: string;
  created_at: string;
};

export type PageKey =
  | 'dashboard'
  | 'my-cv'
  | 'job-matches'
  | 'all-jobs'
  | 'skill-gap'
  | 'learning'
  | 'compare-jd'
  | 'profile'
  | 'settings';
