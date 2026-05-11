// 历史会话面板：memo 优化，open=false 时不触发重渲染
import { memo, useState, useCallback, useEffect } from 'react';
import { Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { ChatSession, ChatSessionMessage } from './aiTypes';
import { fetchSessions, fetchSessionMessages, deleteSession } from './aiSupabase';

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  login: string;
  onLoad: (session: ChatSession, messages: ChatSessionMessage[]) => void;
}

const HistoryPanel = memo(function HistoryPanel({
  open,
  onClose,
  login,
  onLoad,
}: HistoryPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!login) return;
    setLoading(true);
    const data = await fetchSessions(login);
    setSessions(data);
    setLoading(false);
  }, [login]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleLoad = async (session: ChatSession) => {
    const msgs = await fetchSessionMessages(session.id);
    onLoad(session, msgs);
    onClose();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
    toast.success('对话已删除');
  };

  // 按仓库分组
  const grouped: Record<string, ChatSession[]> = {};
  for (const s of sessions) {
    if (!grouped[s.repo_full_name]) grouped[s.repo_full_name] = [];
    grouped[s.repo_full_name].push(s);
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col bg-sidebar">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-sidebar-foreground">历史对话</span>
          </div>
          <span className="text-xs text-muted-foreground">{sessions.length} 条</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 p-2">
                  <Skeleton className="h-3.5 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">暂无历史对话</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {Object.entries(grouped).map(([repo, items]) => (
                <div key={repo}>
                  <div className="px-4 py-2 bg-muted/30 sticky top-0">
                    <span className="text-[10px] font-mono text-muted-foreground font-medium">{repo}</span>
                  </div>
                  {items.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleLoad(s)}
                      className="w-full flex items-start gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sidebar-foreground truncate">{s.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">{s.branch}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(s.updated_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={e => handleDelete(s.id, e)}
                        disabled={deleting === s.id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default HistoryPanel;
