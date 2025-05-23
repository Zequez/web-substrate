import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import 'svooltip/styles.css'
import { mount } from 'svelte'

import Compositor from './ui/Compositor.svelte'

mount(Compositor, { target: document.getElementById('root')!, props: {} })
