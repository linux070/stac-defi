
const StacLogo = ({ darkMode, className = "" }) => (
  <svg viewBox="0 0 56 56" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect 
      width="56" 
      height="56" 
      rx="9" 
      className={`transition-colors duration-500 ${darkMode ? 'fill-[#0C0E1A]' : 'fill-[#6366F1]'}`}
    />
    <g>
      <rect x="6"  y="6"  width="20" height="20" rx="3" fill="#4F46E5"/>
      <rect x="30" y="6"  width="20" height="20" rx="3" fill="#818CF8"/>
      <rect x="6"  y="30" width="20" height="20" rx="3" fill="#818CF8"/>
      <rect x="30" y="30" width="20" height="20" rx="3" fill="#4338CA"/>
    </g>
  </svg>
);

export default StacLogo;
