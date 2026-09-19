// 文件类型图标工具 - 根据扩展名返回对应 Lucide 图标和颜色

import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileImage,
  FileJson,
  FileArchive,
  FileBadge,
  File,
  FileVideo,
  FileAudio,
  Database,
  Settings,
  Terminal,
  Globe,
  BookOpen,
  Package,
  Shield,
  Cpu,
  Coffee,
  Hash,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FileIconInfo {
  Icon: LucideIcon;
  color: string;
}

/* ---------------------------------------------------------------------------
 * 文件类型配色约定（有意例外，不参与主题 token 体系）
 *
 * 这里的色值遵循「文件类型约定色」——VSCode / GitHub / Material Icon Theme
 * 等主流工具都使用相似的色相映射（.ts 蓝、.json 黄、.md 灰…）。
 * 它表达的是「这是什么文件」，不是「当前主题的主色」，
 * 因此刻意硬编码色相，而非绑定 --primary / --status-*。
 *
 * 不要把这些值替换成设计 token：换主题时它们应当保持不变。
 * 如需新增类型，请在此集中添加，不要在 getFileIconInfo 里内联 className。
 * ------------------------------------------------------------------------- */
export const FILE_TYPE_COLORS = {
  /* 目录 */
  folder: 'text-yellow-400',

  /* 特殊文件名 */
  docker: 'text-blue-400',
  gitConfig: 'text-orange-400',
  dotenv: 'text-yellow-500',
  license: 'text-green-400',
  readme: 'text-blue-300',

  /* JavaScript / TypeScript */
  javascript: 'text-yellow-300',
  typescript: 'text-blue-400',

  /* Web */
  html: 'text-orange-400',
  css: 'text-pink-400',
  vue: 'text-green-400',
  svelte: 'text-orange-500',

  /* 后端语言 */
  python: 'text-blue-300',
  java: 'text-orange-400',
  kotlin: 'text-purple-400',
  go: 'text-cyan-400',
  rust: 'text-orange-500',
  c: 'text-blue-500',
  cpp: 'text-blue-400',
  csharp: 'text-purple-500',
  php: 'text-indigo-400',
  ruby: 'text-red-400',
  swift: 'text-orange-400',
  dart: 'text-blue-400',
  r: 'text-blue-500',
  scala: 'text-red-500',
  lua: 'text-blue-300',
  elixir: 'text-purple-400',
  erlang: 'text-red-500',
  clojure: 'text-green-500',
  haskell: 'text-purple-400',

  /* Shell / 脚本 */
  shell: 'text-green-400',

  /* 数据 / 配置 */
  json: 'text-yellow-400',
  yaml: 'text-red-300',
  toml: 'text-orange-300',
  xml: 'text-orange-300',
  sql: 'text-blue-400',
  graphql: 'text-pink-500',

  /* 文档 */
  markdown: 'text-blue-300',
  pdf: 'text-red-400',
  word: 'text-blue-500',
  excel: 'text-green-500',
  powerpoint: 'text-orange-400',

  /* 媒体 */
  image: 'text-pink-400',
  video: 'text-purple-400',
  audio: 'text-green-400',

  /* 归档 */
  archive: 'text-yellow-500',

  /* 兜底（使用语义 token，随主题变化） */
  neutral: 'text-muted-foreground',
} as const;

// 图片文件扩展名集合
export const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
  'tiff', 'tif', 'avif', 'heic', 'heif',
]);

// 视频文件扩展名
export const VIDEO_EXTENSIONS = new Set([
  'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv',
]);

export function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return VIDEO_EXTENSIONS.has(ext);
}

const C = FILE_TYPE_COLORS;

