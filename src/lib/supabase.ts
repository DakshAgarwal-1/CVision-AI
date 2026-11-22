import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { CV, Job, LearningResource, Profile, SkillGap } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseUrl.trim().length > 0) &&
  Boolean(supabaseAnonKey && supabaseAnonKey.trim().length > 0);

type MockUserRecord = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  createdAt: string;
};

type MockDbState = {
  users: MockUserRecord[];
  sessionUserId: string | null;
  sessionExpiresAt: number | null;
  profile: Profile[];
  cvs: CV[];
  jobs: Job[];
  skill_gaps: SkillGap[];
  learning_resources: LearningResource[];
};

const STORAGE_KEY = 'cvision_mock_db_v1';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const SEED_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Junior Full Stack Developer',
    company: 'Insight Analytics',
    location: 'Bengaluru, India',
    job_type: 'Full-time',
    experience_level: 'Entry',
    salary_range: '$65k - $85k',
    description: 'Build modern React and TypeScript web applications backed by Node.js and PostgreSQL APIs.',
    required_skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'SQL', 'Git'],
    matched_skills: [],
    missing_skills: [],
    match_score: 0,
    match_strength: 'moderate',
    posted_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    is_remote: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-2',
    title: 'Machine Learning Intern',
    company: 'VectorMind AI',
    location: 'Remote',
    job_type: 'Internship',
    experience_level: 'Entry',
    salary_range: '$45k - $60k',
    description: 'Work with Python, PyTorch, and Pandas to train and evaluate NLP and computer vision pipelines.',
    required_skills: ['Python', 'Machine Learning', 'PyTorch', 'Pandas', 'NumPy', 'SQL'],
    matched_skills: [],
    missing_skills: [],
    match_score: 0,
    match_strength: 'moderate',
    posted_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_remote: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-3',
    title: 'Backend Software Engineer',
    company: 'CloudScale Systems',
    location: 'Hyderabad, India',
    job_type: 'Full-time',
    experience_level: 'Mid',
    salary_range: '$80k - $110k',
    description: 'Design scalable REST APIs, microservices, and containerized cloud workloads on AWS.',
    required_skills: ['Python', 'Node.js', 'REST APIs', 'Docker', 'AWS', 'SQL', 'Git'],
    matched_skills: [],
    missing_skills: [],
    match_score: 0,
    match_strength: 'moderate',
    posted_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_remote: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-4',
    title: 'Frontend Engineer (React)',
    company: 'PixelCraft Studio',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Entry',
    salary_range: '$70k - $90k',
    description: 'Craft responsive, accessible UI experiences with React, TypeScript, HTML, CSS, and GraphQL.',
    required_skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Git'],
    matched_skills: [],
    missing_skills: [],
    match_score: 0,
    match_strength: 'moderate',
    posted_date: new Date(Date.now() - 86400000 * 4).toISOString(),
    is_remote: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-5',
    title: 'Data Analyst',
    company: 'FinPulse Labs',
    location: 'Mumbai, India',
    job_type: 'Full-time',
    experience_level: 'Entry',
    salary_range: '$55k - $75k',
    description: 'Analyze product metrics using SQL, Python, Pandas, Statistics, and Tableau dashboards.',
    required_skills: ['SQL', 'Python', 'Pandas', 'Data Analysis', 'Statistics', 'Tableau'],
    matched_skills: [],
    missing_skills: [],
    match_score: 0,
    match_strength: 'moderate',
    posted_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_remote: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-6',
    title: 'DevOps & Cloud Engineer',
    company: 'InfraGrid',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Mid',
    salary_range: '$90k - $120k',
    description: 'Automate CI/CD pipelines, Kubernetes clusters, and Linux infrastructure on AWS.',
    required_skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git'],
    matched_skills: [],
    missing_skills: [],
    match_score: 0,
    match_strength: 'moderate',
    posted_date: new Date(Date.now() - 86400000 * 6).toISOString(),
    is_remote: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_SKILL_GAPS: SkillGap[] = [
  { id: 'sg-1', skill_name: 'Docker', current_level: 35, target_level: 85, priority: 'high', category: 'devops', created_at: new Date().toISOString() },
  { id: 'sg-2', skill_name: 'AWS', current_level: 30, target_level: 80, priority: 'high', category: 'cloud', created_at: new Date().toISOString() },
  { id: 'sg-3', skill_name: 'TypeScript', current_level: 65, target_level: 90, priority: 'medium', category: 'programming', created_at: new Date().toISOString() },
  { id: 'sg-4', skill_name: 'Kubernetes', current_level: 20, target_level: 75, priority: 'medium', category: 'devops', created_at: new Date().toISOString() },
  { id: 'sg-5', skill_name: 'System Design', current_level: 45, target_level: 80, priority: 'medium', category: 'architecture', created_at: new Date().toISOString() },
  { id: 'sg-6', skill_name: 'GraphQL', current_level: 40, target_level: 75, priority: 'low', category: 'backend', created_at: new Date().toISOString() },
  { id: 'sg-7', skill_name: 'React', current_level: 85, target_level: 85, priority: 'none', category: 'frontend', created_at: new Date().toISOString() },
  { id: 'sg-8', skill_name: 'SQL', current_level: 75, target_level: 85, priority: 'low', category: 'database', created_at: new Date().toISOString() },
];

