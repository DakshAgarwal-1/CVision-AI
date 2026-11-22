import { useEffect, useState } from 'react';
import { GraduationCap, Star, Clock, ExternalLink, BookOpen, Video, FileText } from 'lucide-react';
import type { CV, LearningResource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Card, SectionHeader, Badge, LoadingState, EmptyState } from '@/components/ui';
import type { LangCode } from '@/lib/i18n';

type LearningProps = {
  cv: CV | null;
  lang?: LangCode;
};

export function Learning({ cv }: LearningProps) {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data } = await supabase.from('learning_resources').select('*').order('priority', { ascending: true });
    setResources((data || []) as LearningResource[]);
    setLoading(false);
  };

  if (loading) return <LoadingState message="Loading recommendations..." />;

  const skills = Array.from(new Set(resources.map((r) => r.skill_name)));
  const filtered = filter === 'all' ? resources : resources.filter((r) => r.skill_name === filter);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'course': return <Video size={16} />;
      case 'documentation': return <BookOpen size={16} />;
      case 'article': return <FileText size={16} />;
      default: return <GraduationCap size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Learning Recommendations</h1>
        <p className="text-sm text-navy-500 mt-1">Curated resources to close your skill gaps</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === 'all' ? 'bg-primary-500 text-white' : 'bg-white text-navy-600 border border-navy-200 hover:bg-primary-50'
          }`}
        >
          All
        </button>
        {skills.map((skill) => (
          <button
            key={skill}
            onClick={() => setFilter(skill)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === skill ? 'bg-primary-500 text-white' : 'bg-white text-navy-600 border border-navy-200 hover:bg-primary-50'
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GraduationCap size={28} />}
            title="No resources found"
            message="Learning recommendations will appear here once your CV is analyzed."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <Card key={res.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center text-primary-600">
                  {typeIcon(res.resource_type)}
                </div>
                <Badge
                  variant={res.priority === 'high' ? 'error' : res.priority === 'medium' ? 'warning' : 'neutral'}
                >
                  {res.priority}
                </Badge>
              </div>

              <h3 className="text-sm font-semibold text-navy-800 mb-1 line-clamp-2">{res.title}</h3>
              <p className="text-xs text-navy-500 mb-3">{res.provider}</p>

              <div className="flex items-center gap-3 text-xs text-navy-500 mb-3">
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  {res.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {res.duration_hours}h
                </span>
                <Badge variant="neutral" size="sm">{res.difficulty}</Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-navy-100">
                <Badge variant="primary">{res.skill_name}</Badge>
                {res.url && /^https?:\/\//i.test(res.url) && (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    Open <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
