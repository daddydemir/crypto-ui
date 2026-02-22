/* eslint-disable @typescript-eslint/no-explicit-any */

export const validateNodeConfig = (blockType: string, config: any): Record<string, string> => {
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
        if (!config.symbol) errors.symbol = 'Sembol gerekli';
    }

    // Validation logic based on block type
    switch (blockType) {
        case 'price_condition':
            if (config.price === undefined || config.price === '' || isNaN(config.price)) {
                errors.price = 'Fiyat gerekli';
            } else if (config.price < 0) {
                errors.price = 'Fiyat pozitif olmalı';
            }
            break;
        case 'relative_strength_index':
            if (!config.index) {
                errors.index = 'RSI periyodu gerekli';
            } else if (config.index < 1 || config.index > 99) {
                errors.index = 'Aralık: 1-99';
            }
            break;
        case 'moving_average':
        case 'exponential_moving_average':
            if (!config.comparisons || !Array.isArray(config.comparisons) || config.comparisons.length === 0) {
                errors.comparisons = 'En az bir karşılaştırma gerekli';
            } else {
                const hasInvalid = config.comparisons.some((c: any) => !c.left || !c.right);
                if (hasInvalid) {
                    errors.comparisons = 'Tüm alanları doldurun';
                }
            }
            break;
        case 'bollinger_bands_analysis':
        case 'donchian_channel_analysis':
            const hasComparisons = config.comparisons && Array.isArray(config.comparisons) && config.comparisons.length > 0;
            const hasBandwidth = config.bandwidth !== undefined && config.bandwidth !== '' && !isNaN(config.bandwidth);

            if (!hasComparisons && !hasBandwidth) {
                errors.comparisons = 'Karşılaştırma veya Bandwidth gerekli';
                errors.bandwidth = ' ';
            } else {
                if (hasComparisons) {
                    const hasInvalid = config.comparisons.some((c: any) => !c.left || !c.right);
                    if (hasInvalid) errors.comparisons = 'Tüm alanları doldurun';
                }
                if (hasBandwidth && config.bandwidth < 0) {
                    errors.bandwidth = 'Pozitif olmalı';
                }
            }
            break;
        case 'notification':
            if (!config.channel) errors.channel = 'Kanal gerekli';
            if (!config.target) errors.target = 'Hedef gerekli';
            if (!config.message) errors.message = 'Mesaj gerekli';
            break;
    }

    return errors;
};
