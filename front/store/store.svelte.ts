import { setContext, getContext, onMount } from 'svelte'
import { uplink } from '../../back/uplink/client.ts'
import {
  boxCenter,
  boxIsBigEnough,
  boxSurface,
  containingBox,
  findBoxInTheDirectionOf,
  pos2box,
  resizeBox,
  type Box,
} from './box.ts'
import { type Meta } from './lands-types.ts'
import spaceStore from './space.svelte.ts'
import { type FrameBody } from './lands-types.ts'
import landsStore from './lands.svelte.ts'
import type { BoxResizeHandles } from './box.ts'
import noteTemplate from '../templates/note.svelte?raw'
import SSNV from './land-navigation-store.svelte.ts'

type StoreConfig = { at: string }

function createStore(config: StoreConfig) {
  let SNV = SSNV.store
  let lands = landsStore.landsStore
  let space = spaceStore({ centerAt: null })
  let localLand = $derived(lands.at(config.at))
  let localFrames = $derived(localLand.all)
  let creatingFrame = $state<{
    box: Box
    timestamp: number
  } | null>(null)
  let focusedFrame = $state<[string, FrameBody] | null>(null)
  let navigationMode = $state<'hand' | 'focus'>('hand')

  const justVisibleBoxes = $derived(
    Object.values(localFrames)
      .map((f) => {
        let visible = []
        if (f.meta.bodies.code.visible) visible.push(f.meta.bodies.code.box)
        if (f.meta.bodies.main.visible) visible.push(f.meta.bodies.main.box)
        if (f.meta.bodies.inner.visible) visible.push(f.meta.bodies.inner.box)
        return visible
      })
      .reduce((a, b) => a.concat(b), []),
  )
  const calculatedContainingBox = $derived(containingBox(justVisibleBoxes))

  $effect(() => {
    if (calculatedContainingBox) {
      space.cmd.setMinZoomToFitBox(calculatedContainingBox)
    }
  })

  onMount(() => {
    if (calculatedContainingBox) {
      space.cmd.fitBox(calculatedContainingBox)
    }
  })

  let focusablePoints = $derived.by(() => {
    let frameBoxes: [string, FrameBody, pos: [number, number], mass: number][] =
      []
    Object.entries(localFrames).forEach(([name, frame]) => {
      frameBoxes.push([
        name,
        'main',
        boxCenter(frame.meta.bodies.main.box),
        boxSurface(frame.meta.bodies.main.box),
      ])
      if (frame.meta.bodies.code.visible) {
        frameBoxes.push([
          name,
          'code',
          boxCenter(frame.meta.bodies.code.box),
          boxSurface(frame.meta.bodies.code.box),
        ])
      }
    })
    return frameBoxes
  })

  //  ██████╗███╗   ███╗██████╗
  // ██╔════╝████╗ ████║██╔══██╗
  // ██║     ██╔████╔██║██║  ██║
  // ██║     ██║╚██╔╝██║██║  ██║
  // ╚██████╗██║ ╚═╝ ██║██████╔╝
  //  ╚═════╝╚═╝     ╚═╝╚═════╝

  async function runCmd(
    ...cmd:
      | ['ping']
      | ['mount-file', string]
      | ['update-mounted-file', string]
      | ['save-mounted-file']
      | ['rename-frame', name: string, newName: string]
      | ['cancel-creating-frame']
      | ['commit-creating-frame', name: string]
      | ['save-code', name: string, code: string]
      | ['set-data', name: string, data: any]
      | ['exit-focus-mode']
      | ['focus-frame', [string, FrameBody] | null]
      | ['shift-focus-to-direction', vector: [number, number]]
      | ['zoom-to-fit', [string, FrameBody]]
  ) {
    console.log('⚪️ CMD', cmd)

    switch (cmd[0]) {
      case 'ping': {
        await uplink('ping', 'Test')
        break
      }
      case 'rename-frame': {
        if (cmd[1] !== cmd[2]) {
          localLand.rename(cmd[1], cmd[2])
        }
        break
      }
      case 'cancel-creating-frame': {
        creatingFrame = null
        break
      }
      case 'commit-creating-frame': {
        if (!creatingFrame) return
        const meta: Meta = {
          bodies: {
            main: {
              box: creatingFrame.box,
              visible: true,
            },
            code: {
              box: {
                x: creatingFrame.box.x + creatingFrame.box.w,
                y: creatingFrame.box.y,
                w: creatingFrame.box.w,
                h: creatingFrame.box.h,
              },
              visible: true,
            },
            inner: {
              box: creatingFrame.box,
              visible: false,
            },
          },
          updatedAt: Date.now(),
          data: {},
        }
        await localLand.create(cmd[1], meta, noteTemplate)
        creatingFrame = null
        break
      }

      case 'save-code': {
        localLand.updateCode(cmd[1], cmd[2])
        break
      }
      case 'set-data': {
        localLand.updateMeta(cmd[1], { data: cmd[2] })
        break
      }
      case 'exit-focus-mode': {
        navigationMode = 'hand'
        break
      }
      case 'focus-frame': {
        focusedFrame = cmd[1]
        break
      }
      case 'zoom-to-fit': {
        const [name, body] = cmd[1]
        const comp = localFrames[name]
        const box = comp.meta.bodies[body].box
        space.cmd.fitBox(box)
        // space.zoomToBox(framesComponents.all[name][body].meta.box)
        break
      }
      // case 'shift-focus-to-direction': {
      //   console.log('🔵 SHIFT FOCUS TO DIRECTION', cmd[1])
      //   if (navigationMode === 'hand') {
      //     navigationMode = 'focus'
      //   }

      //   const [fName, fBody] = focusStack[focusStack.length - 1] || [null, null]
      //   const boxes: [string, FrameBody, Box][] = []
      //   Object.entries(framesComponents.all).forEach(([name, frame]) => {
      //     if (!(fName === name && fBody === 'main')) {
      //       boxes.push([name, 'main', frame.meta.box])
      //     }
      //     if (frame.meta.showCodeBox && !(fName === name && fBody === 'code')) {
      //       boxes.push([name, 'code', frame.meta.codeBox])
      //     }
      //   })

      //   const index = findBoxInTheDirectionOf(
      //     space.screenCenter,
      //     cmd[1],
      //     boxes.map(([, , box]) => box),
      //   )
      //   const [frameName, body] = index === -1 ? [null, null] : boxes[index]

      //   if (frameName && body) {
      //     console.log('FOCUS', frameName, body)
      //     focusStack.push([frameName, body])
      //   }
      //   break
      // }
    }
  }

  // ██████╗ ██████╗  █████╗  ██████╗
  // ██╔══██╗██╔══██╗██╔══██╗██╔════╝
  // ██║  ██║██████╔╝███████║██║  ███╗
  // ██║  ██║██╔══██╗██╔══██║██║   ██║
  // ██████╔╝██║  ██║██║  ██║╚██████╔╝
  // ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝

  type DragState =
    | { type: 'none' }
    | {
        type: 'panning'
        panned: boolean
        lastPos: [number, number]
      }
    | {
        type: 'moveFrame'
        name: string
        body: FrameBody
        start: [number, number]
        resultingBox: Box
        moved: boolean
      }
    | {
        type: 'resizeFrame'
        name: string
        body: FrameBody
        gridPosStart: [number, number]
        handler: BoxResizeHandles
        resultingBox: Box
      }
    | {
        type: 'createFrame'
        start: [number, number]
        end: [number, number]
        resultingBox: Box
      }

  let dragState = $state<DragState>({ type: 'none' })

  // ███╗   ███╗    ██████╗  ██████╗ ██╗    ██╗███╗   ██╗
  // ████╗ ████║    ██╔══██╗██╔═══██╗██║    ██║████╗  ██║
  // ██╔████╔██║    ██║  ██║██║   ██║██║ █╗ ██║██╔██╗ ██║
  // ██║╚██╔╝██║    ██║  ██║██║   ██║██║███╗██║██║╚██╗██║
  // ██║ ╚═╝ ██║    ██████╔╝╚██████╔╝╚███╔███╔╝██║ ╚████║
  // ╚═╝     ╚═╝    ╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝

  let wrapEv = (ev: MouseEvent | TouchEvent) => {
    const isTouch = ev.type.startsWith('touch')
    return {
      clientX: isTouch
        ? (ev as TouchEvent).touches[0].clientX
        : (ev as MouseEvent).clientX,
      clientY: isTouch
        ? (ev as TouchEvent).touches[0].clientY
        : (ev as MouseEvent).clientY,
      button: isTouch ? -1 : (ev as MouseEvent).button,
      preventDefault: () => ev.preventDefault(),
      stopPropagation: () => ev.stopPropagation(),
    }
  }

  async function mousedown(
    ev2: MouseEvent | TouchEvent,
    ...cmd:
      | [target: 'frameDragHandle', name: string, body: FrameBody]
      | [
          target: 'resizeHandler',
          frameName: string,
          body: FrameBody,
          handler: BoxResizeHandles,
        ]
      | [target: 'space']
  ) {
    const ev = wrapEv(ev2)
    console.log('🟢 M DOWN', ev.button, cmd)

    if (creatingFrame && cmd[0] === 'space' && ev.button === 0) {
      creatingFrame = null
      return
    }

    switch (cmd[0]) {
      case 'space': {
        if (ev.button === 1 || ev.button === -1) {
          dragState = {
            type: 'panning',
            panned: false,
            lastPos: [ev.clientX, ev.clientY],
          }
        } else if (ev.button === 0) {
          const pos = space.mouseToGridPos(ev.clientX, ev.clientY)
          dragState = {
            type: 'createFrame',
            start: pos,
            end: pos,
            resultingBox: { x: pos[0], y: pos[1], w: 1, h: 1 },
          }
          focusedFrame = null
        } else if (ev.button === 2) {
          SNV.up(1)
        }
        break
      }
      case 'frameDragHandle': {
        if (ev.button === 0) {
          ev.stopPropagation()
          const comp = localFrames[cmd[1]]
          dragState = {
            type: 'moveFrame',
            name: cmd[1],
            body: cmd[2],
            start: space.mouseToGridPos(ev.clientX, ev.clientY),
            resultingBox: {
              ...comp.meta.bodies[cmd[2]].box,
            },
            moved: false,
          }
        }
        break
      }
      case 'resizeHandler': {
        ev.stopPropagation()
        const comp = localFrames[cmd[1]]
        dragState = {
          type: 'resizeFrame',
          name: cmd[1],
          body: cmd[2],
          handler: cmd[3],
          gridPosStart: space.mouseToGridPos(ev.clientX, ev.clientY),
          resultingBox: {
            ...comp.meta.bodies[cmd[2]].box,
          },
        }
      }
    }
  }

  // ███╗   ███╗    ███╗   ███╗ ██████╗ ██╗   ██╗███████╗
  // ████╗ ████║    ████╗ ████║██╔═══██╗██║   ██║██╔════╝
  // ██╔████╔██║    ██╔████╔██║██║   ██║██║   ██║█████╗
  // ██║╚██╔╝██║    ██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██╔══╝
  // ██║ ╚═╝ ██║    ██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ███████╗
  // ╚═╝     ╚═╝    ╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝

  let dragLog = $state<any[][]>([])
  async function mousemove(
    ev2: MouseEvent | TouchEvent,
    ...cmd: [target: 'space']
  ) {
    const ev = wrapEv(ev2)
    if (dragState.type !== 'none') {
      // console.log('🟤 M DRAG MOVE', cmd)
    } else {
      // console.log('🟡 M MOVE', cmd)
    }

    switch (cmd[0]) {
      case 'space': {
        space.cmd.setMouseXY(ev.clientX, ev.clientY)
        if (dragState.type === 'none') return
        ev.stopPropagation()
        switch (dragState.type) {
          case 'panning': {
            if (!dragState.panned) {
              dragState.panned = true
            }
            const dx = ev.clientX - dragState.lastPos[0]
            const dy = ev.clientY - dragState.lastPos[1]
            dragState.lastPos = [ev.clientX, ev.clientY]
            space.cmd.pan(dx, dy)
            break
          }
          case 'createFrame': {
            const [x, y] = space.mouseToGridPos(ev.clientX, ev.clientY)
            dragState.end = [x, y]
            dragState.resultingBox = pos2box(dragState.start, dragState.end)
            break
          }
          case 'moveFrame': {
            const [x, y] = space.mouseToGridPos(ev.clientX, ev.clientY)
            const dx = dragState.start[0] - x
            const dy = dragState.start[1] - y

            const comp = localFrames[dragState.name]
            const box = comp.meta.bodies[dragState.body].box
            dragState.resultingBox.x = box.x - dx
            dragState.resultingBox.y = box.y - dy
            dragState.moved = true
            break
          }
          case 'resizeFrame': {
            const currentPos = space.mouseToGridPos(ev.clientX, ev.clientY)
            const dx = currentPos[0] - dragState.gridPosStart[0]
            const dy = currentPos[1] - dragState.gridPosStart[1]

            const comp = localFrames[dragState.name]
            const box = comp.meta.bodies[dragState.body].box
            dragState.resultingBox = resizeBox(dragState.handler, box, dx, dy)
          }
        }
      }
    }
  }

  // ███╗   ███╗    ██╗   ██╗██████╗
  // ████╗ ████║    ██║   ██║██╔══██╗
  // ██╔████╔██║    ██║   ██║██████╔╝
  // ██║╚██╔╝██║    ██║   ██║██╔═══╝
  // ██║ ╚═╝ ██║    ╚██████╔╝██║
  // ╚═╝     ╚═╝     ╚═════╝ ╚═╝

  async function mouseup(
    ev2: MouseEvent | TouchEvent,
    ...cmd: [target: 'space']
  ) {
    const ev = wrapEv(ev2)
    console.log('🔴 M UP', (ev as MouseEvent).button || -1, cmd)

    switch (cmd[0]) {
      case 'space': {
        if (dragState.type === 'none') return
        ev.stopPropagation()
        switch (dragState.type) {
          case 'createFrame': {
            if (boxIsBigEnough(dragState.resultingBox)) {
              if (creatingFrame) {
                creatingFrame.box = dragState.resultingBox
                creatingFrame.timestamp = Date.now()
              } else {
                creatingFrame = {
                  box: dragState.resultingBox,
                  timestamp: Date.now(),
                }
              }
            }

            break
          }
          case 'moveFrame': {
            if (!dragState.moved) {
              focusedFrame = [dragState.name, dragState.body]
            } else {
              if (
                space.vp.screenW - ev.clientX <= 100 &&
                space.vp.screenH - ev.clientY <= 100 &&
                dragState.body === 'main'
              ) {
                localLand.remove(dragState.name)
              } else {
                localLand.updateBodyBox(
                  dragState.name,
                  dragState.body,
                  dragState.resultingBox,
                )
              }
            }
            break
          }
          case 'resizeFrame': {
            localLand.updateBodyBox(
              dragState.name,
              dragState.body,
              dragState.resultingBox,
            )
            break
          }
        }

        dragState = { type: 'none' }
        break
      }
    }
  }

  // ██╗    ██╗██╗  ██╗███████╗███████╗██╗
  // ██║    ██║██║  ██║██╔════╝██╔════╝██║
  // ██║ █╗ ██║███████║█████╗  █████╗  ██║
  // ██║███╗██║██╔══██║██╔══╝  ██╔══╝  ██║
  // ╚███╔███╔╝██║  ██║███████╗███████╗███████╗
  //  ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝

  async function wheel(ev: WheelEvent, ...cmd: [target: 'space']) {
    switch (cmd[0]) {
      case 'space': {
        ev.preventDefault()
        ev.stopPropagation()
        space.cmd.setZoomFromWheel(ev.deltaY)
      }
    }
  }

  //  ██████╗██╗     ██╗ ██████╗██╗  ██╗
  // ██╔════╝██║     ██║██╔════╝██║ ██╔╝
  // ██║     ██║     ██║██║     █████╔╝
  // ██║     ██║     ██║██║     ██╔═██╗
  // ╚██████╗███████╗██║╚██████╗██║  ██╗
  //  ╚═════╝╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝

  async function click(
    ev: MouseEvent,
    ...cmd: [
      target: 'setBodyVisibility',
      name: string,
      body: FrameBody,
      visible: boolean,
    ]
  ) {
    console.log('🔵 CLICK', ev.button, cmd)

    switch (cmd[0]) {
      case 'setBodyVisibility': {
        localLand.updateBodyVisibility(cmd[1], cmd[2], cmd[3])
        break
      }
    }
  }

  return {
    cmd: runCmd,
    ev: {
      mousedown,
      mousemove,
      mouseup,
      wheel,
      click,
    },
    get dragState() {
      return dragState
    },
    get framesComponents() {
      return localFrames
    },
    get creatingFrame() {
      return creatingFrame
    },
    space,
    get focusedFrame() {
      return focusedFrame
    },
    get navigationMode() {
      return navigationMode
    },
    get focusablePoints() {
      return focusablePoints
    },
  }
}

export default {
  createStoreContext: (config: StoreConfig) => {
    const store = createStore(config)
    setContext('main-store', store)
  },
  get store() {
    return getContext('main-store') as ReturnType<typeof createStore>
  },
}
