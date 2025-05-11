<script lang="ts">
  import { onMount } from 'svelte'
  import type { FrameBody } from '../store/store.svelte'
  import { boxCenter, calculateClosestPoint } from '../store/box'

  let el = $state<HTMLCanvasElement>(null!)
  let ctx = $derived(el ? el.getContext('2d')! : null!)

  const {
    focusablePoints,
    onCenterChanges,
    onFocusChanges,
    onZoomToFit,
    initialCenter,
    visualization,
    focusedAt,
  }: {
    focusablePoints: [string, FrameBody, [number, number], number][]
    onCenterChanges: (c: [number, number]) => void
    onFocusChanges: (newFocus: [string, FrameBody] | null) => void
    onZoomToFit: (target: [string, FrameBody]) => void
    initialCenter: [number, number]
    visualization: boolean
    focusedAt: [string, FrameBody] | null
  } = $props()

  let center = $state<[number, number]>(initialCenter)
  let targetCenter = $state<[number, number]>([0, 0])
  let flowMode = $state<boolean>(true)
  let points: [number, number, string, FrameBody][] = $derived(
    focusablePoints.map((p) => [...p[2], p[0], p[1]]),
  )
  let directionVector = $state<[number, number]>([0, 0])
  let directionActivated = $derived(
    directionVector[0] !== 0 || directionVector[1] !== 0,
  )
  let focusedAtPoint = $derived(
    points.find((p) => p[2] === focusedAt?.[0] && p[3] === focusedAt?.[1]) ||
      null,
  )
  const maxDirectionPower = 2.5
  let directionPower = $state<number>(maxDirectionPower)

  // svelte-ignore state_referenced_locally
  let latchedPoint = $state(points[0])

  $effect(() => {
    onCenterChanges(center)
  })

  $effect(() => {
    if (!focusedAt) {
    } else if (
      focusedAt[0] !== latchedPoint[2] ||
      focusedAt[1] !== latchedPoint[3]
    ) {
      latchedPoint = points.find(
        (p) => p[2] === focusedAt[0] && p[3] === focusedAt[1],
      )!
    }
  })

  function recalculateLatchedPoint(): boolean {
    const closestPoint = calculateClosestPoint(points, targetCenter)

    if (
      closestPoint[0] === latchedPoint[0] &&
      closestPoint[1] === latchedPoint[1]
    ) {
      return false
    } else {
      latchedPoint = closestPoint as [number, number, string, FrameBody]
      return true
    }
  }

  let animationFrame = 0
  let tickInterval: Timer = null!
  onMount(() => {
    if (el) {
      el.width = window.innerWidth
      el.height = window.innerHeight

      animationFrame = requestAnimationFrame(render)
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      clearInterval(tickInterval)
    }
  })

  $effect(() => {
    if (flowMode) {
      // center = initialCenter
      tickInterval = setInterval(tick, 16)
    } else {
      clearInterval(tickInterval)
    }
  })

  $effect(() => {
    if (directionActivated) {
      flowMode = true
      latchedPointOnKeydown = latchedPoint
    } else {
      if (latchedPointOnKeydown === latchedPoint) {
      }
    }
  })

  let latchedPointOnKeydown = $state<
    [number, number, string, FrameBody] | null
  >(null)
  function handleKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Escape') {
      onFocusChanges(null)
      flowMode = false
    } else if (ev.key === 'ArrowUp') {
      directionVector[1] = -1
    } else if (ev.key === 'ArrowDown') {
      directionVector[1] = 1
    } else if (ev.key === 'ArrowLeft') {
      directionVector[0] = -1
    } else if (ev.key === 'ArrowRight') {
      directionVector[0] = 1
    } else if (ev.key === 'Enter') {
      flowMode = true

      if (focusedAtPoint) {
        if (
          Math.abs(center[0] - targetCenter[0]) < 0.1 &&
          Math.abs(center[1] - targetCenter[1]) < 0.1 &&
          Math.abs(latchedPoint[0] - targetCenter[0]) < 0.1 &&
          Math.abs(latchedPoint[1] - targetCenter[1]) < 0.1
        ) {
          console.log('Already latched!')
          onZoomToFit([latchedPoint[2], latchedPoint[3]])
        } else {
          center = initialCenter
          targetCenter = [focusedAtPoint[0], focusedAtPoint[1]]
          latchedPoint = focusedAtPoint
        }
      } else {
        center = initialCenter
        targetCenter = initialCenter
        recalculateLatchedPoint()
        onFocusChanges([latchedPoint[2], latchedPoint[3]])
      }
    }

    latchedPointOnKeydown = latchedPoint
  }

  function handleKeyUp(ev: KeyboardEvent) {
    if (ev.key === 'ArrowUp') {
      directionVector[1] = 0
    } else if (ev.key === 'ArrowDown') {
      directionVector[1] = 0
    } else if (ev.key === 'ArrowLeft') {
      directionVector[0] = 0
    } else if (ev.key === 'ArrowRight') {
      directionVector[0] = 0
    }
  }

  function tick() {
    if (
      !directionActivated &&
      Math.abs(center[0] - targetCenter[0]) < 0.1 &&
      Math.abs(center[1] - targetCenter[1]) < 0.1 &&
      Math.abs(latchedPoint[0] - targetCenter[0]) < 0.1 &&
      Math.abs(latchedPoint[1] - targetCenter[1]) < 0.1
    ) {
      flowMode = false
      return
    }

    // --- helpers -------------------------------------------------------------
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // --- 0.  keep the latched point in sync with where we're looking ---------
    if (recalculateLatchedPoint()) {
      // Latched point changed
      directionPower = 0.2
      onFocusChanges([latchedPoint[2], latchedPoint[3]])
    }

    // --- 1. gently pull the *target* toward the latched focus point ----------
    const targetEase = 0.12 // how fast the yellow dot chases the red one
    targetCenter = [
      lerp(targetCenter[0], latchedPoint[0], targetEase),
      lerp(targetCenter[1], latchedPoint[1], targetEase),
    ]

    // --- 2. if flow mode, pull the *center* toward the target ----------------
    if (flowMode) {
      const centerEase = 0.2 // how fast the green dot chases the yellow
      center = [
        lerp(center[0], targetCenter[0], centerEase),
        lerp(center[1], targetCenter[1], centerEase),
      ]
    }

    if (directionPower < maxDirectionPower) directionPower += 0.07

    if (!(directionVector[0] === 0 && directionVector[1] === 0)) {
      targetCenter[0] += directionVector[0] * directionPower
      targetCenter[1] += directionVector[1] * directionPower
    }
  }

  function render() {
    ctx.clearRect(0, 0, el.width, el.height)
    ctx.save()
    ctx.translate(el.width / 2, el.height / 2)
    const unit = 4
    for (const [x, y] of points) {
      ctx.fillStyle = 'white'
      ctx.beginPath()
      // const size = mass * 0.3 * pos.z;
      // const size = 20
      ctx.arc(x * unit, y * unit, 20, 0, 2 * Math.PI)
      ctx.fill()
    }

    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(latchedPoint[0] * unit, latchedPoint[1] * unit, 10, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = 'green'
    ctx.beginPath()
    ctx.arc(center[0] * unit, center[1] * unit, 10, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = 'yellow'
    ctx.beginPath()
    ctx.arc(targetCenter[0] * unit, targetCenter[1] * unit, 10, 0, 2 * Math.PI)
    ctx.fill()

    // Render direction vector
    ctx.strokeStyle = 'cyan'
    ctx.beginPath()
    ctx.moveTo(targetCenter[0] * unit, targetCenter[1] * unit)
    ctx.lineTo(
      targetCenter[0] * unit + directionVector[0] * unit * 30,
      targetCenter[1] * unit + directionVector[1] * unit * 30,
    )
    // Make a line in the direction of the vector and have it be
    // the same length independently of the vector length
    ctx.stroke()

    ctx.restore()

    animationFrame = requestAnimationFrame(render)
  }
</script>

<svelte:window
  onkeydown={(ev) => handleKeyDown(ev)}
  onkeyup={(ev) => handleKeyUp(ev)}
/>

{#if visualization}
  <canvas class="size-full absolute top-0 left-0 bg-black z-3000" bind:this={el}
  ></canvas>
{/if}
