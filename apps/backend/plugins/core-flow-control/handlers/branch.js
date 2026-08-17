const branchAction = async (req, res) => {
    try {
        const { mode, timeout = 30000 } = req.body;

        return res.status(200).json({
            success: true,
            message: req.t('actions.branch.success'),
            data: { mode, timeout },
        });
    } catch (error) {
        console.error('[ERROR] branchAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.branch.error'),
            error: error.message,
        });
    }
};

export default branchAction;
