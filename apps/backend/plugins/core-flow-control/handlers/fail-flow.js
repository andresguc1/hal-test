const failFlowAction = async (req, res) => {
    try {
        const { message = 'Flow explicitly aborted' } = req.body;

        return res.status(200).json({
            success: false,
            message: `Flow explicitly failed: ${message}`,
            error: message,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error executing fail index action',
            error: error.message,
        });
    }
};

export default failFlowAction;
