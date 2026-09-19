// 主题上下文 - 支持深色/浅色/跟随系统 + 主题色自定义

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from "@/i18n";

export type ThemeMode = 'dark' | 'light' | 'system';

// ── 预设主题色方案 ──────────────────────────────────────────────────────────
export interface AccentScheme {
  id: string;
  label: string;
  /** HSL 字符串（不含 hsl()），浅色模式 */
  lightPrimary: string;
  lightAccent: string;
  lightRing: string;
  /** HSL 字符串，深色模式（稍亮） */
  darkPrimary: string;
  darkAccent: string;
  darkRing: string;
  /**
   * 实心主色背景专用亮度（承载白色文字，WCAG AA ≥4.5:1）。
   * 浅色模式与 lightPrimary 同值；深色模式比 darkPrimary 暗约 6 个百分点，
   * 因为深色模式下 darkPrimary 为「发光感」保持高亮度，作实心背景时白字不足。
   * 由 .dark .bg-primary 规则路由，见 index.css 末尾。
   */
  lightPrimarySolid?: string;
  darkPrimarySolid?: string;
  /** 用于预览的 hex 色（同时作为 Android theme-color 基准） */
  previewColor: string;
  /** Android 状态栏浅色背景下的深色变体（可选，默认用 previewColor） */
  lightThemeColor?: string;
}

