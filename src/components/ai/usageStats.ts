// AI 用量统计本地存储工具
// 数据存于 localStorage key: ai_usage_stats
// 结构：每条记录含平台、模型、token 用量和时间戳
// 自动清理 30 天前记录

export interface UsageRecord {
  id: string;           // 唯一 ID
  providerType: string; // 平台类型（deepseek/gemini/qwen/groq/openai/custom）
  model: string;        // 模型名
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: number;    // ms since epoch
}

export interface ProviderStats {
  providerType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  lastUsed: number;
}

const STORAGE_KEY = 'ai_usage_stats';
const RETENTION_DAYS = 30;

function loadAll(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(records: UsageRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage 已满时静默失败
  }
}

/** 清理 30 天前的记录 */
function prune(records: UsageRecord[]): UsageRecord[] {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return records.filter(r => r.timestamp >= cutoff);
}

/** 写入一条用量记录 */
export function appendUsageRecord(
  providerType: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
) {
  const all = prune(loadAll());
  const record: UsageRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    providerType,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    timestamp: Date.now(),
  };
  all.push(record);
  saveAll(all);
}

/** 获取近 30 天按平台分组的汇总统计 */
export function getProviderStats(): ProviderStats[] {
  const all = prune(loadAll());
  const map = new Map<string, ProviderStats>();
  for (const r of all) {
    let s = map.get(r.providerType);
    if (!s) {
      s = {
        providerType: r.providerType,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        lastUsed: 0,
      };
      map.set(r.providerType, s);
    }
    s.promptTokens += r.promptTokens;
    s.completionTokens += r.completionTokens;
    s.totalTokens += r.totalTokens;
    s.requestCount += 1;
    if (r.timestamp > s.lastUsed) s.lastUsed = r.timestamp;
  }
  return Array.from(map.values()).sort((a, b) => b.lastUsed - a.lastUsed);
}

/** 获取近 30 天总记录数 */
export function getTotalRequestCount(): number {
  return prune(loadAll()).length;
}

/** 清空所有用量记录 */
export function clearAllUsage() {
  localStorage.removeItem(STORAGE_KEY);
}
