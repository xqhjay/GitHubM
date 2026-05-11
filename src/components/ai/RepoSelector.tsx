// 仓库选择器：memo 优化，onSelect 引用不变则不重渲染
import { memo, useState, useCallback, useEffect } from 'react';
import { Search, Star, Lock, Globe, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserRepos } from '@/services/github';
import type { GitHubRepo } from '@/types/types';

interface RepoSelectorProps {
  onSelect: (repo: GitHubRepo) => void;
}

const RepoSelector = memo(function RepoSelector({ onSelect }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getUserRepos({ sort: 'updated', per_page: 30, page: p, type: 'all' });
      if (p === 1) setRepos(res.data);
      else setRepos(prev => [...prev, ...res.data]);
      setHasMore(res.hasNextPage);
      setPage(p);
    } catch {
      toast.error('获取仓库列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(query.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 px-9"
          placeholder="搜索仓库名称或描述…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* 列表 */}
      <ScrollArea className="h-[360px] rounded-lg border border-border">
        <div className="flex flex-col divide-y divide-border">
          {loading && repos.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 flex flex-col gap-2">
                <Skeleton className="h-4 w-2/3 bg-muted" />
                <Skeleton className="h-3 w-full bg-muted" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {query ? `未找到匹配 "${query}" 的仓库` : '暂无仓库'}
            </div>
          ) : (
            filtered.map(repo => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className="flex items-start gap-3 p-3 text-left hover:bg-muted/60 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {repo.full_name}
                    </span>
                    {repo.private
                      ? <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                      : <Globe className="w-3 h-3 text-muted-foreground shrink-0" />}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 text-pretty">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {repo.language && (
                      <span className="text-[10px] text-muted-foreground">{repo.language}</span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Star className="w-3 h-3" />{repo.stargazers_count}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {repo.default_branch}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}

          {/* 加载更多 */}
          {hasMore && !loading && (
            <button
              onClick={() => load(page + 1)}
              className="p-3 text-center text-sm text-primary hover:bg-muted/60 transition-colors"
            >
              加载更多仓库…
            </button>
          )}
          {loading && repos.length > 0 && (
            <div className="p-3 text-center text-xs text-muted-foreground">加载中…</div>
          )}
        </div>
      </ScrollArea>

      <button
        onClick={() => load(1)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-end"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        刷新列表
      </button>
    </div>
  );
});

export default RepoSelector;