export const ACCENT_SCHEMES: AccentScheme[] = [
  // ── 原有色 ──────────────────────────────────────────────────────────────
  {
    id: 'purple',
    label: i18n.t('紫罗兰'),
    // 浅色：饱和 83%（原 70% 偏低，视觉发灰显旧），白底对比度 ≥4.5:1
    lightPrimary: '262 83% 58%',   // #7C3BED
    lightAccent:  '258 88% 50%',
    lightRing:    '262 83% 58%',
    // 深色：提高亮度产生发光感（Raycast 风格）
    darkPrimary:  '265 89% 66%',   // #9B5BF5
    darkAccent:   '258 88% 74%',
    darkRing:     '265 89% 66%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '265 89% 60%',
    previewColor: '#7C3BED',
    lightThemeColor: '#6D28D9',
  },
  {
    id: 'blue',
    label: i18n.t('海洋蓝'),
    lightPrimary: '217 91% 50%',
    lightAccent:  '210 100% 45%',
    lightRing:    '217 91% 50%',
    darkPrimary:  '217 91% 65%',
    darkAccent:   '210 100% 70%',
    darkRing:     '217 91% 65%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '217 91% 53%',
    previewColor: '#1d6be3',
    lightThemeColor: '#1d4ed8',
  },
  {
    id: 'green',
    label: i18n.t('翠绿'),
    lightPrimary: '142 71% 31%',
    lightAccent:  '152 80% 29%',
    lightRing:    '142 71% 31%',
    darkPrimary:  '142 65% 52%',
    darkAccent:   '152 72% 54%',
    darkRing:     '142 65% 52%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '142 65% 32%',
    previewColor: '#178740',
    lightThemeColor: '#15803d',
  },
  {
    id: 'orange',
    label: i18n.t('暖橙'),
    lightPrimary: '24 95% 39%',
    lightAccent:  '32 95% 36%',
    lightRing:    '24 95% 39%',
    darkPrimary:  '24 95% 62%',
    darkAccent:   '32 95% 64%',
    darkRing:     '24 95% 62%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '24 95% 39%',
    previewColor: '#C25105',
    lightThemeColor: '#ea580c',
  },
  {
    id: 'rose',
    label: i18n.t('玫瑰红'),
    lightPrimary: '346 77% 50%',
    lightAccent:  '354 83% 50%',
    lightRing:    '346 77% 50%',
    darkPrimary:  '346 77% 64%',
    darkAccent:   '354 83% 70%',
    darkRing:     '346 77% 64%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '346 77% 52%',
    previewColor: '#e11d48',
    lightThemeColor: '#be123c',
  },
  {
    id: 'cyan',
    label: i18n.t('青碧'),
    lightPrimary: '192 90% 32%',
    lightAccent:  '186 88% 30%',
    lightRing:    '192 90% 32%',
    darkPrimary:  '192 88% 54%',
    darkAccent:   '186 84% 58%',
    darkRing:     '192 88% 54%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '192 88% 33%',
    previewColor: '#087E9B',
    lightThemeColor: '#0e7490',
  },
  // ── 新增色 ──────────────────────────────────────────────────────────────
  {
    id: 'indigo',
    label: i18n.t('靛蓝'),
    lightPrimary: '239 84% 58%',
    lightAccent:  '245 88% 64%',
    lightRing:    '239 84% 58%',
    darkPrimary:  '239 84% 70%',
    darkAccent:   '245 88% 76%',
    darkRing:     '239 84% 70%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '239 84% 60%',
    previewColor: '#4f46e5',
    lightThemeColor: '#4338ca',
  },
  {
    id: 'sky',
    label: i18n.t('天空蓝'),
    lightPrimary: '199 89% 37%',
    lightAccent:  '204 94% 40%',
    lightRing:    '199 89% 37%',
    darkPrimary:  '199 89% 60%',
    darkAccent:   '204 94% 64%',
    darkRing:     '199 89% 60%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '199 89% 37%',
    previewColor: '#0A7DB2',
    lightThemeColor: '#0284c7',
  },
  {
    id: 'emerald',
    label: i18n.t('祖母绿'),
    lightPrimary: '160 84% 28%',
    lightAccent:  '166 90% 27%',
    lightRing:    '160 84% 28%',
    darkPrimary:  '160 80% 50%',
    darkAccent:   '166 86% 54%',
    darkRing:     '160 80% 50%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '160 80% 29%',
    previewColor: '#0B835B',
    lightThemeColor: '#047857',
  },
  {
    id: 'teal',
    label: i18n.t('青绿'),
    lightPrimary: '174 72% 30%',
    lightAccent:  '178 76% 29%',
    lightRing:    '174 72% 30%',
    darkPrimary:  '174 68% 52%',
    darkAccent:   '178 72% 56%',
    darkRing:     '174 68% 52%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '174 68% 30%',
    previewColor: '#158479',
    lightThemeColor: '#0f766e',
  },
  {
    id: 'amber',
    label: i18n.t('琥珀'),
    lightPrimary: '38 92% 33%',
    lightAccent:  '45 96% 30%',
    lightRing:    '38 92% 33%',
    darkPrimary:  '38 92% 60%',
    darkAccent:   '45 96% 64%',
    darkRing:     '38 92% 60%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '38 92% 33%',
    previewColor: '#A26907',
    lightThemeColor: '#b45309',
  },
  {
    id: 'pink',
    label: i18n.t('樱花粉'),
    lightPrimary: '330 81% 49%',
    lightAccent:  '336 84% 49%',
    lightRing:    '330 81% 49%',
    darkPrimary:  '330 81% 68%',
    darkAccent:   '336 84% 72%',
    darkRing:     '330 81% 68%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '330 81% 49%',
    previewColor: '#E2187D',
    lightThemeColor: '#db2777',
  },
  {
    id: 'violet',
    label: i18n.t('薰衣草'),
    lightPrimary: '280 68% 56%',
    lightAccent:  '275 72% 50%',
    lightRing:    '280 68% 56%',
    darkPrimary:  '280 68% 68%',
    darkAccent:   '275 72% 74%',
    darkRing:     '280 68% 68%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '280 68% 57%',
    previewColor: '#8b5cf6',
    lightThemeColor: '#7c3aed',
  },
  {
    id: 'gold',
    label: i18n.t('金色'),
    lightPrimary: '43 96% 30%',
    lightAccent:  '48 98% 28%',
    lightRing:    '43 96% 30%',
    darkPrimary:  '43 96% 58%',
    darkAccent:   '48 98% 62%',
    darkRing:     '43 96% 58%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '43 96% 30%',
    previewColor: '#966C03',
    lightThemeColor: '#a16207',
  },
  // ── 扩展色 ──────────────────────────────────────────────────────────────
  {
    id: 'coral',
    label: i18n.t('珊瑚橙'),
    lightPrimary: '16 88% 44%',
    lightAccent:  '22 92% 41%',
    lightRing:    '16 88% 44%',
    darkPrimary:  '16 88% 64%',
    darkAccent:   '22 92% 68%',
    darkRing:     '16 88% 64%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '16 88% 44%',
    previewColor: '#D3420D',
    lightThemeColor: '#d94420',
  },
  {
    id: 'lime',
    label: i18n.t('荧光绿'),
    lightPrimary: '82 66% 30%',
    lightAccent:  '90 70% 30%',
    lightRing:    '82 66% 30%',
    darkPrimary:  '82 66% 54%',
    darkAccent:   '90 70% 58%',
    darkRing:     '82 66% 54%',
    // 实心块白字 ≥4.5:1（darkPrimary 作前景用，亮度更高）
    darkPrimarySolid: '82 66% 30%',
    previewColor: '#5A7F1A',
    lightThemeColor: '#4d7c0f',
  },
];

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  resolvedTheme: 'dark' | 'light';
  accentSchemeId: string;
  setAccentScheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY        = 'github_manager_theme';
