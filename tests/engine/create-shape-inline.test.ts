import { describe, expect, test } from 'bun:test'

import { ALL_TOOLS, FigmaAPI, SceneGraph } from '@open-pencil/core'

function setup() {
  const graph = new SceneGraph()
  const figma = new FigmaAPI(graph)
  return { graph, figma }
}

const createShape = ALL_TOOLS.find((t) => t.name === 'create_shape')!

describe('create_shape inline styles', () => {
  test('with fill applies solid fill', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'RECTANGLE',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#ff0000'
    }) as any
    const node = figma.getNodeById(result.id)!
    expect(node.fills).toHaveLength(1)
    expect(node.fills[0].color.r).toBeCloseTo(1, 1)
    expect(node.fills[0].color.g).toBeCloseTo(0, 1)
    expect(node.fills[0].color.b).toBeCloseTo(0, 1)
  })

  test('with stroke applies stroke', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'FRAME',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      stroke: '#00ff00',
      stroke_weight: 2
    }) as any
    const node = figma.getNodeById(result.id)!
    expect(node.strokes).toHaveLength(1)
    expect(node.strokes[0].color.g).toBeCloseTo(1, 1)
    expect(node.strokes[0].weight).toBe(2)
  })

  test('with radius applies corner radius', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'FRAME',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      radius: 12
    }) as any
    const node = figma.getNodeById(result.id)!
    expect(node.cornerRadius).toBe(12)
  })

  test('with text sets characters on TEXT node', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'TEXT',
      x: 0,
      y: 0,
      width: 200,
      height: 30,
      text: 'Hello'
    }) as any
    const node = figma.getNodeById(result.id)!
    expect(node.characters).toBe('Hello')
  })

  test('with font properties sets font', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'TEXT',
      x: 0,
      y: 0,
      width: 200,
      height: 30,
      font_family: 'Inter',
      font_size: 24,
      font_style: 'Bold'
    }) as any
    const node = figma.getNodeById(result.id)!
    expect(node.fontName.family).toBe('Inter')
    expect(node.fontName.style).toBe('Bold')
    expect(node.fontSize).toBe(24)
  })

  test('ignores text on non-TEXT node', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'FRAME',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: 'Hello'
    }) as any
    expect(result.type).toBe('FRAME')
    // Should not throw — text is silently ignored on non-TEXT nodes
  })

  test('with all inline styles at once', () => {
    const { figma } = setup()
    const result = createShape.execute(figma, {
      type: 'FRAME',
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      fill: '#ff0000',
      stroke: '#00ff00',
      stroke_weight: 2,
      radius: 8
    }) as any
    const node = figma.getNodeById(result.id)!
    expect(node.fills).toHaveLength(1)
    expect(node.fills[0].color.r).toBeCloseTo(1, 1)
    expect(node.strokes).toHaveLength(1)
    expect(node.strokes[0].color.g).toBeCloseTo(1, 1)
    expect(node.strokes[0].weight).toBe(2)
    expect(node.cornerRadius).toBe(8)
  })
})
