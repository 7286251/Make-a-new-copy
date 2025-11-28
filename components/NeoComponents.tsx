import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'black';
  size?: 'sm' | 'md' | 'lg';
}

export const NeoButton: React.FC<NeoButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyle = "font-bold border-2 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-neo-yellow text-black shadow-neo hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg",
    secondary: "bg-white text-black shadow-neo hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg",
    black: "bg-black text-white shadow-neo hover:bg-gray-800 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-lg",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const NeoBadge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-white' }) => (
  <span className={`${color} border-2 border-black px-2 py-0.5 text-xs font-bold shadow-neo-sm text-black flex items-center`}>
    {children}
  </span>
);

export const NeoCard: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border-2 border-black shadow-neo p-0 overflow-hidden transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg cursor-pointer ${className}`}
  >
    {children}
  </div>
);