import manageSessionAction from './manage_session.js';

const injectTokensAction = (req, res) => {
    req.body.action = 'set';
    return manageSessionAction(req, res);
};

export default injectTokensAction;
