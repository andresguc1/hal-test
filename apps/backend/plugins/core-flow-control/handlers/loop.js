import { variableManager } from '../../../services/VariableManager.js';

const loopAction = async (req, res) => {
    try {
        const {
            nodeId,
            mode,
            loopType: inputLoopType,
            iterations,
            condition,
            array: arrayInput,
            itemVar = 'item',
            indexVar = 'i',
            maxIterations = 1000,
        } = req.body;

        let loopType = inputLoopType;
        if (!loopType) {
            const normalizedMode = mode;
            if (normalizedMode === 'while') {
                loopType = 'while';
            } else {
                loopType = 'for';
            }
        }

        const stateKey = `_loop_state_${nodeId}`;
        let state = variableManager.get(stateKey, req.body.runId);

        if (!state) {
            state = { index: 0, totalIterations: 0 };
        }

        let shouldContinue = false;
        let currentItem = null;

        if (loopType === 'for') {
            let total = 0;
            if (mode === 'array' || mode === 'each' || mode === 'forEach') {
                let list = [];
                if (typeof arrayInput === 'string') {
                    list =
                        variableManager.get(arrayInput, req.body.runId) ||
                        variableManager.resolveValue(arrayInput, req.body.runId);
                } else if (Array.isArray(arrayInput)) {
                    list = arrayInput;
                }
                if (!Array.isArray(list)) list = [];
                total = list.length;
                if (state.index < total) {
                    currentItem = list[state.index];
                }
            } else {
                total = Number(variableManager.resolveValue(iterations, req.body.runId));
                if (isNaN(total)) total = 0;
            }
            shouldContinue = state.index < total;
        } else if (loopType === 'while') {
            try {
                shouldContinue = variableManager.evaluate(condition, req.body.runId) === true;
            } catch (e) {
                shouldContinue = false;
            }
        }

        if (state.index >= maxIterations) {
            shouldContinue = false;
        }

        if (!shouldContinue) {
            variableManager.delete(stateKey, req.body.runId);
            return res.status(200).json({
                success: true,
                message: 'Loop completed',
                path: 'completed',
                data: {
                    path: 'completed',
                    totalIterations: state.index,
                },
            });
        }

        variableManager.set('loop.index', state.index, req.body.runId);
        variableManager.set('loop.iteration', state.index + 1, req.body.runId);
        variableManager.set('loop.isFirst', state.index === 0, req.body.runId);
        variableManager.set(indexVar, state.index, req.body.runId);

        if (mode === 'array' || mode === 'each' || mode === 'forEach') {
            variableManager.set(itemVar, currentItem, req.body.runId);
            variableManager.set('loop.currentItem', currentItem, req.body.runId);
        }

        variableManager.set(
            stateKey,
            {
                index: state.index + 1,
                totalIterations: state.index + 1,
            },
            req.body.runId,
        );

        return res.status(200).json({
            success: true,
            message: `Loop iteration ${state.index}`,
            path: 'body',
            data: {
                path: 'body',
                index: state.index,
                item: currentItem,
            },
        });
    } catch (error) {
        console.error('[ERROR] loopAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.loop.error'),
            error: error.message,
        });
    }
};

export default loopAction;
