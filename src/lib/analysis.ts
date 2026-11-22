import { supabase } from './supabase';
import type { CV, Job, SkillGap, LearningResource } from './types';
import { extractSkillsFromText } from './skills';

export type AnalysisResult = {
  cvScore: number;
  jobsMatched: number;
  strongMatches: number;
  skillsDetected: number;
  skillGapsCount: number;
  highPriorityGaps: number;
  topJobs: Job[];
  skillGaps: SkillGap[];
  learningResources: LearningResource[];
};

export async function runFullAnalysis(cv: CV): Promise<AnalysisResult> {
  const userSkills = cv.parsed_skills || [];

  // Fetch all jobs
  const { data: jobs } = await supabase.from('jobs').select('*');

  // Fetch skill gaps
  const { data: skillGaps } = await supabase.from('skill_gaps').select('*');

  // Fetch learning resources
  const { data: learningResources } = await supabase
    .from('learning_resources')
    .select('*');

  // Re-match jobs against current CV skills
  const matchedJobs: Job[] = (jobs || []).map((job) => {
    const requiredSkills = job.required_skills || [];
    const matched = requiredSkills.filter((s: string) =>
      userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    const missing = requiredSkills.filter(
      (s: string) => !matched.includes(s)
    );
    const matchScore =
      requiredSkills.length > 0
        ? Math.round((matched.length / requiredSkills.length) * 100)
        : 0;
    const strength =
      matchScore >= 80 ? 'strong' : matchScore >= 60 ? 'moderate' : 'weak';

    return {
      ...job,
      matched_skills: matched,
      missing_skills: missing,
      match_score: matchScore,
      match_strength: strength,
    };
  });

  matchedJobs.sort((a, b) => b.match_score - a.match_score);

  const strongMatches = matchedJobs.filter((j) => j.match_strength === 'strong').length;
  const gaps = skillGaps || [];
  const highPriorityGaps = gaps.filter((g) => g.priority === 'high').length;

  return {
    cvScore: cv.score,
    jobsMatched: matchedJobs.length,
    strongMatches,
    skillsDetected: userSkills.length,
    skillGapsCount: gaps.filter((g) => g.priority !== 'none').length,
    highPriorityGaps,
    topJobs: matchedJobs.slice(0, 4),
    skillGaps: gaps,
    learningResources: learningResources || [],
  };
}

export async function reanalyzeCv(cv: CV): Promise<AnalysisResult> {
  // Re-extract skills from raw text if available
  if (cv.raw_text) {
    const newSkills = extractSkillsFromText(cv.raw_text);
    if (newSkills.length > 0) {
      const { data } = await supabase
        .from('cvs')
        .update({ parsed_skills: newSkills })
        .eq('id', cv.id)
        .select()
        .maybeSingle();
      if (data) {
        return runFullAnalysis(data as CV);
      }
    }
  }
  return runFullAnalysis(cv);
}

export async function compareJobDescription(
  jdText: string,
  userSkills: string[]
): Promise<{
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
}> {
  const jdSkills = extractSkillsFromText(jdText);
  const matched = jdSkills.filter((jd) =>
    userSkills.some((us) => us.toLowerCase() === jd.toLowerCase())
  );
  const missing = jdSkills.filter(
    (jd) => !matched.some((m) => m.toLowerCase() === jd.toLowerCase())
  );
  const matchScore =
    jdSkills.length > 0
      ? Math.round((matched.length / jdSkills.length) * 100)
      : 0;

  return { matchedSkills: matched, missingSkills: missing, matchScore };
}
