// 导航单一来源（Single Source of Truth）
//
// 背景：此前导航定义散落在三处，且已发生漂移：
//   1. MainLayout.tsx  navItems     —— 桌面侧边栏，12 项
//   2. MainLayout.tsx  bottomTabs   —— Web 端移动底部 Tab，5 项
//   3. NavUtils.kt     NAV_PATH_MAP —— Android 原生底部 Tab，5 项
// 其中 (2) 与 (3) 内容不一致（Web 有「通知」无「搜索」，Android 有「搜索」无「通知」）。
//
// 本文件是唯一权威定义。新增/调整导航项时改这里，并同步 NavUtils.kt。
//
// ⚠️ Android 侧同步契约：
//   NavUtils.kt 的 NAV_PATH_MAP 必须覆盖 PRIMARY_TABS 中的每一个 path（前缀匹配）。
//   修改 PRIMARY_TABS 后请运行 `node scripts/check-nav-sync.mjs` 验证。

import {
  Home,
  BookOpen,
  Bell,
  Search,
  Activity,
  Code2,
  Package2,
  Users,
  Download,
  Braces,
  Sparkles,
  Settings,
  Star,
  User,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

/** Android 原生底部导航对应的菜单项 ID（与 NavUtils.kt / menu_nav.xml 一一对应） */
export type AndroidNavId =
  | 'nav_home'
  | 'nav_repos'
  | 'nav_search'
  | 'nav_ai'
  | 'nav_me';

export interface NavItem {
  /** 稳定标识，用于 key 与测试 */
  id: string;
  label: string;
  /** 路由路径（HashRouter 下为 hash 部分，不含 #） */
  path: string;
  icon: LucideIcon;
  /** 简短说明，用于 /more 与 /me 的卡片 */
  desc?: string;
  /** 是否为底部导航项（Web 端移动 Tab + Android 原生 Tab 共用此定义） */
  primary?: boolean;
  /** 对应 Android 原生菜单项 ID，仅 primary 项需要 */
  androidId?: AndroidNavId;
  /** 是否在桌面侧边栏展示 */
  sidebar?: boolean;
  /**
   * 归属路径：这些路径指向的页面在语义上属于本导航项，
   * 应让本项保持高亮。用于聚合页（如 /me）收纳其他顶层页面时。
   */
  owns?: string[];
}

// ── 主导航（底部 Tab / 侧边栏高亮共用）──────────────────────────
//
// 「丙」方案：首页 · 仓库 · 搜索 · AI · 我的
// 理由：搜索是 GitHub 的核心交互（高频），通知改用顶部铃铛直达，
//       设置收进「我的」聚合页，避免把 1214 行的设置表单当作个人中心。
export const NAV_ITEMS: NavItem[] = [
  { id: 'home',   label: '首页', path: '/',             icon: Home,     desc: '仪表盘总览',      primary: true, androidId: 'nav_home',   sidebar: true },
  { id: 'repos',  label: '仓库', path: '/repos',        icon: BookOpen, desc: '创建/删除/编辑仓库', primary: true, androidId: 'nav_repos',  sidebar: true },
  { id: 'search', label: '搜索', path: '/search',       icon: Search,   desc: '全局搜索仓库/代码/用户', primary: true, androidId: 'nav_search', sidebar: true },
  { id: 'ai',     label: 'AI',   path: '/ai-assistant', icon: Sparkles, desc: 'AI 任务规划与执行', primary: true, androidId: 'nav_ai',    sidebar: true },
  { id: 'me',     label: '我的', path: '/me',           icon: User,     desc: '账号 / 内容 / 工具 / 设置', primary: true, androidId: 'nav_DELIBERATE_DRIFT', sidebar: true,
    // 「我的」是聚合页，以下页面由其收纳 —— 进入这些页面时「我的」Tab 保持高亮
    owns: ['/settings', '/accounts', '/starred', '/gists', '/export', '/upload',
           '/packages', '/graphql-playground', '/actions', '/follow', '/more',
           '/activity'] },

  // ── 以下项进入侧边栏，但不占底部 Tab ──
  { id: 'notifications', label: '通知', path: '/notifications', icon: Bell,     desc: '未读通知与批量已读', sidebar: true },
  { id: 'activity',      label: '活动', path: '/activity',      icon: Activity, desc: '动态时间线',        sidebar: true },
  { id: 'gists',         label: 'Gists',    path: '/gists',    icon: Code2,    desc: '代码片段管理',      sidebar: true },
  { id: 'packages',      label: 'Packages', path: '/packages', icon: Package2, desc: '软件包制品',        sidebar: true },
  { id: 'starred',       label: '收藏', path: '/starred',       icon: Star,     desc: '已 Star 的仓库',    sidebar: true },
  { id: 'more',          label: '全部功能', path: '/more',      icon: LayoutGrid, desc: '功能地图',        sidebar: true },

  // ── 次级项：仅在 /me 聚合页与 /more 出现 ──
  { id: 'settings', label: '设置', path: '/settings', icon: Settings, desc: '外观/账号/AI 配置' },
  { id: 'accounts', label: '账号管理', path: '/accounts', icon: Users,   desc: '多账号切换' },
  { id: 'export',   label: '数据导出', path: '/export',   icon: Download, desc: '导出仓库/Issue 数据' },
  { id: 'graphql',  label: 'GraphQL Playground', path: '/graphql-playground', icon: Braces, desc: 'GraphQL 调试台' },
];

/** 底部导航项（Web 端移动 Tab 与 Android 原生 Tab 使用同一份） */
export const PRIMARY_TABS: NavItem[] = NAV_ITEMS.filter((i) => i.primary);

/** 桌面侧边栏项 */
export const SIDEBAR_ITEMS: NavItem[] = NAV_ITEMS.filter((i) => i.sidebar);

/** 侧边栏底部固定项（设置 / 退出），不参与 primary 判定 */
export const SIDEBAR_FOOTER: NavItem[] = [
  { id: 'settings', label: '设置', path: '/settings', icon: Settings },
];

export function findNavItem(pathname: string): NavItem | undefined {
  // 「/」必须精确匹配，否则会吞掉所有子路径
  return (
    NAV_ITEMS.find((i) => i.path === pathname) ??
    NAV_ITEMS.filter((i) => i.path !== '/').find((i) => pathname.startsWith(i.path))
  );
}

export function isNavActive(item: NavItem, pathname: string): boolean {
  // 显式归属：/me 是聚合页，其入口指向其他顶层路径，
  // 这些页面应让「我的」Tab 保持高亮，否则用户会觉得"点了我的却跳到首页"
  if (item.owns?.length) {
    const owned = item.owns.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (owned) return true;
  }
  if (item.path === '/') return pathname === '/';
  return pathname === item.path || pathname.startsWith(item.path + '/');
}
