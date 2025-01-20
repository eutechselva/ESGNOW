import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatNumber, roundOffValue } from '@utils';
import classNames from 'classnames';
import React from 'react'
import './Deviation.scss'
import { toNum } from 'uxp/components';

interface DeviationProps {
    value: number;
    baseline?: number;
    showPercentage?: boolean,
    showPercentageOnly?: boolean,
    unit?: string,
}

export const Deviation: React.FC<DeviationProps> = ({ value, baseline = 0, showPercentage = true, showPercentageOnly = false, unit }) => {
    const isAboveBaseline = value > baseline;
    // const rounded = toNum(roundOffValue(value - baseline, { decimalPoints: 5 }), 0)
    const rounded = formatNumber((value - baseline), 0, unit)
    const percentage = toNum(roundOffValue(((value - baseline) / baseline) * 100, { decimalPoints: 1 }), 0)

    return (
        <div title={`${value} vs ${baseline}`} className={classNames('ums_deviation__container', { 'ums_deviation__container--above': isAboveBaseline })}>
            <div className='ums_deviation__icon'>
                <FontAwesomeIcon
                    icon={['fas', isAboveBaseline ? 'arrow-up' : 'arrow-down']}
                />
            </div>

            <div className="ums_deviation__value">
                {
                    showPercentageOnly
                        ? `${percentage}%`
                        : `${rounded}  ${showPercentage ? '(' + percentage + '%)' : ''}`
                }
            </div>

        </div>
    );
};