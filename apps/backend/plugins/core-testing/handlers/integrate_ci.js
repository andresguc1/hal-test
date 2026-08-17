import { smartEmitLog } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const integrateCiAction = (req, res) => {
    const { provider = 'auto', verbose = true } = req.body;

    let detectedProvider = provider;
    const ciVars = {};

    // 1. Detection Logic
    if (provider === 'auto' || provider === 'github') {
        if (process.env.GITHUB_ACTIONS) {
            detectedProvider = 'github';
            ciVars.CI_PLATFORM = 'GitHub Actions';
            ciVars.CI_RUN_ID = process.env.GITHUB_RUN_ID;
            ciVars.CI_ACTOR = process.env.GITHUB_ACTOR;
            ciVars.CI_REPOSITORY = process.env.GITHUB_REPOSITORY;
        }
    }

    if ((provider === 'auto' || provider === 'gitlab') && !ciVars.CI_PLATFORM) {
        if (process.env.GITLAB_CI) {
            detectedProvider = 'gitlab';
            ciVars.CI_PLATFORM = 'GitLab CI';
            ciVars.CI_RUN_ID = process.env.CI_PIPELINE_ID;
            ciVars.CI_ACTOR = process.env.GITLAB_USER_LOGIN;
            ciVars.CI_REPOSITORY = process.env.CI_PROJECT_PATH;
        }
    }

    if ((provider === 'auto' || provider === 'jenkins') && !ciVars.CI_PLATFORM) {
        if (process.env.JENKINS_URL) {
            detectedProvider = 'jenkins';
            ciVars.CI_PLATFORM = 'Jenkins';
            ciVars.CI_RUN_ID = process.env.BUILD_NUMBER;
            ciVars.CI_ACTOR = process.env.BUILD_USER_ID || 'anonymous';
            ciVars.CI_REPOSITORY = process.env.JOB_NAME;
        }
    }

    // Fallback if nothing detected but provider was specified
    if (!ciVars.CI_PLATFORM && provider !== 'auto') {
        ciVars.CI_PLATFORM = provider;
        ciVars.CI_STATUS = 'Generic/Manual';
    }

    // 2. Persist to VariableManager (Global)
    Object.entries(ciVars).forEach(([key, val]) => {
        if (val) variableManager.set(key, val, 'global');
    });

    if (verbose && ciVars.CI_PLATFORM) {
        smartEmitLog(
            `[CI] provider detected: ${ciVars.CI_PLATFORM} (Run ID: ${ciVars.CI_RUN_ID})`,
            'info',
        );
    } else if (verbose) {
        smartEmitLog(`[CI] No CI environment detected. Running in local mode.`, 'info');
    }

    return res.status(200).json({
        success: true,
        message: ciVars.CI_PLATFORM
            ? `CI environment recognized: ${ciVars.CI_PLATFORM}`
            : 'CI integration initialized (Local/Manual)',
        data: {
            detectedProvider,
            variables: ciVars,
        },
    });
};

export default integrateCiAction;
