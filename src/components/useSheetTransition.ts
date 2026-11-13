import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

const useSheetTransition = (visible: boolean, travelDistance = 48) => {
    const [mounted, setMounted] = useState(visible);
    const isMounted = useRef(visible);
    const [progress] = useState(() => new Animated.Value(0));

    const startOpening = useCallback(() => {
        progress.stopAnimation();
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [progress]);

    useEffect(() => {
        if (visible) {
            isMounted.current = true;
            progress.setValue(0);
        } else if (isMounted.current) {
            Animated.timing(progress, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (!finished) return;
                isMounted.current = false;
                setMounted(false);
            });
        }
        return () => {
            progress.stopAnimation();
        };
    }, [progress, visible]);

    return {
        mounted: visible || mounted,
        startOpening,
        backdropStyle: {
            opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
            }),
        },
        sheetStyle: {
            opacity: progress,
            transform: [
                {
                    translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [travelDistance, 0],
                    }),
                },
                {
                    scale: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.985, 1],
                    }),
                },
            ],
        },
    };
};

export default useSheetTransition;
