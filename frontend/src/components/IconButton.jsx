import React, { useState } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';

const IconButton = ({ className = "", iconClassName, onClick, status, size = 20 }) => {
  const [hoverBtn, setHoverBtn] = useState(false);

  const baseStyle = {
    display: 'flex',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    padding: '8px',
    color: 'inherit',
    transition: 'all 0.2s ease',
    transform: hoverBtn ? 'scale(1.1)' : 'scale(1)',
    position: 'relative'
  };

  const iconStyle = {
    fontSize: `${size}px`,
    color: hoverBtn ? '#002fff' : 'inherit'
  };

  if (status) {
    return (
      <div
        style={baseStyle}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        onClick={onClick}
        className={`justify-between ${className}`}
      >
        <i className={iconClassName} style={iconStyle} />
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: 'red',
          color: 'white',
          fontSize: '12px',
          borderRadius: '50%',
          minWidth: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          border: '2px solid white'
        }}>
          {status.count}
        </div>
      </div>
    );
  }

  return (
    <div
      style={baseStyle}
      onMouseEnter={() => setHoverBtn(true)}
      onMouseLeave={() => setHoverBtn(false)}
      onClick={onClick}
      className={className}
    >
      <i className={iconClassName} style={iconStyle} />
    </div>
  );
};

export default IconButton;