const ACCENT_STORAGE_KEY = 'github_manager_accent';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 同步更新 <meta name="theme-color">：
 * - 有 scheme 时：用强调色作为状态栏颜色，让安卓 WebView 工具栏跟随主题色
 * - 无 scheme 时：退回默认深/浅背景色
 */
function updateThemeColorMeta(isDark: boolean, scheme?: AccentScheme) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) return;
  if (scheme) {
    // 深色：直接用预览色；浅色：用可选的浅色变体（对比度更好）
    meta.setAttribute('content', isDark ? scheme.previewColor : (scheme.lightThemeColor ?? scheme.previewColor));
  } else {
    meta.setAttribute('content', isDark ? '#1e1b4b' : '#f5f3ff');
  }
}

/** 将主题色方案注入 CSS 变量，更新 theme-color meta，并通知 Android 原生层 */
function applyAccentScheme(scheme: AccentScheme, resolved: 'dark' | 'light') {
  const root = document.documentElement;
  const isDark = resolved === 'dark';
  root.style.setProperty('--primary', isDark ? scheme.darkPrimary : scheme.lightPrimary);
  // 实心主色背景：深色模式需比 --primary 更暗才能承载白字（WCAG AA）。
  // 未显式提供时回退到 --primary，保证向后兼容。
  root.style.setProperty(
    '--primary-solid',
    (isDark ? scheme.darkPrimarySolid : scheme.lightPrimarySolid)
      ?? (isDark ? scheme.darkPrimary : scheme.lightPrimary)
  );
  root.style.setProperty('--accent',  isDark ? scheme.darkAccent  : scheme.lightAccent);
  root.style.setProperty('--ring',    isDark ? scheme.darkRing    : scheme.lightRing);
  // sidebar-primary / sidebar-ring 同步
  root.style.setProperty('--sidebar-primary', isDark ? scheme.darkPrimary : scheme.lightPrimary);
  root.style.setProperty('--sidebar-ring',    isDark ? scheme.darkRing    : scheme.lightRing);
  // 更新 theme-color meta（影响 Android WebView 状态栏/工具栏颜色）
  updateThemeColorMeta(isDark, scheme);
  // 动态更新 favicon（浏览器标签页 + PWA 主屏快捷方式图标）
  updateFaviconAccent(scheme.previewColor);
  // 通知 Android 原生层同步强调色（底部导航选中色 + 最近任务图标色）
  notifyAndroidAccent(scheme.previewColor);
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const html = document.documentElement;
  if (resolved === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
  } else {
    html.classList.add('light');
    html.classList.remove('dark');
  }
  // 通知 APK 壳同步更新状态栏与底部导航栏颜色
  notifyAndroidTheme(resolved === 'dark');
  return resolved;
}

/**
 * 向 Android 原生层推送主题变化。
 * AndroidBridge 由 MainActivity 的 addJavascriptInterface 注入，
 * 纯浏览器环境中不存在，通过可选链安全调用。
 */
function notifyAndroidTheme(isDark: boolean) {
  try {
    (window as unknown as { AndroidBridge?: { notifyTheme?: (d: boolean) => void } })
      .AndroidBridge?.notifyTheme?.(isDark);
  } catch {
    // 非 APK 环境或旧版本壳，静默忽略
  }
}

/**
 * 向 Android 原生层推送强调色变化。
 * 原生壳可通过以下方式响应：
 *   1. notifyAccent(hex)  → 底部导航栏选中色
 *   2. notifyAccentIcon(hex) → 调用 setTaskDescription() 更新最近任务图标色
 *      示例 Kotlin：
 *        setTaskDescription(ActivityManager.TaskDescription(null, null, Color.parseColor(hex)))
 * @param primaryHex 当前方案的 hex 色值，如 "#7c3aed"
 */
function notifyAndroidAccent(primaryHex: string) {
  try {
    const bridge = (window as unknown as {
      AndroidBridge?: {
        notifyAccent?:     (hex: string) => void;
        notifyAccentIcon?: (hex: string) => void;
      }
    }).AndroidBridge;
    bridge?.notifyAccent?.(primaryHex);
    // notifyAccentIcon 用于原生层更新最近任务栏图标色
    bridge?.notifyAccentIcon?.(primaryHex);
  } catch {
    // 非 APK 环境或旧版本壳，静默忽略
  }
}

