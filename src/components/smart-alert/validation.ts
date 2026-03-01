/* eslint-disable @typescript-eslint/no-explicit-any */

export const validateNodeConfig = (blockType: string, config: any, t: (key: string) => string): Record<string, string> => {
    const errors: Record<string, string> = {};

    // All analysis types require a symbol
    const analysisTypes = [
        'price_condition',
        'relative_strength_index',
        'moving_average',
        'exponential_moving_average',
        'bollinger_bands_analysis',
        'donchian_channel_analysis'
    ];

    if (analysisTypes.includes(blockType)) {
        if (!config.symbol) errors.symbol = t('smartAlert.validation.symbolRequired');
    }

    // Validation logic based on block type
    switch (blockType) {
        case 'price_condition':
            if (config.price === undefined || config.price === '' || isNaN(config.price)) {
                errors.price = t('smartAlert.validation.priceRequired');
            } else if (config.price < 0) {
                errors.price = t('smartAlert.validation.pricePositive');
            }
            break;
        case 'relative_strength_index':
            if (!config.index) {
                errors.index = t('smartAlert.validation.rsiPeriodRequired');
            } else if (config.index < 1 || config.index > 99) {
                errors.index = t('smartAlert.validation.rsiRange');
            }
            break;
        case 'moving_average':
        case 'exponential_moving_average':
            if (!config.comparisons || !Array.isArray(config.comparisons) || config.comparisons.length === 0) {
                errors.comparisons = t('smartAlert.validation.atLeastOneComparison');
            } else {
                const hasInvalid = config.comparisons.some((c: any) => !c.left || !c.right);
                if (hasInvalid) {
                    errors.comparisons = t('smartAlert.validation.fillAllFields');
                }
            }
            break;
        case 'bollinger_bands_analysis':
        case 'donchian_channel_analysis':
            const hasComparisons = config.comparisons && Array.isArray(config.comparisons) && config.comparisons.length > 0;
            const hasBandwidth = config.bandwidth !== undefined && config.bandwidth !== '' && !isNaN(config.bandwidth);

            if (!hasComparisons && !hasBandwidth) {
                errors.comparisons = t('smartAlert.validation.comparisonOrBandwidthRequired');
                errors.bandwidth = ' ';
            } else {
                if (hasComparisons) {
                    const hasInvalid = config.comparisons.some((c: any) => !c.left || !c.right);
                    if (hasInvalid) errors.comparisons = t('smartAlert.validation.fillAllFields');
                }
                if (hasBandwidth && config.bandwidth < 0) {
                    errors.bandwidth = t('smartAlert.validation.positiveRequired');
                }
            }
            break;
        case 'notification':
            if (!config.channel) errors.channel = t('smartAlert.validation.channelRequired');
            if (!config.target) errors.target = t('smartAlert.validation.targetRequired');
            if (!config.message) errors.message = t('smartAlert.validation.messageRequired');
            break;
    }

    return errors;
};
