export const Button = ({ children, onClick, variant = 'primary' }) => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700',
      secondary: 'bg-gray-600 hover:bg-gray-700',
      danger: 'bg-red-600 hover:bg-red-700'
    }
    
    return (
      <button
        onClick={onClick}
        className={`${variants[variant]} text-white py-2 px-4 rounded-md transition-colors`}
      >
        {children}
      </button>
    )
  }