/**
 * 动态更新 favicon / apple-touch-icon。
 * 将 logo.svg 的填充色替换为当前强调色，生成 data URI SVG 并写入 <link rel="icon">。
 * 这样浏览器标签页图标、PWA 主屏快捷方式图标均会跟随主题色变化。
 */
function updateFaviconAccent(hex: string) {
  // GitHub Octocat path (与 public/logo.svg 保持一致)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 16 16">
    <path fill="${hex}" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59c.4.07.55-.17.55-.38c0-.19-.01-.82-.01-1.49c-2.01.37-2.53-.49-2.69-.94c-.09-.23-.48-.94-.82-1.13c-.28-.15-.68-.52-.01-.53c.63-.01 1.08.58 1.23.82c.72 1.21 1.87.87 2.33.66c.07-.52.28-.87.51-1.07c-1.78-.2-3.64-.89-3.64-3.95c0-.87.31-1.59.82-2.15c-.08-.2-.36-1.02.08-2.12c0 0 .67-.21 2.2.82c.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82c.44 1.1.16 1.92.08 2.12c.51.56.82 1.27.82 2.15c0 3.07-1.87 3.75-3.65 3.95c.29.25.54.73.54 1.48c0 1.07-.01 1.93-.01 2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
  </svg>`;
  const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;

  // 更新 favicon
  let link: HTMLLinkElement | null =
    document.querySelector('link[rel*="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = dataUri;

  // 更新 apple-touch-icon
  let appleLink: HTMLLinkElement | null = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleLink) {
    appleLink.href = dataUri;
  }
}

/**
 * 触发主题切换过渡动画：
 * 向 <html> 添加 theme-transitioning class，CSS 中借助它激活全局 transition，
 * 动画结束后移除，避免页面初始加载时也触发不必要的过渡。
 */
function triggerThemeTransition(callback: () => void) {
  const html = document.documentElement;
  html.classList.add('theme-transitioning');
  callback();
  // 等待最长过渡时长后移除（300ms 与 CSS 对齐）
  setTimeout(() => html.classList.remove('theme-transitioning'), 350);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved || 'system';
  });
  // 同步初始化：applyTheme + applyAccentScheme 在同一个 useState 初始化器里执行，
  // 确保 notifyAndroidTheme / notifyAndroidAccent / notifyAccentIcon 在 React mount
  // 之前就已通知 AndroidBridge，避免原生层收不到首次颜色信号。
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    const mode = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) || 'system';
    const resolved = applyTheme(mode);
    const savedId = localStorage.getItem(ACCENT_STORAGE_KEY) || 'purple';
    const scheme = ACCENT_SCHEMES.find(s => s.id === savedId) ?? ACCENT_SCHEMES[0];
    applyAccentScheme(scheme, resolved);
    return resolved;
  });

  // ── 主题色方案 ──────────────────────────────────────────────────────────
  const [accentSchemeId, setAccentSchemeIdState] = useState<string>(() => {
    return localStorage.getItem(ACCENT_STORAGE_KEY) || 'purple';
  });

  const setAccentScheme = useCallback((id: string) => {
    const scheme = ACCENT_SCHEMES.find(s => s.id === id) ?? ACCENT_SCHEMES[0];
    localStorage.setItem(ACCENT_STORAGE_KEY, scheme.id);
    setAccentSchemeIdState(scheme.id);
    applyAccentScheme(scheme, resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((t: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    triggerThemeTransition(() => {
      const resolved = applyTheme(t);
      setResolvedTheme(resolved);
      // 切换明暗时重新应用当前色方案，确保色值对应正确的明暗变体
      const savedId = localStorage.getItem(ACCENT_STORAGE_KEY) || 'purple';
      const scheme = ACCENT_SCHEMES.find(s => s.id === savedId) ?? ACCENT_SCHEMES[0];
      applyAccentScheme(scheme, resolved);
    });
  }, []);

  // 跟随系统变化
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      triggerThemeTransition(() => {
        const resolved = applyTheme('system');
        setResolvedTheme(resolved);
        const savedId = localStorage.getItem(ACCENT_STORAGE_KEY) || 'purple';
        const scheme = ACCENT_SCHEMES.find(s => s.id === savedId) ?? ACCENT_SCHEMES[0];
        applyAccentScheme(scheme, resolved);
      });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, accentSchemeId, setAccentScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
