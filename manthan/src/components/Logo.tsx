import React from 'react';

/**
 * LogoProps interface defines the props for the Logo component
 */
interface LogoProps {
  /** Width of the logo in pixels (default: 200) */
  width?: number;
  /** Height of the logo in pixels (default: 200) */
  height?: number;
}

/**
 * Logo component displays the Manthan custom shield-shaped logo
 * with circuit board design elements.
 * 
 * @param {LogoProps} props - Component props
 * @returns {JSX.Element} SVG logo element
 */
const Logo: React.FC<LogoProps> = ({ width = 200, height = 200 }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 185C60 165 25 125 25 75V40L100 20L175 40V75C175 125 140 165 100 185Z" fill="#F0F9FF" stroke="#0F172A" strokeWidth="4" strokeLinejoin="round"/>
      
      <path d="M60 55V145" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
      <path d="M45 60V135" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
      
      <path d="M140 60V140" stroke="#E2E8F0" strokeWidth="2"/>
      <circle cx="140" cy="60" r="2" fill="#3B82F6"/>
      <circle cx="140" cy="100" r="2" fill="#3B82F6"/>
      <circle cx="140" cy="140" r="2" fill="#3B82F6"/>

      <circle cx="100" cy="100" r="30" stroke="#0F172A" strokeWidth="4" strokeDasharray="8 4"/>
      
      <path d="M85 95V115L100 105L115 115V95" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>

      <path d="M145 45L155 55" stroke="#0F172A" strokeWidth="4" strokeLinecap="round"/>
      <rect x="138" y="42" width="10" height="20" transform="rotate(45 138 42)" fill="#10B981" stroke="#0F172A" strokeWidth="2"/>
      <path d="M142 58L58 142" stroke="#0F172A" strokeWidth="4"/>
      <path d="M58 142L50 150L66 142L58 142Z" fill="#10B981"/>
    </svg>
  );
};

export default Logo;
