import { describe, expect, test } from 'bun:test'

import { FigmaAPI, SceneGraph } from '@open-pencil/core'
import { executeBatch, resolveRefs } from '@open-pencil/core/tools'

function setup() {
  const graph = new SceneGraph()
  const figma = new FigmaAPI(graph)
  return { graph, figma }
}

describe('executeBatch', () => {
  test('basic batch execution — 2 create_shape ops', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'FRAME', x: 0, y: 0, width: 100, height: 100, name: 'A' } },
      { tool: 'create_shape', args: { type: 'RECTANGLE', x: 10, y: 10, width: 50, height: 50, name: 'B' } }
    ])
    expect(result.error).toBeUndefined()
    expect(result.results).toHaveLength(2)
    expect((result.results[0] as any).id).toBeTruthy()
    expect((result.results[1] as any).id).toBeTruthy()
  })

  test('$N reference resolution — create then set_fill', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'RECTANGLE', x: 0, y: 0, width: 100, height: 100 } },
      { tool: 'set_fill', args: { id: '$0', color: '#ff0000' } }
    ])
    expect(result.error).toBeUndefined()
    expect(result.results).toHaveLength(2)
    const nodeId = (result.results[0] as any).id
    const node = figma.getNodeById(nodeId)!
    expect(node.fills[0].color.r).toBeCloseTo(1, 1)
  })

  test('nested $N in parent_id', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'FRAME', x: 0, y: 0, width: 200, height: 200, name: 'Parent' } },
      { tool: 'create_shape', args: { type: 'RECTANGLE', x: 10, y: 10, width: 50, height: 50, parent_id: '$0' } }
    ])
    expect(result.error).toBeUndefined()
    const parentId = (result.results[0] as any).id
    const childId = (result.results[1] as any).id
    const parent = figma.getNodeById(parentId)!
    expect(parent.children.some((c) => c.id === childId)).toBe(true)
  })

  test('multiple references — set_fill on 3 nodes', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'RECTANGLE', x: 0, y: 0, width: 50, height: 50 } },
      { tool: 'create_shape', args: { type: 'RECTANGLE', x: 60, y: 0, width: 50, height: 50 } },
      { tool: 'create_shape', args: { type: 'RECTANGLE', x: 120, y: 0, width: 50, height: 50 } },
      { tool: 'set_fill', args: { id: '$0', color: '#ff0000' } },
      { tool: 'set_fill', args: { id: '$1', color: '#00ff00' } },
      { tool: 'set_fill', args: { id: '$2', color: '#0000ff' } }
    ])
    expect(result.error).toBeUndefined()
    expect(result.results).toHaveLength(6)
  })

  test('stop on error — non-existent node', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'FRAME', x: 0, y: 0, width: 100, height: 100 } },
      { tool: 'set_fill', args: { id: 'nonexistent', color: '#ff0000' } }
    ])
    expect(result.results).toHaveLength(1)
    expect(result.error).toBeDefined()
    expect(result.error!.index).toBe(1)
    expect(result.error!.tool).toBe('set_fill')
  })

  test('forward reference error', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'FRAME', x: 0, y: 0, width: 100, height: 100 } },
      { tool: 'set_fill', args: { id: '$5', color: '#ff0000' } }
    ])
    expect(result.error).toBeDefined()
    expect(result.error!.index).toBe(1)
    expect(result.error!.message).toContain('Forward reference')
  })

  test('unknown tool error', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'nonexistent_tool', args: {} }
    ])
    expect(result.error).toBeDefined()
    expect(result.error!.index).toBe(0)
    expect(result.error!.message).toContain("Unknown tool 'nonexistent_tool'")
  })

  test('empty batch', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [])
    expect(result.results).toHaveLength(0)
    expect(result.error).toBeUndefined()
  })

  test('disabled tool rejected', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'eval', args: { code: 'console.log("hi")' } }
    ], { disabledTools: new Set(['eval']) })
    expect(result.error).toBeDefined()
    expect(result.error!.index).toBe(0)
    expect(result.error!.message).toContain('disabled')
  })

  test('recursive batch blocked', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'batch', args: { operations: [] } }
    ])
    expect(result.error).toBeDefined()
    expect(result.error!.index).toBe(0)
    expect(result.error!.message).toContain('Recursive')
  })

  test('maxOperations enforced', async () => {
    const { figma } = setup()
    const ops = Array.from({ length: 101 }, (_, i) => ({
      tool: 'create_shape',
      args: { type: 'RECTANGLE', x: i, y: 0, width: 10, height: 10 }
    }))
    const result = await executeBatch(figma, ops, { maxOperations: 100 })
    expect(result.error).toBeDefined()
    expect(result.error!.index).toBe(-1)
    expect(result.error!.message).toContain('maximum')
    expect(result.results).toHaveLength(0)
  })
})

describe('resolveRefs', () => {
  test('resolves $N exact match, embedded, nested objects, and arrays', () => {
    const results = [
      { id: 'node-abc', name: 'A' },
      { id: 'node-def', name: 'B' }
    ]

    // Exact match
    expect(resolveRefs({ id: '$0' }, results)).toEqual({ id: 'node-abc' })

    // Embedded
    expect(resolveRefs({ label: 'ref-$0-end' }, results)).toEqual({ label: 'ref-node-abc-end' })

    // Nested object
    expect(resolveRefs({ nested: { id: '$1' } }, results)).toEqual({ nested: { id: 'node-def' } })

    // Array values
    expect(resolveRefs({ ids: ['$0', '$1'] }, results)).toEqual({ ids: ['node-abc', 'node-def'] })

    // Non-string passthrough
    expect(resolveRefs({ num: 42, bool: true }, results)).toEqual({ num: 42, bool: true })
  })
})
