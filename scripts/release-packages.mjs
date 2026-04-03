import { existsSync, readFileSync, readdirSync } from "node:fs"
import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = process.cwd()
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm"
const GIT_COMMAND = process.platform === "win32" ? "git.exe" : "git"
const ALREADY_PUBLISHED_MARKER = "You cannot publish over the previously published versions"
const RATE_LIMIT_MARKERS = ["E429", "429 Too Many Requests", "rate limited exceeded"]
const DEFAULT_INFO_DELAY_MS = 1000
const DEFAULT_INTER_PUBLISH_DELAY_MS = 15000
const DEFAULT_RATE_LIMIT_RETRY_ATTEMPTS = 4
const DEFAULT_RATE_LIMIT_DELAY_MS = 30000

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

export function isRateLimitedPublishError(output) {
  return RATE_LIMIT_MARKERS.some((marker) => output.includes(marker))
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
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms)
  })
}

export function runCommand(command, args, { quiet = false } = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
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
      resolvePromise({ code: code ?? 1, output })
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

export function mapChangedFilesToWorkspaceDirs(paths) {
  const dirs = new Set()

  for (const path of paths) {
    const match = /^packages\/([^/]+)\//.exec(path)
    if (match) {
      dirs.add(match[1])
    }
  }

  return [...dirs].sort()
}

function collectInternalDependencyNames(packageJson, knownPackageNames) {
  const dependencyGroups = [
    packageJson.dependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies,
  ]
  const dependencies = new Set()

  for (const group of dependencyGroups) {
    if (!group || typeof group !== "object") {
      continue
    }

    for (const name of Object.keys(group)) {
      if (knownPackageNames.has(name)) {
        dependencies.add(name)
      }
    }
  }

  return [...dependencies].sort()
}

export function loadWorkspacePackages(rootDir = REPO_ROOT) {
  const packagesDir = resolve(rootDir, "packages")
  const packageEntries = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const packageJsonPath = resolve(packagesDir, entry.name, "package.json")

      if (!existsSync(packageJsonPath)) {
        return null
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))

      if (packageJson.private || typeof packageJson.name !== "string") {
        return null
      }

      return {
        dirName: entry.name,
        packageJson,
      }
    })
    .filter(Boolean)

  const knownPackageNames = new Set(packageEntries.map((entry) => entry.packageJson.name))

  return packageEntries
    .map(({ dirName, packageJson }) => ({
      dirName,
      name: packageJson.name,
      version: packageJson.version,
      internalDependencies: collectInternalDependencyNames(packageJson, knownPackageNames),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function sortPackagesForPublish(packages) {
  const byName = new Map(packages.map((entry) => [entry.name, entry]))
  const indegree = new Map(packages.map((entry) => [entry.name, 0]))
  const dependents = new Map(packages.map((entry) => [entry.name, []]))

  for (const entry of packages) {
    for (const dependencyName of entry.internalDependencies) {
      if (!byName.has(dependencyName)) {
        continue
      }

      indegree.set(entry.name, (indegree.get(entry.name) ?? 0) + 1)
      dependents.get(dependencyName)?.push(entry.name)
    }
  }

  const queue = [...packages]
    .filter((entry) => (indegree.get(entry.name) ?? 0) === 0)
    .map((entry) => entry.name)
    .sort()
  const orderedNames = []

  while (queue.length > 0) {
    const currentName = queue.shift()
    orderedNames.push(currentName)

    for (const dependentName of (dependents.get(currentName) ?? []).sort()) {
      indegree.set(dependentName, (indegree.get(dependentName) ?? 0) - 1)
      if ((indegree.get(dependentName) ?? 0) === 0) {
        queue.push(dependentName)
        queue.sort()
      }
    }
  }

  if (orderedNames.length !== packages.length) {
    for (const entry of packages) {
      if (!orderedNames.includes(entry.name)) {
        orderedNames.push(entry.name)
      }
    }
  }

  return orderedNames.map((name) => byName.get(name))
}

export async function resolveChangedWorkspaceDirs({
  baseSha = process.env.RELEASE_BASE_SHA ?? null,
  headSha = process.env.RELEASE_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  eventPath = process.env.GITHUB_EVENT_PATH,
  runGit = runCommand,
} = {}) {
  if ((!baseSha || !headSha) && eventPath && existsSync(eventPath)) {
    try {
      const event = JSON.parse(readFileSync(eventPath, "utf8"))
      if (!baseSha && typeof event.before === "string" && event.before && !/^0+$/.test(event.before)) {
        baseSha = event.before
      }
      if (!headSha && typeof event.after === "string" && event.after) {
        headSha = event.after
      }
    } catch {
      // 读取 event 失败时退回 git 推断，不影响本地或 CI 继续运行。
    }
  }

  if (!baseSha) {
    const revParseResult = await runGit(GIT_COMMAND, ["rev-parse", "HEAD^"], { quiet: true })
    if (revParseResult.code !== 0) {
      return []
    }

    baseSha = revParseResult.output.trim()
  }

  if (!headSha) {
    const headResult = await runGit(GIT_COMMAND, ["rev-parse", "HEAD"], { quiet: true })
    if (headResult.code !== 0) {
      return []
    }

    headSha = headResult.output.trim()
  }

  const diffResult = await runGit(
    GIT_COMMAND,
    ["diff", "--name-only", `${baseSha}..${headSha}`],
    { quiet: true },
  )

  if (diffResult.code !== 0) {
    throw new Error(`failed to resolve changed workspaces from git diff ${baseSha}..${headSha}`)
  }

  const changedFiles = diffResult.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return mapChangedFilesToWorkspaceDirs(changedFiles)
}

export async function collectUnpublishedPackages(
  packages,
  {
    checkPublished = isVersionPublished,
    sleep = delay,
    infoDelayMs = DEFAULT_INFO_DELAY_MS,
  } = {},
) {
  const unpublished = []

  for (let index = 0; index < packages.length; index += 1) {
    const entry = packages[index]
    const published = await checkPublished(entry)

    if (published) {
      console.log(
        `[release:ci] Skipping ${entry.name}@${entry.version} because this version is already published on npm.`,
      )
    } else {
      unpublished.push(entry)
    }

    if (infoDelayMs > 0 && index < packages.length - 1) {
      await sleep(infoDelayMs)
    }
  }

  return unpublished
}

export async function publishWorkspacePackage(
  entry,
  {
    runNpm = runCommand,
    verifyPublished = waitForPublishedVersions,
    sleep = delay,
    rateLimitAttempts = DEFAULT_RATE_LIMIT_RETRY_ATTEMPTS,
    rateLimitDelayMs = DEFAULT_RATE_LIMIT_DELAY_MS,
  } = {},
) {
  let lastResult = null

  for (let attempt = 1; attempt <= rateLimitAttempts; attempt += 1) {
    lastResult = await runNpm(
      NPM_COMMAND,
      ["publish", "--workspace", entry.name, "--access", "public"],
    )

    if (lastResult.code === 0) {
      return {
        ok: true,
        result: lastResult,
      }
    }

    if (isAlreadyPublishedVersionError(lastResult.output)) {
      console.error(
        `[release:ci] Detected npm already-published conflict. Verifying registry visibility for: ${entry.name}@${entry.version}`,
      )

      const verified = await verifyPublished([entry])

      return {
        ok: verified,
        result: lastResult,
      }
    }

    if (isRateLimitedPublishError(lastResult.output) && attempt < rateLimitAttempts) {
      console.error(
        `[release:ci] npm publish hit rate limiting for ${entry.name}@${entry.version}. Waiting ${rateLimitDelayMs}ms before retry (${attempt}/${rateLimitAttempts - 1}).`,
      )
      await sleep(rateLimitDelayMs)
      continue
    }

    return {
      ok: false,
      result: lastResult,
    }
  }

  return {
    ok: false,
    result: lastResult ?? { code: 1, output: "" },
  }
}

export async function main() {
  const allPackages = loadWorkspacePackages()
  const changedDirs = await resolveChangedWorkspaceDirs()

  if (changedDirs.length === 0) {
    console.log("[release:ci] No changed workspace packages detected for this push.")
    return
  }

  const changedPackages = allPackages.filter((entry) => changedDirs.includes(entry.dirName))

  if (changedPackages.length === 0) {
    console.log("[release:ci] No publishable workspace packages were touched in this push.")
    return
  }

  const unpublishedPackages = await collectUnpublishedPackages(changedPackages)

  if (unpublishedPackages.length === 0) {
    console.log("[release:ci] All changed workspace package versions are already published.")
    return
  }

  const orderedPackages = sortPackagesForPublish(unpublishedPackages)

  console.log(
    `[release:ci] Publishing ${orderedPackages.length} workspace package(s): ${orderedPackages
      .map((entry) => `${entry.name}@${entry.version}`)
      .join(", ")}`,
  )

  for (let index = 0; index < orderedPackages.length; index += 1) {
    const entry = orderedPackages[index]
    const publishResult = await publishWorkspacePackage(entry)

    if (!publishResult.ok) {
      process.exit(publishResult.result.code || 1)
    }

    if (index < orderedPackages.length - 1) {
      console.error(
        `[release:ci] Waiting ${DEFAULT_INTER_PUBLISH_DELAY_MS}ms before publishing the next workspace package.`,
      )
      await delay(DEFAULT_INTER_PUBLISH_DELAY_MS)
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
