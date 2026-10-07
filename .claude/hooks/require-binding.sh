#!/usr/bin/env bash
# PreToolUse hook: deterministic backstop for the conversation-binding gate
# (OPERATING.md § Conversation binding, task-binding-gap-audit).
#
# Denies file-mutating tools (Write / Edit / MultiEdit / NotebookEdit) until this
# conversation has recorded a binding marker. This is DEFENSE-IN-DEPTH, not the
# whole gate: it catches tool-touching work that starts before binding, but it
# CANNOT stop a pure-text reply given before the binding ask — that layer is
# irreducibly the maintainer's first-turn discipline (the OPERATING.md gate).
# The commit-boundary CI audit (task-binding-gap-audit) remains the persist-time
# backstop; this closes the earlier edit-boundary slip.
#
# Acceptance before work (spec/architecture/REVIEW.md § Acceptance before work,
# task-acceptance-before-work): when project.md sets `basis: accepted`, a bound
# session may still not edit files outside .konspekt/instance/ until the bound
# entity is `review: accepted`. Edits inside the instance stay allowed, because
# the proposal and its acceptance are written there. Under `basis: proposed`,
# or with no `basis` field, this second check does nothing.
#
# Pure bash, no jq (matches load-mandatory-skills.sh — jq is not on every box).
# On any parse failure it fails OPEN (allows) rather than bricking edits; the
# enforced path is when session_id is present, which it is in current builds.
set -euo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-.}"
marker_dir="$project_dir/.claude/.binding"

# Read the hook payload from stdin.
input="$(cat)"

# Extract a top-level JSON string field without jq. Returns empty if absent.
json_str_field() {
  local key="$1"
  printf '%s' "$input" \
    | grep -oE "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
    | head -n1 \
    | sed -E "s/.*:[[:space:]]*\"([^\"]*)\"/\1/"
}

tool_name="$(json_str_field tool_name || true)"
session_id="$(json_str_field session_id || true)"

# Only file-mutating tools are gated. Anything else (Bash, Read, Grep, …) passes,
# so the maintainer can still create the marker via Bash once bound.
case "$tool_name" in
  Write|Edit|MultiEdit|NotebookEdit) ;;
  *) exit 0 ;;
esac

# Fail open if we could not identify the session (older builds / parse miss):
# refusing every edit on a parse failure is worse than the gap it guards.
if [[ -z "$session_id" ]]; then
  printf 'require-binding: session_id not found in hook input; allowing (fail-open).\n' >&2
  exit 0
fi

# Escape for embedding as a JSON string value (no jq).
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\r'/}"
  s="${s//$'\t'/\\t}"
  s="${s//$'\n'/\\n}"
  printf '%s' "$s"
}
deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' \
    "$(json_escape "$1")"
  exit 0
}

marker="$marker_dir/$session_id"
if [[ -s "$marker" ]]; then
  # Binding recorded for this session. Under `basis: accepted`, also require
  # that the bound entity is accepted before a file outside the instance changes.
  instance="$project_dir/.konspekt/instance"
  basis="$(grep -m1 -E '^basis:[[:space:]]*[A-Za-z]+[[:space:]]*$' "$instance/project.md" 2>/dev/null \
    | sed -E 's/^basis:[[:space:]]*//; s/[[:space:]]*$//' || true)"
  if [[ "$basis" != "accepted" ]]; then
    exit 0
  fi

  # The file being edited. Backslashes (Windows paths, JSON-escaped) become
  # forward slashes so the same test works on every platform. A path inside the
  # instance is always allowed. With no path in the payload the hook allows the
  # edit, for the same reason it allows one when session_id is missing.
  file_path="$(json_str_field file_path || true)"
  [[ -z "$file_path" ]] && file_path="$(json_str_field notebook_path || true)"
  if [[ -z "$file_path" ]]; then
    printf 'require-binding: no file path in hook input; allowing (fail-open).\n' >&2
    exit 0
  fi
  norm="${file_path//\\//}"
  while [[ "$norm" == *//* ]]; do norm="${norm//\/\//\/}"; done
  case "$norm" in
    */.konspekt/instance/*|.konspekt/instance/*) exit 0 ;;
  esac

  entity="$(head -n1 "$marker" | tr -d '[:space:]')"
  entity_file=""
  if [[ -n "$entity" && "$entity" =~ ^[A-Za-z0-9._-]+$ ]]; then
    entity_file="$(grep -rlE "^id:[[:space:]]*$entity[[:space:]]*$" \
      "$instance/nodes" "$instance/concepts" "$instance/noteworthy" \
      "$instance/artifacts" "$instance/waypoints" 2>/dev/null | head -n1 || true)"
  fi
  review=""
  if [[ -n "$entity_file" ]]; then
    review="$(grep -m1 -E '^review:[[:space:]]*[A-Za-z]+[[:space:]]*$' "$entity_file" \
      | sed -E 's/^review:[[:space:]]*//; s/[[:space:]]*$//' || true)"
  fi
  if [[ "$review" == "accepted" ]]; then
    exit 0
  fi

  reason="Acceptance before work (spec/architecture/REVIEW.md, basis: accepted): this "
  reason+="session is bound to '$entity', which is "
  if [[ -z "$entity_file" ]]; then
    reason+="not an entity in .konspekt/instance/"
  else
    reason+="review: ${review:-unset}"
  fi
  reason+=". Files outside .konspekt/instance/ may not be edited until an acceptor "
  reason+="accepts that entity. Show the human the entity's text and ask for its "
  reason+="acceptance; an instruction to start work is not an acceptance. Do NOT "
  reason+="write review: accepted yourself to unblock this edit."
  deny "$reason"
fi

# No marker: deny and tell the model exactly how to proceed once truly bound.
# The reason names the session_id so the maintainer can write the marker; the
# marker must carry the bound entity id, so recording it is a real act of
# binding, not a rubber stamp.
reason="Conversation-binding gate (OPERATING.md § Conversation binding): no binding "
reason+="recorded for this session, so file mutations are blocked. Establish the "
reason+="active entity WITH THE HUMAN first (ask which entity this conversation "
reason+="attaches to; binding: required — 'none' is not legal). Once the human has "
reason+="confirmed the entity, record it and retry:  "
reason+="mkdir -p \\\"\$CLAUDE_PROJECT_DIR/.claude/.binding\\\" && printf '%s\\\\n' "
reason+="'<entity-id>' > \\\"\$CLAUDE_PROJECT_DIR/.claude/.binding/$session_id\\\"  "
reason+="Do NOT write the marker to unblock yourself before the human has bound "
reason+="the conversation — that defeats the gate."

deny "$reason"
