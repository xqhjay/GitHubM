// 我的 —— 个人中心聚合页
//
// 背景：底部导航第 5 项此前直接指向 /settings（1214 行的设置表单），
//       用户点击「我的」看到的却是 API Key 配置，与预期不符；
//       同时 30+ 功能页中只有 5 个能从底部到达，其余靠 /more 功能地图兜底。
//
// 本页把个人相关入口按用途分组（内容 / 工具 / 系统），
// 使「我的」成为真正的个人中心，而非设置页别名。
//
// 导航项来源：src/lib/navigation.ts（单一来源，勿在此硬编码路径）

import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Code2,
  Users,
  BookOpen,
  Activity,
  Package2,
  Zap,
  Braces,
  Download,
  Upload,
  Settings,
  LogOut,
  ChevronRight,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS } from '@/lib/navigation';
import i18n from '@/i18n';

interface Entry {
  label: string;
  desc: string;
  path: string;
  icon: LucideIcon;
}

/** 从导航定义取 desc，保证与 /more 的说明一致 */
const navDesc = (id: string, fallback: string) =>
  NAV_ITEMS.find((i) => i.id === id)?.desc ?? fallback;

const GROUPS: { title: string; items: Entry[] }[] = [
  {
    title: '我的内容',
    items: [
      { label: '我的收藏', desc: navDesc('starred', '已 Star 的仓库'), path: '/starred', icon: Star },
      { label: 'Gists', desc: navDesc('gists', '代码片段管理'), path: '/gists', icon: Code2 },
      { label: '关注列表', desc: '关注者 / 正在关注', path: '/follow-list/followers', icon: Users },
      { label: '我的仓库', desc: navDesc('repos', '创建/删除/编辑仓库'), path: '/repos', icon: BookOpen },
      { label: '活动', desc: navDesc('activity', '动态时间线'), path: '/activity', icon: Activity },
    ],
  },
  {
    title: '工具',
    items: [
      { label: 'Actions', desc: '工作流运行与日志', path: '/repos', icon: Zap },
      { label: 'Packages', desc: navDesc('packages', '软件包制品'), path: '/packages', icon: Package2 },
      { label: 'GraphQL Playground', desc: navDesc('graphql', 'GraphQL 调试台'), path: '/graphql-playground', icon: Braces },
      { label: '数据导出', desc: navDesc('export', '导出仓库/Issue 数据'), path: '/export', icon: Download },
      { label: '批量上传', desc: '向仓库批量上传文件', path: '/repos', icon: Upload },
      { label: '全部功能', desc: '完整功能地图', path: '/more', icon: LayoutGrid },
    ],
  },
  {
    title: '系统',
    items: [
      { label: '设置', desc: navDesc('settings', '外观/账号/AI 配置'), path: '/settings', icon: Settings },
      { label: '账号管理', desc: navDesc('accounts', '多账号切换'), path: '/accounts', icon: Users },
    ],
  },
];

export default function MePage() {
  const { user, loading, rateLimit, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* ── 用户卡片 ── */}
      <Card className="overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          {loading ? (
            <>
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="w-14 h-14 border border-border">
                <AvatarImage src={user?.avatar_url} alt={user?.login} />
                <AvatarFallback>{user?.login?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {user?.name || user?.login}
                </p>
                <p className="text-sm text-muted-foreground truncate">@{user?.login}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>
                    <b className="text-foreground font-semibold">{user?.public_repos ?? 0}</b> 仓库
                  </span>
                  <span>
                    <b className="text-foreground font-semibold">{user?.followers ?? 0}</b> 关注者
                  </span>
                  <span>
                    <b className="text-foreground font-semibold">{user?.following ?? 0}</b> 正在关注
                  </span>
                </div>
              </div>
              {rateLimit && (
                <Badge variant="outline" className="text-xs shrink-0 border-border text-muted-foreground">
                  {rateLimit.remaining}/{rateLimit.limit}
                </Badge>
              )}
            </>
          )}
        </div>
      </Card>

      {/* ── 分组入口 ── */}
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="text-xs font-medium text-muted-foreground px-1 mb-2">{group.title}</h2>
          <Card className="divide-y divide-border overflow-hidden p-0">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </Card>
        </section>
      ))}

      {/* ── 退出登录 ── */}
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        {i18n.t('退出登录')}
      </Button>
    </div>
  );
}
