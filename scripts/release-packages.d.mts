export interface VersionedPackage {
  name: string
  version: string
}

export interface WorkspacePackage extends VersionedPackage {
  dirName: string
  internalDependencies: string[]
}

export interface CommandResult {
  code: number
  output: string
}

export interface RunCommandOptions {
  quiet?: boolean
}

export type RunCommand = (
  command: string,
  args: string[],
  options?: RunCommandOptions,
) => Promise<CommandResult>

export function isAlreadyPublishedVersionError(output: string): boolean

export function isRateLimitedPublishError(output: string): boolean

export function extractFailedPackages(output: string): VersionedPackage[]

export function runCommand(
  command: string,
  args: string[],
  options?: RunCommandOptions,
): Promise<CommandResult>

export function isVersionPublished(entry: VersionedPackage): Promise<boolean>

export function waitForPublishedVersions(
  packages: VersionedPackage[],
  options?: {
    attempts?: number
    delayMs?: number
  },
): Promise<boolean>

export function mapChangedFilesToWorkspaceDirs(paths: string[]): string[]

export function loadWorkspacePackages(rootDir?: string): WorkspacePackage[]

export function sortPackagesForPublish(packages: WorkspacePackage[]): WorkspacePackage[]

export function resolveChangedWorkspaceDirs(options?: {
  eventPath?: string
  runGit?: RunCommand
}): Promise<string[]>

export function collectUnpublishedPackages(
  packages: WorkspacePackage[],
  options?: {
    checkPublished?: (entry: VersionedPackage) => Promise<boolean>
    sleep?: (ms: number) => Promise<void> | void
    infoDelayMs?: number
  },
): Promise<WorkspacePackage[]>

export function publishWorkspacePackage(
  entry: WorkspacePackage,
  options?: {
    runNpm?: RunCommand
    verifyPublished?: (packages: VersionedPackage[]) => Promise<boolean>
    sleep?: (ms: number) => Promise<void> | void
    rateLimitAttempts?: number
    rateLimitDelayMs?: number
  },
): Promise<{
  ok: boolean
  result: CommandResult
}>

export function main(): Promise<void>
