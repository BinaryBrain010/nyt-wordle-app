import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function Confetti() {
    const particles = useRef(
        Array.from({ length: 80 }, () => ({
            x: new Animated.Value(Math.random() * 400 - 200),
            y: new Animated.Value(-20),
            opacity: new Animated.Value(1),
            rotate: new Animated.Value(0),
            color: ['#6AAA64', '#E8A317', '#121213', '#D3D6DA'][Math.floor(Math.random() * 4)],
            delay: Math.random() * 400,
            duration: 2000 + Math.random() * 1000
        }))
    ).current;

    useEffect(() => {
        const animations = particles.map((p) =>
            Animated.parallel([
                Animated.timing(p.y, {
                    toValue: 800,
                    duration: p.duration,
                    useNativeDriver: true,
                    delay: p.delay
                }),
                Animated.timing(p.opacity, {
                    toValue: 0,
                    duration: p.duration,
                    useNativeDriver: true,
                    delay: p.delay + p.duration * 0.6
                }),
                Animated.timing(p.rotate, {
                    toValue: 1,
                    duration: p.duration,
                    useNativeDriver: true,
                    delay: p.delay
                })
            ])
        );
        Animated.stagger(30, animations).start();
    }, [particles]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.confettiPiece,
                        {
                            backgroundColor: p.color,
                            left: '50%',
                            marginLeft: -4,
                            transform: [
                                { translateX: p.x },
                                { translateY: p.y },
                                {
                                    rotate: p.rotate.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg']
                                    })
                                }
                            ],
                            opacity: p.opacity
                        }
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    confettiPiece: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 1,
        top: 0
    }
});
