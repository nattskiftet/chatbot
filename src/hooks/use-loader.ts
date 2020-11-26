import {useRef, useCallback, useState, useMemo} from 'react';

export default function useLoader() {
    const [loaders, setLoaders] = useState<number[]>([]);
    const isLoading = useMemo<boolean>(() => loaders.length !== 0, [
        loaders.length
    ]);

    const iteration = useRef<number>(0);
    const createLoader = useCallback(() => {
        iteration.current += 1;
        const currentIteration = iteration.current;

        setLoaders((previousState) => previousState.concat(currentIteration));

        return () => {
            return setLoaders((previousState) => {
                previousState.splice(
                    previousState.indexOf(currentIteration),
                    1
                );

                return previousState.slice();
            });
        };
    }, [iteration]);

    return [isLoading, createLoader] as const;
}
