import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm"
const ALREADY_PUBLISHED_MARKER = "You cannot publish over the previously published versions"

function uniquePackages(packages) {
  const deduped = new Map()

  for (const entry of packages) {
    deduped.set(`${entry.name}@${entry.version}`, entry)
  }

  return [...deduped.values()]
}

export function isAlreadyPublishedVersionError(output) {
  return output.includes(ALREADY_PUBLISHED_MARKER)
}

export function extractFailedPackages(output) {
  const sectionIndex = output.lastIndexOf("packages failed to publish:")

  if (sectionIndex === -1) {
    return []
  }

  const section = output.slice(sectionIndex)
  const matches = [...section.matchAll(/(@[^@\s]+\/[^@\s]+)@([0-9][^\s]*)/g)].map(
    ([, name, version]) => ({
      name,
      version,
    }),
  )

  return uniquePackages(matches)
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function runCommand(command, args, { quiet = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let output = ""

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString()
      output += text
      if (!quiet) {
        process.stdout.write(text)
      }
    })

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      output += text
      if (!quiet) {
        process.stderr.write(text)
      }
    })

    child.on("close", (code) => {
      resolve({ code: code ?? 1, output })
    })
  })
}

export async function isVersionPublished({ name, version }) {
  const result = await runCommand(
    NPM_COMMAND,
    ["view", `${name}@${version}`, "version", "--json"],
    { quiet: true },
  )

  if (result.code !== 0) {
    return false
  }

  return result.output.includes(version)
}

export async function waitForPublishedVersions(packages, { attempts = 6, delayMs = 10000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const checks = await Promise.all(packages.map((entry) => isVersionPublished(entry)))

    if (checks.every(Boolean)) {
      return true
    }

    if (attempt < attempts) {
      console.error(
        `[release:ci] npm registry still has pending package visibility (${attempt}/${attempts}). Waiting ${delayMs}ms before retry.`,
      )
      await delay(delayMs)
    }
  }

  return false
}

export async function main() {
  const releaseResult = await runCommand(NPM_COMMAND, ["run", "release"])

  if (releaseResult.code === 0) {
    return
  }

  if (!isAlreadyPublishedVersionError(releaseResult.output)) {
    process.exit(releaseResult.code)
  }

  const failedPackages = extractFailedPackages(releaseResult.output)

  if (failedPackages.length === 0) {
    process.exit(releaseResult.code)
  }

  console.error(
    `[release:ci] Detected npm already-published conflict. Verifying registry visibility for: ${failedPackages
      .map((entry) => `${entry.name}@${entry.version}`)
      .join(", ")}`,
  )

  const verified = await waitForPublishedVersions(failedPackages)

  if (!verified) {
    process.exit(releaseResult.code)
  }

  console.log(
    `[release:ci] Confirmed published versions after npm propagation delay. Treating release as successful.`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
