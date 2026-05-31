import { Svg, Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
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

    // The Diamond D Path
    // Outer shape: A bold geometric D
    // Inner shape: A sharp diamond representing the "spark" of intellect
    const dShapePath =
        "M 15 15 H 55 C 80 15 95 30 95 50 C 95 70 80 85 55 85 H 15 V 15 Z";
    const diamondPath = "M 55 35 L 40 50 L 55 65 L 70 50 Z";

    // Icon only
    if (variant === "icon") {
        return (
            <Svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <Path
                    d={`${dShapePath} ${diamondPath}`}
                    fill={accentColor}
                    fillRule="evenodd"
                />
            </Svg>
        );
    }

    // Horizontal layout (icon + text side by side)
    if (variant === "horizontal") {
        return (
            <Svg
                width={size * 3.8}
                height={size}
                viewBox="0 0 380 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                {/* Icon */}
                <G transform="translate(10, 10) scale(0.8)">
                    <Path
                        d={`${dShapePath} ${diamondPath}`}
                        fill={accentColor}
                        fillRule="evenodd"
                    />
                </G>

                {/* Text */}
                <text
                    x="100"
                    y="62"
                    fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                    fontSize="42"
                    fontWeight="700"
                    fill={primaryColor}
                    letterSpacing="-1.5"
                >
                    dheeyudha
                </text>
            </Svg>
        );
    }

    // Stacked layout (icon above text)
    if (variant === "stacked") {
        return (
            <Svg
                width={size * 2}
                height={size * 1.6}
                viewBox="0 0 200 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                {/* Icon */}
                <G transform="translate(60, 0) scale(0.8)">
                    <Path
                        d={`${dShapePath} ${diamondPath}`}
                        fill={accentColor}
                        fillRule="evenodd"
                    />
                </G>

                {/* Text */}
                <text
                    x="100"
                    y="110"
                    fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                    fontSize="28"
                    fontWeight="700"
                    fill={primaryColor}
                    textAnchor="middle"
                    letterSpacing="-1"
                >
                    dheeyudha
                </text>
                <text
                    x="100"
                    y="135"
                    fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                    fontSize="9"
                    fontWeight="600"
                    fill={secondaryColor}
                    textAnchor="middle"
                    letterSpacing="2"
                >
                    WAR OF INTELLECT
                </text>
            </Svg>
        );
    }

    // Full logo with tagline (Default)
    return (
        <Svg
            width={size * 3.5}
            height={size * 1.2}
            viewBox="0 0 350 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Icon */}
            <G transform="translate(15, 20) scale(0.8)">
                <Path
                    d={`${dShapePath} ${diamondPath}`}
                    fill={accentColor}
                    fillRule="evenodd"
                />
            </G>

            {/* Main text */}
            <text
                x="105"
                y="65"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                fontSize="40"
                fontWeight="700"
                fill={primaryColor}
                letterSpacing="-1.2"
            >
                dheeyudha
            </text>

            {/* Tagline */}
            <text
                x="107"
                y="88"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                fontSize="10"
                fontWeight="600"
                fill={secondaryColor}
                letterSpacing="2.5"
            >
                WAR OF INTELLECT
            </text>
        </Svg>
    );
}

// Default export — backwards-compat with all existing usages:
//   <Logo width={28} height={28} />          → icon variant
//   <Logo width={90} height={90} showTagline={true} /> → stacked variant (auth pages)
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
        // Use height as the size base for stacked (icon+name+tagline)
        return <DheeyudhaLogo variant="stacked" size={(height ?? width ?? 90) * 0.5} className={className} />;
    }
    return <DheeyudhaLogo variant="icon" size={width ?? height ?? 28} className={className} />;
}