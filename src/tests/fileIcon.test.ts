// FileIcon 映射回归测试
//
// 目的：getFileIconInfo 的映射表经过重构（switch → 集中数据表）后，
// 必须保证「扩展名/特殊文件名 → 图标 + 配色」的行为与重构前完全一致。
// 这里的期望值是重构前的原始映射，作为行为契约固化下来。

import { describe, expect, it } from 'vitest';
import {
  getFileIconInfo,
  isImageFile,
  isVideoFile,
  FILE_TYPE_COLORS,
} from '@/components/common/FileIcon';

describe('getFileIconInfo — 目录', () => {
  it('未展开的目录使用 Folder 与黄色', () => {
    const info = getFileIconInfo('src', true, false);
    expect(info.Icon.displayName ?? info.Icon.name).toBe('Folder');
    expect(info.color).toBe('text-yellow-400');
  });

  it('展开的目录使用 FolderOpen', () => {
    const info = getFileIconInfo('src', true, true);
    expect(info.Icon.displayName ?? info.Icon.name).toBe('FolderOpen');
    expect(info.color).toBe('text-yellow-400');
  });
});

describe('getFileIconInfo — 特殊文件名', () => {
  it.each([
    ['Dockerfile', 'text-blue-400'],
    ['dockerfile.dev', 'text-blue-400'],
    ['.gitignore', 'text-orange-400'],
    ['.gitattributes', 'text-orange-400'],
    ['.env', 'text-yellow-500'],
    ['.env.local', 'text-yellow-500'],
    ['LICENSE', 'text-green-400'],
    ['README.md', 'text-blue-300'],
    ['Makefile', 'text-muted-foreground'],
  ])('%s → %s', (name, color) => {
    expect(getFileIconInfo(name).color).toBe(color);
  });
});

