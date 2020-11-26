import React, {useEffect, useState} from 'react';

interface ObscuredProperties {
    untilTimestamp?: number;
    by?: React.ReactNode;
    children: React.ReactNode;
    onReveal?: () => void;
}

const Obscured = ({
    untilTimestamp,
    by,
    children,
    onReveal
}: ObscuredProperties) => {
    const [isVisible, setIsVisible] = useState(() => {
        const currentTimestamp = Date.now();

        if (untilTimestamp && currentTimestamp < untilTimestamp) {
            return false;
        }

        return true;
    });

    useEffect(() => {
        const currentTimestamp = Date.now();

        if (untilTimestamp && currentTimestamp < untilTimestamp) {
            const timeout = setTimeout(() => {
                setIsVisible(true);
            }, untilTimestamp - currentTimestamp);

            return () => {
                clearTimeout(timeout);
            };
        }

        setIsVisible(true);
        return undefined;
    }, [untilTimestamp]);

    useEffect(() => {
        if (isVisible && onReveal) {
            onReveal();
        }
    }, [isVisible, onReveal]);

    if (isVisible) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{children}</>;
    }

    if (by) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{by}</>;
    }

    return null;
};

export default Obscured;
