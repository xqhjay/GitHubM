#!/usr/bin/env node
// 导航同步检查 —— 确保前端 PRIMARY_TABS 与 Android NavUtils.kt 不漂移
//
// 背景：此前 Web 底部 Tab（首页/仓库/AI/通知/我的）与
//       Android 原生 Tab（首页/仓库/搜索/AI/设置）已经不一致，且无人发现。
//       本脚本在 CI 中运行，任何一侧改动而另一侧未跟上都会失败。
//
// 用法：node scripts/check-nav-sync.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const navTs = path.join(root, 'src/lib/navigation.ts');
const navKt = path.join(root, 'android/app/src/main/java/com/github/manager/NavUtils.kt');

const fail = (msg) => {
  console.error('❌ 导航同步检查失败：' + msg);
  process.exit(1);
};

if (!fs.existsSync(navTs)) fail(`找不到 ${navTs}`);
if (!fs.existsSync(navKt)) fail(`找不到 ${navKt}`);

// ── 从 navigation.ts 提取 primary 项的 path 与 androidId ──
const ts = fs.readFileSync(navTs, 'utf8');
const primaryBlock = ts.split('PRIMARY_TABS')[0];
const items = [];
for (const m of ts.matchAll(/\{[^{}]*primary:\s*true[^{}]*\}/g)) {
  const pathM = m[0].match(/path:\s*'([^']+)'/);
  const idM = m[0].match(/androidId:\s*'([^']+)'/);
  if (pathM) items.push({ path: pathM[1], androidId: idM ? idM[1] : null });
}

if (items.length === 0) fail('未从 navigation.ts 解析到任何 primary 导航项');

// ── 从 NavUtils.kt 提取 NAV_PATH_MAP ──
const kt = fs.readFileSync(navKt, 'utf8');
const mapBlock = kt.match(/NAV_PATH_MAP[\s\S]*?=\s*linkedMapOf\(([\s\S]*?)\)/);
if (!mapBlock) fail('未在 NavUtils.kt 中找到 NAV_PATH_MAP');

const ktEntries = [];
for (const m of mapBlock[1].matchAll(/"([^"]+)"\s*to\s*R\.id\.(\w+)/g)) {
  ktEntries.push({ path: m[1], androidId: m[2] });
}

if (ktEntries.length === 0) fail('NAV_PATH_MAP 为空或解析失败');

// ── 比对 ──
const errors = [];

const ktPaths = new Set(ktEntries.map((e) => e.path));
const ktIds = new Set(ktEntries.map((e) => e.androidId));

for (const it of items) {
  if (!it.androidId) {
    errors.push(`navigation.ts 中 primary 项 "${it.path}" 缺少 androidId 字段`);
    continue;
  }
  if (!ktIds.has(it.androidId)) {
    errors.push(`Android 缺少菜单项: ${it.androidId}（对应前端 "${it.path}"）`);
  }
  // 路径需前缀匹配：Android 侧允许用更短的父路径，但不得指向别的路由
  const covered = [...ktPaths].some(
    (p) => p === it.path || it.path.startsWith(p === '/' ? '\0' : p + '/')
  );
  if (!covered && !ktPaths.has(it.path)) {
    errors.push(`Android NAV_PATH_MAP 未覆盖前端路径 "${it.path}"`);
  }
}

for (const e of ktEntries) {
  const matched = items.find((it) => it.path === e.path);
  if (!matched && e.path !== '/') {
    errors.push(`Android 独有路径 "${e.path}" 在前端 primary 中没有对应项`);
  }
}

if (items.length !== ktEntries.length) {
  errors.push(
    `数量不一致：前端 primary=${items.length}，Android=${ktEntries.length}\n` +
      `  前端: ${items.map((i) => i.path).join(', ')}\n` +
      `  Android: ${ktEntries.map((e) => e.path).join(', ')}`
  );
}

if (errors.length) {
  console.error('❌ 导航定义漂移：\n');
  errors.forEach((e) => console.error('  • ' + e));
  console.error('\n请同步修改以下两处后重试：');
  console.error('  • src/lib/navigation.ts  (PRIMARY_TABS / androidId)');
  console.error('  • android/.../NavUtils.kt (NAV_PATH_MAP)');
  console.error('  • android/app/src/main/res/menu/bottom_nav_menu.xml (菜单项声明)');
  process.exit(1);
}

console.log(`✓ 导航同步正常（${items.length} 个底部 Tab 两端一致）`);
items.forEach((i) => console.log(`    ${i.path.padEnd(16)} → ${i.androidId}`));
