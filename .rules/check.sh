#!/usr/bin/env bash
#
# ast-grep 规则门卡
#
# 通过 sgconfig.yml 的 ruleDirs(: .rules) 加载全部规则后统一扫描，
# 规则文件中的 severity 决定其是否导致失败（error 失败，warning 仅提示）。
#
# ── 历史缺陷（2026-09 修复）─────────────────────────────────────
# 本脚本此前形同虚设，恒返回 0：
#   1) 前 8 条 `ast-grep scan -r <rule>` 未检查退出码，违规被静默丢弃；
#   2) 末尾引用两个并不存在的规则文件 useAuth.yml / authProvider.yml，
#      其 stderr 被 `2>/dev/null` 吞掉 → 变量必为空 → 直接 `exit 0`。
# 实测：即使每条规则都报违规（退出码 1），旧脚本仍返回 0。
# 现改为统一扫描并透传 ast-grep 的退出码。
#
# 注：useAuth / AuthProvider 的成对检查（要求使用 useAuth 的组件被
# AuthProvider 包裹）从未真正实现，对应规则文件不存在，已移除相关
# 死代码。如需该检查，应新建对应规则文件。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

# 依次探测候选二进制，取第一个真正可运行的：
#  1) 项目本地安装（CI 由依赖安装步骤 postinstall 就位原生二进制）；
#     GitHub Actions 默认 shell 的 PATH 不含 node_modules/.bin。
#  2) PATH 中的全局安装。
# 注意：postinstall 未执行时 node_modules/.bin/ast-grep 只是一个运行即报错的
# JS shim（退出码 1），若不探测会被误判成"发现违规"，故必须用 --version 验证。
SG=""
for cand in "node_modules/.bin/ast-grep" "ast-grep"; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" --version >/dev/null 2>&1; then
    SG="$cand"
    break
  fi
done

if [ -z "$SG" ]; then
  echo "❌ ast-grep 不可用（未安装，或原生二进制缺失/损坏）。"
  echo "   请确认 @ast-grep/cli 已安装且 postinstall 已执行"
  echo "   （pnpm-workspace.yaml 中 allowBuilds['@ast-grep/cli'] = true）。"
  echo "   注：该包不提供 MUSL 二进制，仅适用于 glibc 环境（如 CI 的 ubuntu runner）。"
  exit 127
fi

echo "── ast-grep 规则检查（配置来源：sgconfig.yml → ruleDirs: .rules）──"
"$SG" scan
status=$?

# 退出码语义（见 https://ast-grep.github.io/reference/cli/scan）：
#   0  无 error 级匹配        → 通过
#   1  存在 error 级匹配      → 代码违规
#   其他 工具/配置错误（6=配置错误，8=规则解析错误等）→ 工具故障
case "$status" in
  0) echo "✅ ast-grep 规则检查通过" ;;
  1) echo "❌ ast-grep 规则检查发现违规（存在 error 级匹配）" ;;
  *) echo "❌ ast-grep 运行出错（退出码 $status）。这通常是配置或规则文件问题，而非代码违规。" ;;
esac

exit "$status"
