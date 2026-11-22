// Skill taxonomy — keywords used to detect skills in CV text
export const SKILL_TAXONOMY: Record<string, string[]> = {
  Python: ['python', 'py3', 'cpython'],
  'C++': ['c++', 'cpp', 'c plus plus'],
  C: ['c language', 'c programming', 'clang'],
  Java: ['java', 'jvm', 'openjdk'],
  JavaScript: ['javascript', 'js', 'es6', 'ecmascript'],
  TypeScript: ['typescript', 'ts'],
  React: ['react', 'reactjs', 'react.js'],
  'Node.js': ['node', 'nodejs', 'node.js', 'express'],
  SQL: ['sql', 'postgresql', 'mysql', 'sqlite', 'postgres'],
  'NoSQL': ['nosql', 'mongodb', 'mongo', 'redis', 'cassandra'],
  Git: ['git', 'github', 'gitlab', 'version control'],
  Docker: ['docker', 'containerization', 'containers'],
  Kubernetes: ['kubernetes', 'k8s'],
  'REST APIs': ['rest api', 'restful', 'rest apis', 'api design'],
  GraphQL: ['graphql', 'gql'],
  'Machine Learning': ['machine learning', 'ml', 'ml models'],
  'Deep Learning': ['deep learning', 'neural networks', 'neural network'],
  TensorFlow: ['tensorflow', 'tf'],
  PyTorch: ['pytorch', 'torch'],
  'Data Structures': ['data structures', 'dsa'],
  Algorithms: ['algorithms', 'algorithm design', 'competitive programming'],
  Pandas: ['pandas', 'dataframe'],
  NumPy: ['numpy', 'np array'],
  Flask: ['flask', 'flask app'],
  'Django': ['django'],
  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'GCP': ['gcp', 'google cloud'],
  Azure: ['azure', 'microsoft azure'],
  Linux: ['linux', 'bash', 'shell scripting', 'unix'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3', 'tailwind', 'bootstrap'],
  'C#': ['c#', 'csharp', '.net'],
  Go: ['golang', 'go programming'],
  Rust: ['rust', 'rustlang'],
  'Tableau': ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  'Spark': ['apache spark', 'pyspark'],
  'Hadoop': ['hadoop', 'hdfs'],
  'CI/CD': ['ci/cd', 'jenkins', 'github actions', 'continuous integration'],
  'Microservices': ['microservices', 'microservice architecture'],
  'NLP': ['nlp', 'natural language processing', 'text processing'],
  'Computer Vision': ['computer vision', 'opencv', 'image processing'],
  'Data Analysis': ['data analysis', 'data analytics', 'exploratory data'],
  'Statistics': ['statistics', 'statistical analysis', 'probability'],
  'Agile': ['agile', 'scrum', 'sprint'],
  'Project Management': ['project management', 'pm tools', 'jira'],
};

export const SKILL_CATEGORIES: Record<string, string> = {
  Python: 'programming',
  'C++': 'programming',
  C: 'programming',
  Java: 'programming',
  JavaScript: 'programming',
  TypeScript: 'programming',
  React: 'frontend',
  'Node.js': 'backend',
  SQL: 'database',
  NoSQL: 'database',
  Git: 'tools',
  Docker: 'devops',
  Kubernetes: 'devops',
  'REST APIs': 'backend',
  GraphQL: 'backend',
  'Machine Learning': 'ml',
  'Deep Learning': 'ml',
  TensorFlow: 'ml',
  PyTorch: 'ml',
  'Data Structures': 'cs-fundamentals',
  Algorithms: 'cs-fundamentals',
  Pandas: 'data',
  NumPy: 'data',
  Flask: 'backend',
  Django: 'backend',
  AWS: 'cloud',
  GCP: 'cloud',
  Azure: 'cloud',
  Linux: 'tools',
  HTML: 'frontend',
  CSS: 'frontend',
  'C#': 'programming',
  Go: 'programming',
  Rust: 'programming',
  Tableau: 'data',
  'Power BI': 'data',
  Spark: 'data',
  Hadoop: 'data',
  'CI/CD': 'devops',
  Microservices: 'architecture',
  NLP: 'ml',
  'Computer Vision': 'ml',
  'Data Analysis': 'data',
  Statistics: 'data',
  Agile: 'soft-skills',
  'Project Management': 'soft-skills',
};

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const [skill, keywords] of Object.entries(SKILL_TAXONOMY)) {
    for (const kw of keywords) {
      // Use word boundary for short keywords to avoid false positives
      const regex = kw.length <= 3
        ? new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i')
        : new RegExp(escapeRegex(kw), 'i');
      if (regex.test(lower)) {
        found.add(skill);
        break;
      }
    }
  }

  return Array.from(found);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getCategoryForSkill(skill: string): string {
  return SKILL_CATEGORIES[skill] || 'other';
}
