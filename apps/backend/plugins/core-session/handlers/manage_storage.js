import manageSessionAction from './manage_session.js';

const manageStorageAction = (req, res) => {
    const { storageType } = req.body;
    req.body.target = storageType === 'session' ? 'session_storage' : 'local_storage';
    if (req.body.action === 'remove') req.body.action = 'delete'; // Compatibility
    return manageSessionAction(req, res);
};

export default manageStorageAction;
