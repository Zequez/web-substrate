import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte(), UnoCSS(), Icons({ compiler: 'svelte' })],
  resolve: {
    alias: {},
  },
})