const SEED_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'lr-1',
    skill_name: 'Docker',
    title: 'Docker & Containers for Full Stack Engineers',
    provider: 'Coursera',
    resource_type: 'course',
    url: 'https://docs.docker.com/get-started/',
    duration_hours: 12,
    difficulty: 'intermediate',
    rating: 4.8,
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'lr-2',
    skill_name: 'AWS',
    title: 'AWS Cloud Practitioner & Serverless Fundamentals',
    provider: 'AWS Skill Builder',
    resource_type: 'course',
    url: 'https://aws.amazon.com/training/',
    duration_hours: 16,
    difficulty: 'beginner',
    rating: 4.7,
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'lr-3',
    skill_name: 'TypeScript',
    title: 'TypeScript Handbook & Advanced Types',
    provider: 'TypeScript Docs',
    resource_type: 'documentation',
    url: 'https://www.typescriptlang.org/docs/',
    duration_hours: 8,
    difficulty: 'intermediate',
    rating: 4.9,
    priority: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'lr-4',
    skill_name: 'Kubernetes',
    title: 'Kubernetes Basics Interactive Tutorial',
    provider: 'Kubernetes.io',
    resource_type: 'documentation',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    duration_hours: 10,
    difficulty: 'intermediate',
    rating: 4.6,
    priority: 'medium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'lr-5',
    skill_name: 'GraphQL',
    title: 'Full-Stack GraphQL API Design',
    provider: 'Apollo Odyssey',
    resource_type: 'course',
    url: 'https://www.apollographql.com/tutorials/',
    duration_hours: 6,
    difficulty: 'beginner',
    rating: 4.7,
    priority: 'low',
    created_at: new Date().toISOString(),
  },
  {
    id: 'lr-6',
    skill_name: 'SQL',
    title: 'PostgreSQL Query Optimization & Indexing',
    provider: 'PostgreSQL Tutorial',
    resource_type: 'article',
    url: 'https://www.postgresql.org/docs/',
    duration_hours: 5,
    difficulty: 'intermediate',
    rating: 4.6,
    priority: 'low',
    created_at: new Date().toISOString(),
  },
];

function createDefaultState(): MockDbState {
  return {
    users: [],
    sessionUserId: null,
    sessionExpiresAt: null,
    profile: [],
    cvs: [],
    jobs: SEED_JOBS,
    skill_gaps: SEED_SKILL_GAPS,
    learning_resources: SEED_LEARNING_RESOURCES,
  };
}

function loadState(): MockDbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockDbState>;
      return {
        users: parsed.users ?? [],
        sessionUserId: parsed.sessionUserId ?? null,
        sessionExpiresAt: parsed.sessionExpiresAt ?? null,
        profile: parsed.profile ?? [],
        cvs: parsed.cvs ?? [],
        jobs: parsed.jobs && parsed.jobs.length > 0 ? parsed.jobs : SEED_JOBS,
        skill_gaps: parsed.skill_gaps && parsed.skill_gaps.length > 0 ? parsed.skill_gaps : SEED_SKILL_GAPS,
        learning_resources:
          parsed.learning_resources && parsed.learning_resources.length > 0
            ? parsed.learning_resources
            : SEED_LEARNING_RESOURCES,
      };
    }
  } catch {
    // ignore storage errors
  }
  return createDefaultState();
}

