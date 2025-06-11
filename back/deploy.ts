import chalk from 'chalk'
import path from 'path'
import { DIST_ROOT, LAND_ROOT } from './paths'

export async function pushLand(land: string, rawOrBuilt: 'raw' | 'built') {
  const branch = rawOrBuilt === 'raw' ? 'main' : 'gh-pages'
  const landPath = path.join(LAND_ROOT, land)
  const distPath = path.join(DIST_ROOT, land)
  const repoPath = rawOrBuilt === 'raw' ? landPath : distPath
  const config = await import(path.join(landPath, 'config.json'))

  if (!config.github) {
    throw new Error('No github config')
  }
  if (rawOrBuilt === 'built' && !config.target) {
    throw new Error('No target config')
  }

  // Create CNAME file from config.target
  if (rawOrBuilt === 'built') {
    await Bun.write(path.join(distPath, 'CNAME'), config.target)
  }

  await Bun.$`cd ${repoPath} && git init`
  await Bun.$`cd ${repoPath} && git add .`
  try {
    await Bun.$`cd ${repoPath} && git commit -m "Built ${new Date().toISOString()}"`
    console.log(chalk.green('Committed'))
  } catch (e) {
    const msg = ((e as any).stdout as Buffer).toString()
    if (msg.match(/nothing to commit, working tree clean/)) {
      console.log(chalk.yellow('Nothing to commit'))
    } else {
      throw e
    }
  }

  try {
    await Bun.$`cd ${repoPath} && git remote add origin git@github.com:${config.github}.git`
    console.log(chalk.green('Remote added'))
  } catch (e) {
    const msg = ((e as any).stderr as Buffer).toString()
    if (msg.match(/already exists/)) {
      console.log(chalk.yellow('Remote already added'))
    } else {
      throw e
    }
  }

  await Bun.$`cd ${repoPath} && git push -u origin main:${branch}`
}
