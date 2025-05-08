import { onMount, setContext, getContext } from 'svelte'
import { uplink, type UplinkFile } from '../uplink/client'
import type { Box, Frame } from './frames.svelte'
import spaceStore from './space.svelte'
import { createThingsStore } from './things.svelte'

type StoreConfig = []
type Cmd =
  | ['ping']
  | ['mount-file', string]
  | ['update-mounted-file', string]
  | ['save-mounted-file']
  | ['create-frame', Frame]

function createStore(...storeConfig: StoreConfig) {
  let filesList = $state<string[]>([])
  let mountedFile = $state<string | null>(null)
  let filesContent = $state<{ [key: string]: UplinkFile }>({})
  let space = spaceStore({ centerAt: null })
  // let frames = createThingsStore<Frame>({ lsKey: "frames2", fsKey: "frames" });
  // let frames = $state<{ [key: string]: Frame }>(
  //   maybeReadLS('frames', {}) as { [key: string]: Frame },
  // )

  $effect(() => {
    localStorage.setItem('frames', JSON.stringify(frames))
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
      case 'mount-file': {
        const fileContent = await uplink('readFile', cmd[1])
        mountedFile = cmd[1]
        filesContent = {
          ...filesContent,
          [cmd[1]]: fileContent,
        }
        break
      }
      case 'update-mounted-file': {
        if (mountedFile && filesContent[mountedFile].type === 'text') {
          filesContent[mountedFile].data = cmd[1]
        }
        break
      }
      case 'save-mounted-file': {
        if (mountedFile && filesContent[mountedFile].type === 'text') {
          await uplink('writeFile', mountedFile, filesContent[mountedFile])
        }
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
        uuid: string
        start: [number, number]
        resultingBox: Box
      }
  let dragState = $state<DragState>({ type: 'none' })

  async function mousedown(
    ev: MouseEvent,
    ...cmd: [target: 'frame', uuid: string] | [target: 'space']
  ) {
    switch (cmd[0]) {
      case 'space': {
        dragState = { type: 'panning', panned: false }
        break
      }
      case 'frame': {
        // if (ev.button === 0) {
        //   ev.stopPropagation();
        //   const uuid = cmd[1];
        //   dragState = {
        //     type: "moveFrame",
        //     uuid,
        //     start: space.mouseToGridPos(ev.clientX, ev.clientY),
        //     resultingBox: { ...frames.all[uuid].value.box },
        //   };
        // }
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
          case 'moveFrame': {
            // const [x, y] = space.mouseToGridPos(ev.clientX, ev.clientY);
            // const dx = dragState.start[0] - x;
            // const dy = dragState.start[1] - y;
            // const fbox = frames.all[dragState.uuid].value.box;
            // dragState.resultingBox.x = fbox.x - dx;
            // dragState.resultingBox.y = fbox.y - dy;
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
        // switch (dragState.type) {
        //   case "moveFrame": {
        //     frames.update(dragState.uuid, { box: dragState.resultingBox });
        //   }
        // }

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
    // get frames() {
    //   return frames.all;
    // },
    get filesList() {
      return filesList
    },
    get mountedFile() {
      return mountedFile
    },
    get filesContent() {
      return filesContent
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
