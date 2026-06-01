import React from 'react';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { View } from 'react-native';

interface LogoProps {
    variant?: "full" | "icon" | "horizontal" | "stacked";
    theme?: "light" | "dark";
    size?: number;
    className?: string;
}

export function DheeyudhaLogo({
    variant = "full",
    theme = "light",
    size = 200,
    className = "",
}: LogoProps) {
    const primaryColor = theme === "dark" ? "#ffffff" : "#1a1a1a";
    const secondaryColor =
        theme === "dark" ? "#a3a3a3" : "#737373";
    const accentColor = theme === "dark" ? "#3b82f6" : "#2563eb";

    const dShapePath =
        "M 15 15 H 55 C 80 15 95 30 95 50 C 95 70 80 85 55 85 H 15 V 15 Z";
    const diamondPath = "M 55 35 L 40 50 L 55 65 L 70 50 Z";

    if (variant === "icon") {
        return (
            <View className={className}>
                <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
                    <Path
                        d={`${dShapePath} ${diamondPath}`}
                        fill={accentColor}
                        fillRule="evenodd"
                    />
                </Svg>
            </View>
        );
    }

    if (variant === "horizontal") {
        return (
            <View className={className}>
                <Svg width={size * 3.8} height={size} viewBox="0 0 380 100" fill="none">
                    <G transform="translate(10, 10) scale(0.8)">
                        <Path
                            d={`${dShapePath} ${diamondPath}`}
                            fill={accentColor}
                            fillRule="evenodd"
                        />
                    </G>
                    <SvgText
                        x="100"
                        y="62"
                        fontFamily="System"
                        fontSize="42"
                        fontWeight="700"
                        fill={primaryColor}
                        letterSpacing="-1.5"
                    >
                        dheeyudha
                    </SvgText>
                </Svg>
            </View>
        );
    }

    if (variant === "stacked") {
        return (
            <View className={className}>
                <Svg width={size * 2} height={size * 1.6} viewBox="0 0 200 160" fill="none">
                    <G transform="translate(60, 0) scale(0.8)">
                        <Path
                            d={`${dShapePath} ${diamondPath}`}
                            fill={accentColor}
                            fillRule="evenodd"
                        />
                    </G>
                    <SvgText
                        x="100"
                        y="110"
                        fontFamily="System"
                        fontSize="28"
                        fontWeight="700"
                        fill={primaryColor}
                        textAnchor="middle"
                        letterSpacing="-1"
                    >
                        dheeyudha
                    </SvgText>
                    <SvgText
                        x="100"
                        y="135"
                        fontFamily="System"
                        fontSize="9"
                        fontWeight="600"
                        fill={secondaryColor}
                        textAnchor="middle"
                        letterSpacing="2"
                    >
                        WAR OF INTELLECT
                    </SvgText>
                </Svg>
            </View>
        );
    }

    return (
        <View className={className}>
            <Svg width={size * 3.5} height={size * 1.2} viewBox="0 0 350 120" fill="none">
                <G transform="translate(15, 20) scale(0.8)">
                    <Path
                        d={`${dShapePath} ${diamondPath}`}
                        fill={accentColor}
                        fillRule="evenodd"
                    />
                </G>
                <SvgText
                    x="105"
                    y="65"
                    fontFamily="System"
                    fontSize="40"
                    fontWeight="700"
                    fill={primaryColor}
                    letterSpacing="-1.2"
                >
                    dheeyudha
                </SvgText>
                <SvgText
                    x="107"
                    y="88"
                    fontFamily="System"
                    fontSize="10"
                    fontWeight="600"
                    fill={secondaryColor}
                    letterSpacing="2.5"
                >
                    WAR OF INTELLECT
                </SvgText>
            </Svg>
        </View>
    );
}

export default function Logo({
    width,
    height,
    showTagline = false,
    className,
}: {
    width?: number;
    height?: number;
    showTagline?: boolean;
    className?: string;
}) {
    if (showTagline) {
        return <DheeyudhaLogo variant="stacked" size={(height ?? width ?? 90) * 0.5} className={className} />;
    }
    return <DheeyudhaLogo variant="icon" size={width ?? height ?? 28} className={className} />;
}
