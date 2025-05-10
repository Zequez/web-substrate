import { setContext, getContext } from 'svelte'
import { uplink } from '../uplink/client'
import { boxIsBigEnough, pos2box, resizeBox, type Box } from './box'
import spaceStore from './space.svelte'
import { createFramesComponentsStore } from './framesComponents.svelte'
import type { BoxResizeHandles } from './box'
import type { Meta } from './meta'

type StoreConfig = []

function createStore(...storeConfig: StoreConfig) {
  let space = spaceStore({ centerAt: null })
  let framesComponents = createFramesComponentsStore()
  let creatingFrame = $state<{
    box: Box
    timestamp: number
  } | null>(null)

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
  ) {
    console.log('⚪️ CMD', cmd)

    switch (cmd[0]) {
      case 'ping': {
        await uplink('ping', 'Test')
        break
      }
      case 'rename-frame': {
        if (cmd[1] !== cmd[2]) {
          framesComponents.rename(cmd[1], cmd[2])
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
          box: creatingFrame.box,
          updatedAt: Date.now(),
          codeBox: {
            x: creatingFrame.box.x + creatingFrame.box.w,
            y: creatingFrame.box.y,
            w: creatingFrame.box.w,
            h: creatingFrame.box.h,
          },
          showCodeBox: false,
        }
        await uplink(
          'createFrameComponent',
          cmd[1],
          JSON.stringify(meta, null, 2),
          `<div class="bg-black text-white text-xl rounded-b-md size-full flexcc">\n  Text\n</div>
          `,
        )
        creatingFrame = null
        break
      }

      case 'save-code': {
        framesComponents.updateCode(cmd[1], cmd[2])
        break
      }
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
      }
    | {
        type: 'moveFrame'
        name: string
        body: 'main' | 'code'
        start: [number, number]
        resultingBox: Box
      }
    | {
        type: 'resizeFrame'
        name: string
        body: 'main' | 'code'
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

  async function mousedown(
    ev: MouseEvent,
    ...cmd:
      | [target: 'frameDragHandle', name: string, body: 'main' | 'code']
      | [
          target: 'resizeHandler',
          frameName: string,
          body: 'main' | 'code',
          handler: BoxResizeHandles,
        ]
      | [target: 'space']
  ) {
    console.log('🟢 M DOWN', ev.button, cmd)

    if (creatingFrame && cmd[0] === 'space' && ev.button === 0) {
      creatingFrame = null
      return
    }

    switch (cmd[0]) {
      case 'space': {
        if (ev.button === 1) {
          dragState = { type: 'panning', panned: false }
        } else if (ev.button === 0) {
          const pos = space.mouseToGridPos(ev.clientX, ev.clientY)
          dragState = {
            type: 'createFrame',
            start: pos,
            end: pos,
            resultingBox: { x: pos[0], y: pos[1], w: 1, h: 1 },
          }
        }
        break
      }
      case 'frameDragHandle': {
        if (ev.button === 0) {
          ev.stopPropagation()
          // const uuid = cmd[1];
          const comp = framesComponents.all[cmd[1]]
          dragState = {
            type: 'moveFrame',
            name: cmd[1],
            body: cmd[2],
            start: space.mouseToGridPos(ev.clientX, ev.clientY),
            resultingBox: {
              ...(cmd[2] === 'main' ? comp.meta.box : comp.meta.codeBox),
            },
          }
        }
        break
      }
      case 'resizeHandler': {
        ev.stopPropagation()
        const comp = framesComponents.all[cmd[1]]
        dragState = {
          type: 'resizeFrame',
          name: cmd[1],
          body: cmd[2],
          handler: cmd[3],
          gridPosStart: space.mouseToGridPos(ev.clientX, ev.clientY),
          resultingBox: {
            ...(cmd[2] === 'main' ? comp.meta.box : comp.meta.codeBox),
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
  async function mousemove(ev: MouseEvent, ...cmd: [target: 'space']) {
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
            space.cmd.pan(ev.movementX, ev.movementY)
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

            const comp = framesComponents.all[dragState.name]
            const box =
              dragState.body === 'main' ? comp.meta.box : comp.meta.codeBox
            dragState.resultingBox.x = box.x - dx
            dragState.resultingBox.y = box.y - dy
            break
          }
          case 'resizeFrame': {
            const currentPos = space.mouseToGridPos(ev.clientX, ev.clientY)
            const dx = currentPos[0] - dragState.gridPosStart[0]
            const dy = currentPos[1] - dragState.gridPosStart[1]

            const comp = framesComponents.all[dragState.name]
            const box =
              dragState.body === 'main' ? comp.meta.box : comp.meta.codeBox
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

  async function mouseup(ev: MouseEvent, ...cmd: [target: 'space']) {
    console.log('🔴 M UP', ev.button, cmd)

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
            if (
              space.vp.screenW - ev.clientX <= 100 &&
              space.vp.screenH - ev.clientY <= 100 &&
              dragState.body === 'main'
            ) {
              framesComponents.remove(dragState.name)
            } else {
              framesComponents.updateMeta(
                dragState.name,
                dragState.body === 'main'
                  ? {
                      box: dragState.resultingBox,
                    }
                  : {
                      codeBox: dragState.resultingBox,
                    },
              )
            }
            break
          }
          case 'resizeFrame': {
            framesComponents.updateMeta(
              dragState.name,
              dragState.body === 'main'
                ? { box: dragState.resultingBox }
                : { codeBox: dragState.resultingBox },
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
    ...cmd: [target: 'frameCodingToggle', name: string]
  ) {
    console.log('🔵 CLICK', ev.button, cmd)

    switch (cmd[0]) {
      case 'frameCodingToggle': {
        framesComponents.updateMeta(cmd[1], {
          showCodeBox: !framesComponents.all[cmd[1]].meta.showCodeBox,
        })
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
      return framesComponents.all
    },
    get creatingFrame() {
      return creatingFrame
    },
    space,
  }
}

export default {
  createStoreContext: (...storeConfig: StoreConfig) => {
    const store = createStore(...storeConfig)
    setContext('main-store', store)
  },
  get store() {
    return getContext('main-store') as ReturnType<typeof createStore>
  },
}
