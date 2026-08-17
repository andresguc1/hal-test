const flowControlAction = async (req, res) => {
    try {
        const { action, returnValue } = req.body;

        return res.status(200).json({
            success: true,
            message: req.t('actions.flow_control.success'),
            data: { action, returnValue },
        });
    } catch (error) {
        console.error('[ERROR] flowControlAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.flow_control.error'),
            error: error.message,
        });
    }
};

export default flowControlAction;
