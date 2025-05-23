import chalk from 'chalk'

await Bun.$`bun run build`
await Bun.$`cp CNAME dist/CNAME`
await Bun.$`cd dist && git init`
await Bun.$`cd dist && git add .`

try {
  await Bun.$`cd dist && git commit -m "Built ${new Date().toISOString()}"`
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
  await Bun.$`cd dist && git remote add origin git@github.com:Zequez/web-substrate.git`
  console.log(chalk.green('Remote added'))
} catch (e) {
  const msg = ((e as any).stderr as Buffer).toString()
  if (msg.match(/already exists/)) {
    console.log(chalk.yellow('Remote already added'))
  } else {
    throw e
  }
}

await Bun.$`cd dist && git push -u origin main:gh-pages --force`
