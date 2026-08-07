export type CodeFurnaceAction =
  | "read_file"
  | "write_file"
  | "run_test"
  | "run_linter"
  | "install_dependency"
  | "network_request"
  | "publish_package"
  | "write_repository"
  | "create_account"
  | "send_message";

export type CodeFurnacePolicy = {
  allowedActions: ReadonlySet<CodeFurnaceAction>;
  allowedPaths: readonly string[];
  allowedHosts: readonly string[];
  allowDependencyInstall: boolean;
  allowExternalWrites: boolean;
};

export const DEFAULT_CODE_FURNACE_POLICY: CodeFurnacePolicy = {
  allowedActions: new Set<CodeFurnaceAction>([
    "read_file",
    "write_file",
    "run_test",
    "run_linter",
  ]),
  allowedPaths: ["/workspace"],
  allowedHosts: [],
  allowDependencyInstall: false,
  allowExternalWrites: false,
};

function isInsideAllowedPath(path: string, allowedPaths: readonly string[]) {
  const normalized = path.replaceAll("\\", "/");
  return allowedPaths.some((allowed) => {
    const base = allowed.replace(/\/+$/, "");
    return normalized === base || normalized.startsWith(`${base}/`);
  });
}

export function assertActionAllowed(
  policy: CodeFurnacePolicy,
  action: CodeFurnaceAction,
  target?: string,
) {
  if (!policy.allowedActions.has(action)) {
    throw new Error(`Code Furnace blocked action: ${action}`);
  }

  if (
    target &&
    (action === "read_file" || action === "write_file") &&
    !isInsideAllowedPath(target, policy.allowedPaths)
  ) {
    throw new Error(`Code Furnace blocked path outside workspace: ${target}`);
  }

  if (action === "install_dependency" && !policy.allowDependencyInstall) {
    throw new Error("Dependency installation requires explicit approval.");
  }

  if (
    (action === "publish_package" ||
      action === "write_repository" ||
      action === "create_account" ||
      action === "send_message") &&
    !policy.allowExternalWrites
  ) {
    throw new Error("External side effects are disabled for this job.");
  }
}