function saveState(state: MockDbState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function createMockSupabaseClient() {
  const state = loadState();
  const listeners = new Set<(event: string, session: Session | null) => void>();

  const makeSession = (u: MockUserRecord | null): Session | null => {
    if (!u) return null;
    const expiresAtSec = state.sessionExpiresAt
      ? Math.floor(state.sessionExpiresAt / 1000)
      : Math.floor((Date.now() + SESSION_TTL_MS) / 1000);
    const user: User = {
      id: u.id,
      app_metadata: {},
      user_metadata: { full_name: u.fullName },
      aud: 'authenticated',
      created_at: u.createdAt || new Date().toISOString(),
      email: u.email,
    };
    return {
      access_token: `mock-token-${u.id}`,
      refresh_token: `mock-refresh-${u.id}`,
      expires_in: Math.max(0, expiresAtSec - Math.floor(Date.now() / 1000)),
      expires_at: expiresAtSec,
      token_type: 'bearer',
      user,
    };
  };

  const getCurrentSession = (): Session | null => {
    if (!state.sessionUserId) return null;
    if (state.sessionExpiresAt && Date.now() > state.sessionExpiresAt) {
      state.sessionUserId = null;
      state.sessionExpiresAt = null;
      saveState(state);
      return null;
    }
    const found = state.users.find((u) => u.id === state.sessionUserId) ?? null;
    return makeSession(found);
  };

  const notify = (event: string) => {
    const session = getCurrentSession();
    listeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch {
        // ignore listener errors
      }
    });
  };

  type TableName = 'profile' | 'cvs' | 'jobs' | 'skill_gaps' | 'learning_resources';

  const makeQueryBuilder = (table: TableName) => {
    let op: 'select' | 'insert' | 'update' | 'delete' = 'select';
    let payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
    const filters: Array<{ col: string; val: unknown }> = [];
    let orderBy: { col: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;
    let returnSingle = false;
    let returnRows = false;

    const execute = async (): Promise<{ data: unknown; error: { message: string } | null }> => {
      const now = new Date().toISOString();
      const session = getCurrentSession();
      const currentUserId = session?.user?.id ?? null;

      if (!currentUserId) {
        return { data: null, error: { message: 'Authentication required' } };
      }

      if (op === 'insert') {
        const items = Array.isArray(payload) ? payload : [payload || {}];
        const inserted = items.map((item) => {
          const base: Record<string, unknown> = {
            id: crypto.randomUUID(),
            created_at: now,
            ...item,
          };
          if (table === 'profile') {
            return {
              user_id: currentUserId,
              name: 'Student',
              title: '',
              avatar_url: null,
              cv_score: 0,
              bio: null,
              email: session?.user?.email ?? null,
              phone: null,
              location: null,
              university: null,
              graduation_year: null,
              updated_at: now,
              ...base,
            };
          }
          if (table === 'cvs') {
            return {
              user_id: currentUserId,
              file_size: 0,
              raw_text: null,
              parsed_skills: [],
              experience_years: 0,
              education: null,
              score: 0,
              status: 'analyzed',
              candidate_name: null,
              uploaded_at: now,
              ...base,
            };
          }
          return base;
        });

        (state[table] as Record<string, unknown>[]).push(...inserted);
        saveState(state);

        if (returnSingle) {
          return { data: inserted[0] ?? null, error: null };
        }
        return { data: returnRows ? inserted : null, error: null };
      }

      const matchesFilters = (row: Record<string, unknown>) =>
        filters.every((f) => row[f.col] === f.val);

      const isOwnedOrPublic = (row: Record<string, unknown>) => {
        if (table === 'profile' || table === 'cvs') {
          return row.user_id === currentUserId;
        }
        return true;
      };

      if (op === 'update') {
        if (table !== 'profile' && table !== 'cvs') {
          return { data: null, error: { message: 'Permission denied' } };
        }
        const patch = (Array.isArray(payload) ? payload[0] : payload) || {};
        const updatedRows: Record<string, unknown>[] = [];
        state[table] = (state[table] as Record<string, unknown>[]).map((row) => {
          if (isOwnedOrPublic(row) && matchesFilters(row)) {
            const next = { ...row, ...patch };
            updatedRows.push(next);
            return next;
          }
          return row;
        }) as never;
        saveState(state);

        if (returnSingle) {
          return { data: updatedRows[0] ?? null, error: null };
        }
        return { data: returnRows ? updatedRows : null, error: null };
      }

      if (op === 'delete') {
        if (table !== 'profile' && table !== 'cvs') {
          return { data: null, error: { message: 'Permission denied' } };
        }
        state[table] = (state[table] as Record<string, unknown>[]).filter(
          (row) => !(isOwnedOrPublic(row) && matchesFilters(row))
        ) as never;
        saveState(state);
        return { data: null, error: null };
      }

      // select
      let rows = [...(state[table] as Record<string, unknown>[])]
        .filter(isOwnedOrPublic)
        .filter(matchesFilters);

      if (orderBy) {
        const { col, ascending } = orderBy;
        rows.sort((a, b) => {
          const av = a[col];
          const bv = b[col];
          if (av === bv) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
        });
      }

      if (limitCount !== null) {
        rows = rows.slice(0, limitCount);
      }

      if (returnSingle) {
        return { data: rows[0] ?? null, error: null };
      }
      return { data: rows, error: null };
    };

    const builder = {
      select: () => {
        returnRows = true;
        return builder;
      },
      insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
        op = 'insert';
        payload = data;
        return builder;
      },
      update: (data: Record<string, unknown>) => {
        op = 'update';
        payload = data;
        return builder;
      },
      delete: () => {
        op = 'delete';
        return builder;
      },
      eq: (col: string, val: unknown) => {
        filters.push({ col, val });
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderBy = { col, ascending: opts?.ascending ?? true };
        return builder;
      },
      limit: (count: number) => {
        limitCount = count;
        return builder;
      },
      maybeSingle: () => {
        returnSingle = true;
        return execute();
      },
      single: () => {
        returnSingle = true;
        return execute();
      },
      then: <TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
        onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
      ) => execute().then(onfulfilled, onrejected),
    };

    return builder;
  };

  return {
    auth: {
      getSession: async () => {
        const hadSession = Boolean(state.sessionUserId);
        const session = getCurrentSession();
        if (hadSession && !session) {
          notify('SIGNED_OUT');
        }
        return {
          data: { session },
          error: null,
        };
      },
      onAuthStateChange: (cb: (event: string, session: Session | null) => void) => {
        listeners.add(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(cb);
              },
            },
          },
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const cleanEmail = email.trim().toLowerCase();
        const existing = state.users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (!existing || existing.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          };
        }

        state.sessionUserId = existing.id;
        state.sessionExpiresAt = Date.now() + SESSION_TTL_MS;
        saveState(state);
        const session = getCurrentSession();
        notify('SIGNED_IN');
        return {
          data: { user: session?.user ?? null, session },
          error: null,
        };
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: { full_name?: string } };
      }) => {
        const cleanEmail = email.trim().toLowerCase();
        if (state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
          return {
            data: { user: null, session: null },
            error: { message: 'User already registered' },
          };
        }

        const newUser: MockUserRecord = {
          id: crypto.randomUUID(),
          email: email.trim(),
          password,
          fullName: options?.data?.full_name || email.split('@')[0] || 'Student',
          createdAt: new Date().toISOString(),
        };
        state.users.push(newUser);
        state.sessionUserId = newUser.id;
        state.sessionExpiresAt = Date.now() + SESSION_TTL_MS;
        saveState(state);

        const session = getCurrentSession();
        notify('SIGNED_IN');
        return {
          data: { user: session?.user ?? null, session },
          error: null,
        };
      },
      updateUser: async (attrs: { password?: string; data?: { full_name?: string } }) => {
        const session = getCurrentSession();
        if (!session?.user) {
          return { data: { user: null }, error: { message: 'Not authenticated' } };
        }
        const idx = state.users.findIndex((u) => u.id === session.user.id);
        if (idx >= 0) {
          if (attrs.password) state.users[idx].password = attrs.password;
          if (attrs.data?.full_name !== undefined) state.users[idx].fullName = attrs.data.full_name;
          saveState(state);
          notify('USER_UPDATED');
        }
        const updatedSession = getCurrentSession();
        return { data: { user: updatedSession?.user ?? null }, error: null };
      },
      signOut: async () => {
        state.sessionUserId = null;
        state.sessionExpiresAt = null;
        saveState(state);
        notify('SIGNED_OUT');
        return { error: null };
      },
      resetPasswordForEmail: async () => {
        return { data: {}, error: null };
      },
    },
    from: (table: TableName) => makeQueryBuilder(table),
  };
}

if (!isSupabaseConfigured) {
  console.warn(
    '[CVision] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not configured — using local session/data fallback.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : (createMockSupabaseClient() as unknown as ReturnType<typeof createClient>);
