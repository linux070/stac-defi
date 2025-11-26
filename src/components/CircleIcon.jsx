import React from 'react';

const CircleIcon = ({ size = 24, className = '', ...props }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={className}
      {...props}
    >
      {/* Circle background */}
      <circle cx="12" cy="12" r="10" fill="#1B4ADD" />
      
      {/* USD symbol */}
      <path 
        d="M12 4V20M9 7H13C14.1046 7 15 7.89543 15 9C15 10.1046 14.1046 11 13 11H9V13H13C14.1046 13 15 13.8954 15 15C15 16.1046 14.1046 17 13 17H9M10 5.5H11M10 18.5H11" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Outer ring to represent the circle brand */}
      <circle cx="12" cy="12" r="11" fill="none" stroke="#1B4ADD" strokeWidth="0.5" />
    </svg>
  );
};

export default CircleIcon;