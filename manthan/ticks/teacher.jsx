const TeacherBadge = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="ml-1 inline-block text-green-500" 
  >
    {/* The Filled Circle */}
    <path 
      d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" 
      fill="currentColor"
    />
    {/* The Checkmark */}
    <path 
      d="M7.75 12.75L10.25 15.25L16.25 9.25" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default TeacherBadge;