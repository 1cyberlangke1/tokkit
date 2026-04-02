export interface FailedPackage {
  name: string
  version: string
}

export interface CommandResult {
  code: number
  output: string
}

export function isAlreadyPublishedVersionError(output: string): boolean
export function extractFailedPackages(output: string): FailedPackage[]
export function runCommand(
  command: string,
  args: string[],
  options?: { quiet?: boolean },
): Promise<CommandResult>
export function isVersionPublished(entry: FailedPackage): Promise<boolean>
export function waitForPublishedVersions(
  packages: FailedPackage[],
  options?: { attempts?: number; delayMs?: number },
): Promise<boolean>
export function main(): Promise<void>
