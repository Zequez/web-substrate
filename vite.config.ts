import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'

export default defineConfig({
  server: {
    host: '0.0.0.0',
  },
  plugins: [AutoImport({}), svelte(), UnoCSS(), Icons({ compiler: 'svelte' })],
  resolve: {
    alias: {},
  },
})
