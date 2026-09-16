// Force a deterministic non-CI environment for unit tests.
// GitHub Actions sets CI=true / GITHUB_ACTIONS=true by default, which would
// activate the ActionExecutor's CI-mode branch (selector healing disabled).
// Unit tests exercise the normal execution path; E2E runs opt into CI mode
// explicitly via HALTEST_RUNNER_MODE=ci.
const ciVars = [
    'CI',
    'GITHUB_ACTIONS',
    'GITLAB_CI',
    'HALTEST_RUNNER_MODE',
    'HALTEST_MODE',
    'JENKINS_URL',
];
for (const key of ciVars) {
    if (key === 'JENKINS_URL') {
        delete process.env[key];
    } else {
        process.env[key] = 'false';
    }
}
