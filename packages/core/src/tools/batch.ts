import { ALL_TOOLS } from './registry'

import type { ToolDef } from './schema'
import type { FigmaAPI } from '../figma-api'

export interface BatchOperation {
  tool: string
  args: Record<string, unknown>
}

export interface BatchResult {
  results: unknown[]
  error?: { index: number; tool: string; message: string }
}

export interface BatchOptions {
  toolMap?: Map<string, ToolDef>
  disabledTools?: Set<string>
  maxOperations?: number
}

const REF_PATTERN = /\$(\d+)/g

/**
 * Resolve `$N` references in args to IDs from prior results.
 * - Exact match `"$0"` → `results[0].id`
 * - Embedded `"prefix-$0-suffix"` → `"prefix-abc123-suffix"`
 * Does not mutate the original args.
 */
export function resolveRefs(
  args: Record<string, unknown>,
  results: unknown[]
): Record<string, unknown> {
  function resolveValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Check if the string contains any $N references
      if (!REF_PATTERN.test(value)) return value
      REF_PATTERN.lastIndex = 0

      // Exact match: "$N" → results[N].id directly
      const exactMatch = value.match(/^\$(\d+)$/)
      if (exactMatch) {
        const index = parseInt(exactMatch[1], 10)
        if (index >= results.length) {
          throw new Error(`Forward reference $${index}: only ${results.length} results available`)
        }
        const result = results[index] as Record<string, unknown> | null
        if (!result || typeof result !== 'object' || !('id' in result)) {
          throw new Error(`$${index} has no 'id' field`)
        }
        return result.id
      }

      // Embedded: replace all $N occurrences in the string
      return value.replace(REF_PATTERN, (match, numStr) => {
        const index = parseInt(numStr, 10)
        if (index >= results.length) {
          throw new Error(`Forward reference $${index}: only ${results.length} results available`)
        }
        const result = results[index] as Record<string, unknown> | null
        if (!result || typeof result !== 'object' || !('id' in result)) {
          throw new Error(`$${index} has no 'id' field`)
        }
        return String(result.id)
      })
    }

    if (Array.isArray(value)) {
      return value.map(resolveValue)
    }

    if (value !== null && typeof value === 'object') {
      const resolved: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        resolved[k] = resolveValue(v)
      }
      return resolved
    }

    return value
  }

  const resolved: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(args)) {
    resolved[key] = resolveValue(val)
  }
  return resolved
}

export async function executeBatch(
  figma: FigmaAPI,
  operations: BatchOperation[],
  options?: BatchOptions
): Promise<BatchResult> {
  const maxOps = options?.maxOperations ?? 100
  if (operations.length > maxOps) {
    return {
      results: [],
      error: { index: -1, tool: '', message: `Batch exceeds maximum of ${maxOps} operations (got ${operations.length})` }
    }
  }

  if (operations.length === 0) {
    return { results: [] }
  }

  const toolMap = options?.toolMap ?? new Map(ALL_TOOLS.map((t) => [t.name, t]))
  const disabledTools = options?.disabledTools ?? new Set<string>()
  const results: unknown[] = []

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]

    // Block recursive batch calls
    if (op.tool === 'batch') {
      return {
        results,
        error: { index: i, tool: 'batch', message: 'Recursive batch calls are not allowed' }
      }
    }

    // Check disabled tools
    if (disabledTools.has(op.tool)) {
      return {
        results,
        error: { index: i, tool: op.tool, message: `Tool '${op.tool}' is disabled` }
      }
    }

    const tool = toolMap.get(op.tool)
    if (!tool) {
      return {
        results,
        error: { index: i, tool: op.tool, message: `Unknown tool '${op.tool}'` }
      }
    }

    try {
      const resolvedArgs = resolveRefs(op.args, results)
      const result = await tool.execute(figma, resolvedArgs)

      // Check for tool-level error returns (e.g. { error: "Node not found" })
      if (result && typeof result === 'object' && 'error' in result) {
        return {
          results,
          error: { index: i, tool: op.tool, message: String((result as Record<string, unknown>).error) }
        }
      }

      results.push(result)
    } catch (e) {
      return {
        results,
        error: { index: i, tool: op.tool, message: e instanceof Error ? e.message : String(e) }
      }
    }
  }

  return { results }
}
