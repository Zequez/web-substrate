import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import AutoImport from 'unplugin-auto-import/vite'
import { type Plugin } from 'vite'

function skipHMRPlugin(): Plugin {
  return {
    name: 'vite-plugin-skip-hmr',

    handleHotUpdate({ file, server }) {
      // Customize your condition here
      if (file.endsWith('.meta.json')) {
        console.log(`[skip-hmr] Skipping HMR for: ${file}`)

        // Return empty list to skip HMR
        return []
      }

      // Returning nothing lets Vite continue normally
    },
  }
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
  },
  plugins: [
    AutoImport({}),
    skipHMRPlugin(),
    svelte(),
    UnoCSS(),
    Icons({ compiler: 'svelte' }),
  ],
  resolve: {
    alias: {},
  },
})