/** 特殊文件名 → 图标与配色 */
const SPECIAL_FILES: Array<{
  match: (name: string) => boolean;
  Icon: LucideIcon;
  color: string;
}> = [
  { match: (n) => n === 'dockerfile' || n.startsWith('dockerfile.'), Icon: Package, color: C.docker },
  { match: (n) => n === 'makefile' || n === 'gnumakefile', Icon: Settings, color: C.neutral },
  { match: (n) => n === '.gitignore' || n === '.gitattributes', Icon: Shield, color: C.gitConfig },
  { match: (n) => n === '.env' || n.startsWith('.env.'), Icon: Settings, color: C.dotenv },
  {
    match: (n) =>
      n === 'license' || n === 'licence' || n.startsWith('license.') || n.startsWith('licence.'),
    Icon: FileBadge,
    color: C.license,
  },
  { match: (n) => n === 'readme' || n.startsWith('readme.'), Icon: BookOpen, color: C.readme },
];

/** 扩展名 → 图标与配色 */
const EXTENSION_MAP: Record<string, FileIconInfo> = {
  // JavaScript / TypeScript
  js: { Icon: FileCode, color: C.javascript },
  mjs: { Icon: FileCode, color: C.javascript },
  cjs: { Icon: FileCode, color: C.javascript },
  jsx: { Icon: FileCode, color: C.javascript },
  ts: { Icon: FileCode, color: C.typescript },
  tsx: { Icon: FileCode, color: C.typescript },

  // Web
  html: { Icon: Globe, color: C.html },
  htm: { Icon: Globe, color: C.html },
  xhtml: { Icon: Globe, color: C.html },
  css: { Icon: FileCode, color: C.css },
  scss: { Icon: FileCode, color: C.css },
  sass: { Icon: FileCode, color: C.css },
  less: { Icon: FileCode, color: C.css },
  vue: { Icon: FileCode, color: C.vue },
  svelte: { Icon: FileCode, color: C.svelte },

  // 后端语言
  py: { Icon: FileCode, color: C.python },
  pyw: { Icon: FileCode, color: C.python },
  pyi: { Icon: FileCode, color: C.python },
  java: { Icon: Coffee, color: C.java },
  class: { Icon: Coffee, color: C.java },
  jar: { Icon: Coffee, color: C.java },
  kt: { Icon: FileCode, color: C.kotlin },
  kts: { Icon: FileCode, color: C.kotlin },
  go: { Icon: FileCode, color: C.go },
  rs: { Icon: Cpu, color: C.rust },
  c: { Icon: FileCode, color: C.c },
  h: { Icon: FileCode, color: C.c },
  cpp: { Icon: FileCode, color: C.cpp },
  cc: { Icon: FileCode, color: C.cpp },
  cxx: { Icon: FileCode, color: C.cpp },
  hpp: { Icon: FileCode, color: C.cpp },
  hxx: { Icon: FileCode, color: C.cpp },
  cs: { Icon: FileCode, color: C.csharp },
  php: { Icon: FileCode, color: C.php },
  rb: { Icon: FileCode, color: C.ruby },
  erb: { Icon: FileCode, color: C.ruby },
  swift: { Icon: FileCode, color: C.swift },
  dart: { Icon: FileCode, color: C.dart },
  r: { Icon: FileCode, color: C.r },
  scala: { Icon: FileCode, color: C.scala },
  lua: { Icon: FileCode, color: C.lua },
  ex: { Icon: FileCode, color: C.elixir },
  exs: { Icon: FileCode, color: C.elixir },
  erl: { Icon: FileCode, color: C.erlang },
  hrl: { Icon: FileCode, color: C.erlang },
  clj: { Icon: FileCode, color: C.clojure },
  cljs: { Icon: FileCode, color: C.clojure },
  cljc: { Icon: FileCode, color: C.clojure },
  hs: { Icon: FileCode, color: C.haskell },
  lhs: { Icon: FileCode, color: C.haskell },

  // Shell / 脚本
  sh: { Icon: Terminal, color: C.shell },
  bash: { Icon: Terminal, color: C.shell },
  zsh: { Icon: Terminal, color: C.shell },
  fish: { Icon: Terminal, color: C.shell },
  ps1: { Icon: Terminal, color: C.shell },
  bat: { Icon: Terminal, color: C.shell },
  cmd: { Icon: Terminal, color: C.shell },

  // 数据 / 配置
  json: { Icon: FileJson, color: C.json },
  jsonc: { Icon: FileJson, color: C.json },
  yaml: { Icon: Settings, color: C.yaml },
  yml: { Icon: Settings, color: C.yaml },
  toml: { Icon: Settings, color: C.toml },
  xml: { Icon: FileCode, color: C.xml },
  plist: { Icon: FileCode, color: C.xml },
  env: { Icon: Settings, color: C.dotenv },
  ini: { Icon: Settings, color: C.neutral },
  cfg: { Icon: Settings, color: C.neutral },
  conf: { Icon: Settings, color: C.neutral },
  config: { Icon: Settings, color: C.neutral },
  sql: { Icon: Database, color: C.sql },
  graphql: { Icon: FileCode, color: C.graphql },
  gql: { Icon: FileCode, color: C.graphql },

  // 文档
  md: { Icon: FileText, color: C.markdown },
  mdx: { Icon: FileText, color: C.markdown },
  markdown: { Icon: FileText, color: C.markdown },
  txt: { Icon: FileText, color: C.neutral },
  pdf: { Icon: FileText, color: C.pdf },
  doc: { Icon: FileText, color: C.word },
  docx: { Icon: FileText, color: C.word },
  xls: { Icon: FileText, color: C.excel },
  xlsx: { Icon: FileText, color: C.excel },
  csv: { Icon: FileText, color: C.excel },
  ppt: { Icon: FileText, color: C.powerpoint },
  pptx: { Icon: FileText, color: C.powerpoint },

  // 图片
  jpg: { Icon: FileImage, color: C.image },
  jpeg: { Icon: FileImage, color: C.image },
  png: { Icon: FileImage, color: C.image },
  gif: { Icon: FileImage, color: C.image },
  webp: { Icon: FileImage, color: C.image },
  svg: { Icon: FileImage, color: C.image },
  bmp: { Icon: FileImage, color: C.image },
  ico: { Icon: FileImage, color: C.image },
  tiff: { Icon: FileImage, color: C.image },
  tif: { Icon: FileImage, color: C.image },
  avif: { Icon: FileImage, color: C.image },

  // 视频
  mp4: { Icon: FileVideo, color: C.video },
  webm: { Icon: FileVideo, color: C.video },
  ogg: { Icon: FileVideo, color: C.video },
  mov: { Icon: FileVideo, color: C.video },
  avi: { Icon: FileVideo, color: C.video },
  mkv: { Icon: FileVideo, color: C.video },

  // 音频
  mp3: { Icon: FileAudio, color: C.audio },
  wav: { Icon: FileAudio, color: C.audio },
  flac: { Icon: FileAudio, color: C.audio },
  aac: { Icon: FileAudio, color: C.audio },

  // 归档
  zip: { Icon: FileArchive, color: C.archive },
  tar: { Icon: FileArchive, color: C.archive },
  gz: { Icon: FileArchive, color: C.archive },
  bz2: { Icon: FileArchive, color: C.archive },
  xz: { Icon: FileArchive, color: C.archive },
  '7z': { Icon: FileArchive, color: C.archive },
  rar: { Icon: FileArchive, color: C.archive },
  tgz: { Icon: FileArchive, color: C.archive },

  // Lock / 校验和
  lock: { Icon: Shield, color: C.neutral },
  sum: { Icon: Hash, color: C.neutral },
  sha256: { Icon: Hash, color: C.neutral },
  md5: { Icon: Hash, color: C.neutral },
};

const DEFAULT_ICON: FileIconInfo = { Icon: File, color: C.neutral };

export function getFileIconInfo(filename: string, isDir = false, isOpen = false): FileIconInfo {
  if (isDir) {
    return { Icon: isOpen ? FolderOpen : Folder, color: C.folder };
  }

  const name = filename.toLowerCase();
  const ext = name.split('.').pop() || '';

  const special = SPECIAL_FILES.find((entry) => entry.match(name));
  if (special) return { Icon: special.Icon, color: special.color };

  return EXTENSION_MAP[ext] ?? DEFAULT_ICON;
}
