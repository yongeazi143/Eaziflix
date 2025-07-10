const Backdrop = ({ onClick, children, className = '', visible = true }) => {
  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 cursor-pointer backdrop-blur-sm z-40 transition-all duration-300 ${
          visible
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Backdrop;