import { onMount, setContext, getContext } from 'svelte'
import { uplink, type UplinkFile } from '../uplink/client'
import { pos2box, type Box } from './box.svelte'
import spaceStore from './space.svelte'
import { createThingsStore } from './things.svelte'
import { createFramesComponentsStore } from './framesComponents.svelte'
import { updatedAt } from '../dist/assets/ezequiel.meta-Fk8Vt5oB'

type StoreConfig = []
type Cmd =
  | ['ping']
  | ['mount-file', string]
  | ['update-mounted-file', string]
  | ['save-mounted-file']
  | ['rename-frame', name: string, newName: string]
  | ['rename-creating-frame', name: string]
  | ['cancel-creating-frame']
  | ['commit-new-frame']

function createStore(...storeConfig: StoreConfig) {
  // let filesList = $state<string[]>([])
  // let mountedFile = $state<string | null>(null)
  // let filesContent = $state<{ [key: string]: UplinkFile }>({})
  let space = spaceStore({ centerAt: null })
  let framesComponents = createFramesComponentsStore()
  let creatingFrame = $state<{
    box: Box
    name: string
    timestamp: number
  } | null>(null)
  // let frames = createThingsStore<Frame>({ lsKey: "frames2", fsKey: "frames" });
  // let frames = $state<{ [key: string]: Frame }>(
  //   maybeReadLS('frames', {}) as { [key: string]: Frame },
  // )

  $effect(() => {
    // localStorage.setItem('frames', JSON.stringify(frames))
  })

  onMount(async () => {
    // const filesList = await uplink("filesList", ".");
    // filesList.forEach((file) => {
    //   const exists = Object.values(frames.all).find(
    //     (f) => f.value.content.type === "file" && f.value.content.path === file
    //   );
    //   if (!exists) {
    //     frames.create({
    //       box: { x: 0, y: 0, w: 9, h: 3 },
    //       content: { type: "file", path: file },
    //     });
    //   }
    // });
  })

  async function runCmd(...cmd: Cmd) {
    console.log('⭕️', cmd)
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
      case 'rename-creating-frame': {
        if (!creatingFrame) return
        creatingFrame.name = cmd[1]
        break
      }
      case 'cancel-creating-frame': {
        creatingFrame = null
        break
      }
      case 'commit-new-frame': {
        if (!creatingFrame) return
        await uplink(
          'createFrameComponent',
          creatingFrame.name,
          JSON.stringify(
            { box: creatingFrame.box, updatedAt: Date.now() },
            null,
            2,
          ),
          '<div>Hello there</div>',
        )
        creatingFrame = null
        break
      }
      case 'mount-file': {
        // const fileContent = await uplink('readFile', cmd[1])
        // mountedFile = cmd[1]
        // filesContent = {
        //   ...filesContent,
        //   [cmd[1]]: fileContent,
        // }
        break
      }
      case 'update-mounted-file': {
        // if (mountedFile && filesContent[mountedFile].type === 'text') {
        //   filesContent[mountedFile].data = cmd[1]
        // }
        break
      }
      case 'save-mounted-file': {
        // if (mountedFile && filesContent[mountedFile].type === 'text') {
        //   await uplink('writeFile', mountedFile, filesContent[mountedFile])
        // }
        break
      }
    }
  }

  type DragState =
    | { type: 'none' }
    | {
        type: 'panning'
        panned: boolean
      }
    | {
        type: 'moveFrame'
        name: string
        start: [number, number]
        resultingBox: Box
      }
    | {
        type: 'createFrame'
        start: [number, number]
        end: [number, number]
        resultingBox: Box
      }
  let dragState = $state<DragState>({ type: 'none' })

  async function mousedown(
    ev: MouseEvent,
    ...cmd: [target: 'frame', name: string] | [target: 'space']
  ) {
    console.log('MouseDown', ev.button, cmd)
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
      case 'frame': {
        if (ev.button === 0) {
          ev.stopPropagation()
          // const uuid = cmd[1];
          const frameComponent = framesComponents.all[cmd[1]]
          dragState = {
            type: 'moveFrame',
            name: cmd[1],
            start: space.mouseToGridPos(ev.clientX, ev.clientY),
            resultingBox: { ...frameComponent.meta.box },
          }
        }
        break
      }
    }
  }

  async function mousemove(ev: MouseEvent, ...cmd: [target: 'space']) {
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
            const box = framesComponents.all[dragState.name].meta.box
            dragState.resultingBox.x = box.x - dx
            dragState.resultingBox.y = box.y - dy
            break
          }
        }
      }
    }
  }

  async function mouseup(ev: MouseEvent, ...cmd: [target: 'space']) {
    switch (cmd[0]) {
      case 'space': {
        if (dragState.type === 'none') return
        ev.stopPropagation()
        switch (dragState.type) {
          case 'createFrame': {
            if (creatingFrame) {
              creatingFrame.box = dragState.resultingBox
              creatingFrame.timestamp = Date.now()
            } else {
              creatingFrame = {
                box: dragState.resultingBox,
                name: `frame-${Object.keys(framesComponents.all).length}`,
                timestamp: Date.now(),
              }
            }

            break
          }
          case 'moveFrame': {
            if (
              space.vp.screenW - ev.clientX <= 100 &&
              space.vp.screenH - ev.clientY <= 100
            ) {
              framesComponents.remove(dragState.name)
            } else {
              framesComponents.updateMeta(dragState.name, {
                box: dragState.resultingBox,
              })
            }
            break
          }
        }

        dragState = { type: 'none' }
        break
      }
    }
  }

  async function wheel(ev: WheelEvent, ...cmd: [target: 'space']) {
    switch (cmd[0]) {
      case 'space': {
        ev.preventDefault()
        ev.stopPropagation()
        space.cmd.setZoomFromWheel(ev.deltaY)
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
    // get frames() {
    //   return frames.all;
    // },
    // get filesList() {
    //   return filesList
    // },
    // get mountedFile() {
    //   return mountedFile
    // },
    // get filesContent() {
    //   return filesContent
    // },
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
