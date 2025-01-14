import React from 'react';
import clsx from 'clsx';
import BinIcon from '@resources/svg/bin.svg';
import Button from '~/cross-app-components/Button';
import { displayAsGTU } from '~/utils/gtu';
import { parseTime } from '~/utils/timeHelpers';
import { Schedule, TimeStampUnit } from '~/utils/types';
import styles from './ScheduleList.module.scss';

interface Props {
    schedule: Schedule;
    removeFromSchedule?: (index: number) => void;
    className?: string;
    elementClassName?: string;
    showIndex?: boolean;
}

export default function ScheduleList({
    schedule,
    removeFromSchedule,
    elementClassName,
    className,
    showIndex = true,
}: Props) {
    return (
        <div className={clsx(styles.scheduleList, className)}>
            {schedule.map((schedulePoint, index) => (
                <div
                    key={schedulePoint.timestamp + schedulePoint.amount}
                    className={clsx(styles.scheduleListRow, elementClassName)}
                >
                    <div>
                        {showIndex ?? `${index + 1}. `}
                        {parseTime(
                            schedulePoint.timestamp,
                            TimeStampUnit.milliSeconds
                        )}
                    </div>
                    <div>
                        {displayAsGTU(schedulePoint.amount)}{' '}
                        {removeFromSchedule ? (
                            <Button
                                clear
                                onClick={() => removeFromSchedule(index)}
                            >
                                <BinIcon className={styles.binIcon} />
                            </Button>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
}
