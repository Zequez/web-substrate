#! /usr/bin/env bun

// On the root of the web-substrate repo
// bun link
// bun link web-substrate-mainframe
// Now you can run the `wesma` script from anywhere

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { start } from '../start'
import { exists } from 'fs/promises'
import path from 'path'
import { Mainframe } from '../Mainframe'
import { DIST_ROOT, LAND_ROOT } from '../paths'
import chalk from 'chalk'
import { build } from 'vite'
import { generateConfig } from '../../vite.config'
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { pushLand } from '../deploy'

yargs(hideBin(process.argv))
  .scriptName('wesma')
  .command(
    'start',
    'Starts the web substrate app (dev mode)',
    (yargs) => {},
    (argv) => {
      // new Mainframe(argv.landPath)
      start()
    },
  )
  .command(
    'build <land>',
    'Build the specific land',
    (yargs) => {
      return yargs.positional('land', {
        describe: 'The land to build',
        type: 'string',
        demandOption: true,
      })
    },
    async (argv) => {
      console.log(`LAND ${argv.land}`)
      if (await exists(path.join(LAND_ROOT, argv.land))) {
        const viteBuildConfig = await generateConfig({
          landRoot: argv.land,
          build: true,
        })

        await build(viteBuildConfig)
      } else {
        console.error(chalk.red(`Land path ${argv.land} does not exist`))
      }
    },
  )
  .command(
    'preview <land>',
    'Preview the specific built land on www/<land>',
    (yargs) => {
      return yargs.positional('land', {
        describe: 'The land to preview',
        type: 'string',
        demandOption: true,
      })
    },
    async (argv) => {
      console.log('LAND', argv.land)
      if (await exists(path.join(DIST_ROOT, argv.land))) {
        // await staticServe(argv.land)
        const app = new Elysia()
          .use(
            staticPlugin({
              prefix: '/',
              assets: path.join(DIST_ROOT, argv.land),
            }),
          )
          .listen(3000)
      } else {
        console.error(chalk.red(`Built land path ${argv.land} does not exist`))
      }
    },
  )
  .command(
    'push <land>',
    'Push the specific land to Github land/<land>',
    (yargs) => {
      return yargs.positional('land', {
        describe: 'The land to push',
        type: 'string',
        demandOption: true,
      })
    },
    async (argv) => {
      console.log('LAND', argv.land)
      const landPath = path.join(LAND_ROOT, argv.land)
      if (await exists(landPath)) {
        await pushLand(argv.land, 'raw')
      }
    },
  )
  .command(
    'deploy <land>',
    'Deploy the specific land to Github gh-pages branch',
    (yargs) => {
      return yargs.positional('land', {
        describe: 'The land to deploy',
        type: 'string',
        demandOption: true,
      })
    },
    async (argv) => {
      console.log('LAND', argv.land)
      const landPath = path.join(LAND_ROOT, argv.land)
      if (await exists(landPath)) {
        await pushLand(argv.land, 'built')
      }
    },
  )
  .demandCommand(1, '')
  .help()
  .parse()
