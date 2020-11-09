import {useState, useEffect} from 'react';

export default function useDebouncedEffect(
    timeout: number,
    callback: React.EffectCallback,
    dependencies: React.DependencyList
) {
    const [previousTimestamp, setPreviousTimestamp] = useState(0);

    return useEffect(() => {
        const currentTimestamp = Date.now();

        if (previousTimestamp + timeout < currentTimestamp) {
            setPreviousTimestamp(currentTimestamp);
            callback();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies, timeout, previousTimestamp, callback]);
}
