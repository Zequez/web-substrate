#! /usr/bin/env bun

// On the root of the web-substrate repo
// bun link
// bun link web-substrate-mainframe
// Now you can run the `wesma` script from anywhere

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { start } from '../start'

yargs(hideBin(process.argv))
  .command(
    'start',
    'Starts the web substrate app (dev mode)',
    (yargs) => {},
    (argv) => {
      start()
    },
  )
  .parse()