describe('getFileIconInfo — 扩展名映射（重构前的完整契约）', () => {
  const cases: Array<[string, string]> = [
    // JavaScript / TypeScript
    ['a.js', 'text-yellow-300'],
    ['a.mjs', 'text-yellow-300'],
    ['a.cjs', 'text-yellow-300'],
    ['a.jsx', 'text-yellow-300'],
    ['a.ts', 'text-blue-400'],
    ['a.tsx', 'text-blue-400'],
    // Web
    ['a.html', 'text-orange-400'],
    ['a.htm', 'text-orange-400'],
    ['a.xhtml', 'text-orange-400'],
    ['a.css', 'text-pink-400'],
    ['a.scss', 'text-pink-400'],
    ['a.sass', 'text-pink-400'],
    ['a.less', 'text-pink-400'],
    ['a.vue', 'text-green-400'],
    ['a.svelte', 'text-orange-500'],
    // 后端语言
    ['a.py', 'text-blue-300'],
    ['a.pyw', 'text-blue-300'],
    ['a.pyi', 'text-blue-300'],
    ['a.java', 'text-orange-400'],
    ['a.class', 'text-orange-400'],
    ['a.jar', 'text-orange-400'],
    ['a.kt', 'text-purple-400'],
    ['a.kts', 'text-purple-400'],
    ['a.go', 'text-cyan-400'],
    ['a.rs', 'text-orange-500'],
    ['a.c', 'text-blue-500'],
    ['a.h', 'text-blue-500'],
    ['a.cpp', 'text-blue-400'],
    ['a.cc', 'text-blue-400'],
    ['a.cxx', 'text-blue-400'],
    ['a.hpp', 'text-blue-400'],
    ['a.hxx', 'text-blue-400'],
    ['a.cs', 'text-purple-500'],
    ['a.php', 'text-indigo-400'],
    ['a.rb', 'text-red-400'],
    ['a.erb', 'text-red-400'],
    ['a.swift', 'text-orange-400'],
    ['a.dart', 'text-blue-400'],
    ['a.r', 'text-blue-500'],
    ['a.scala', 'text-red-500'],
    ['a.lua', 'text-blue-300'],
    ['a.ex', 'text-purple-400'],
    ['a.exs', 'text-purple-400'],
    ['a.erl', 'text-red-500'],
    ['a.hrl', 'text-red-500'],
    ['a.clj', 'text-green-500'],
    ['a.cljs', 'text-green-500'],
    ['a.cljc', 'text-green-500'],
    ['a.hs', 'text-purple-400'],
    ['a.lhs', 'text-purple-400'],
    // Shell
    ['a.sh', 'text-green-400'],
    ['a.bash', 'text-green-400'],
    ['a.zsh', 'text-green-400'],
    ['a.fish', 'text-green-400'],
    ['a.ps1', 'text-green-400'],
    ['a.bat', 'text-green-400'],
    ['a.cmd', 'text-green-400'],
    // 数据 / 配置
    ['a.json', 'text-yellow-400'],
    ['a.jsonc', 'text-yellow-400'],
    ['a.yaml', 'text-red-300'],
    ['a.yml', 'text-red-300'],
    ['a.toml', 'text-orange-300'],
    ['a.xml', 'text-orange-300'],
    ['a.plist', 'text-orange-300'],
    ['a.env', 'text-yellow-500'],
    ['a.ini', 'text-muted-foreground'],
    ['a.cfg', 'text-muted-foreground'],
    ['a.conf', 'text-muted-foreground'],
    ['a.config', 'text-muted-foreground'],
    ['a.sql', 'text-blue-400'],
    ['a.graphql', 'text-pink-500'],
    ['a.gql', 'text-pink-500'],
    // 文档
    ['a.md', 'text-blue-300'],
    ['a.mdx', 'text-blue-300'],
    ['a.markdown', 'text-blue-300'],
    ['a.txt', 'text-muted-foreground'],
    ['a.pdf', 'text-red-400'],
    ['a.doc', 'text-blue-500'],
    ['a.docx', 'text-blue-500'],
    ['a.xls', 'text-green-500'],
    ['a.xlsx', 'text-green-500'],
    ['a.csv', 'text-green-500'],
    ['a.ppt', 'text-orange-400'],
    ['a.pptx', 'text-orange-400'],
    // 媒体
    ['a.jpg', 'text-pink-400'],
    ['a.jpeg', 'text-pink-400'],
    ['a.png', 'text-pink-400'],
    ['a.gif', 'text-pink-400'],
    ['a.webp', 'text-pink-400'],
    ['a.svg', 'text-pink-400'],
    ['a.bmp', 'text-pink-400'],
    ['a.ico', 'text-pink-400'],
    ['a.tiff', 'text-pink-400'],
    ['a.tif', 'text-pink-400'],
    ['a.avif', 'text-pink-400'],
    ['a.mp4', 'text-purple-400'],
    ['a.webm', 'text-purple-400'],
    ['a.ogg', 'text-purple-400'],
    ['a.mov', 'text-purple-400'],
    ['a.avi', 'text-purple-400'],
    ['a.mkv', 'text-purple-400'],
    ['a.mp3', 'text-green-400'],
    ['a.wav', 'text-green-400'],
    ['a.flac', 'text-green-400'],
    ['a.aac', 'text-green-400'],
    // 归档
    ['a.zip', 'text-yellow-500'],
    ['a.tar', 'text-yellow-500'],
    ['a.gz', 'text-yellow-500'],
    ['a.bz2', 'text-yellow-500'],
    ['a.xz', 'text-yellow-500'],
    ['a.7z', 'text-yellow-500'],
    ['a.rar', 'text-yellow-500'],
    ['a.tgz', 'text-yellow-500'],
    // Lock / 校验和
    ['a.lock', 'text-muted-foreground'],
    ['a.sum', 'text-muted-foreground'],
    ['a.sha256', 'text-muted-foreground'],
    ['a.md5', 'text-muted-foreground'],
  ];

  it.each(cases)('%s 的配色为 %s', (filename, color) => {
    expect(getFileIconInfo(filename).color).toBe(color);
  });

  it('覆盖全部原始映射用例', () => {
    // 防止未来有人「顺手删掉几个 case」而测试仍然全绿
    expect(cases.length).toBeGreaterThanOrEqual(110);
  });
});

describe('getFileIconInfo — 大小写与无扩展名', () => {
  it('扩展名大写时仍能命中', () => {
    expect(getFileIconInfo('A.TSX').color).toBe('text-blue-400');
    expect(getFileIconInfo('README.MD').color).toBe('text-blue-300');
  });

  it('无扩展名的普通文件走兜底', () => {
    const info = getFileIconInfo('UNKNOWN_FILE');
    expect(info.color).toBe('text-muted-foreground');
    expect(info.Icon.displayName ?? info.Icon.name).toBe('File');
  });

  it('无扩展名但含点的隐藏文件', () => {
    expect(getFileIconInfo('.npmrc').color).toBe('text-muted-foreground');
  });
});

describe('FILE_TYPE_COLORS 常量', () => {
  it('被导出以供其他模块复用', () => {
    expect(FILE_TYPE_COLORS.typescript).toBe('text-blue-400');
    expect(FILE_TYPE_COLORS.neutral).toBe('text-muted-foreground');
  });
});

describe('isImageFile / isVideoFile', () => {
  it('识别图片扩展名', () => {
    expect(isImageFile('a.png')).toBe(true);
    expect(isImageFile('a.JPEG')).toBe(true);
    expect(isImageFile('a.heic')).toBe(true);
    expect(isImageFile('a.ts')).toBe(false);
    expect(isImageFile('noext')).toBe(false);
  });

  it('识别视频扩展名', () => {
    expect(isVideoFile('a.mp4')).toBe(true);
    expect(isVideoFile('a.MKV')).toBe(true);
    expect(isVideoFile('a.ts')).toBe(false);
  });
});
