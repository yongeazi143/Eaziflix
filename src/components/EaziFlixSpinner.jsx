const EaziFlixSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="text-3xl font-bold text-white">
        <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>E</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>a</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>z</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>i</span>
        <span className="inline-block animate-bounce text-gradient" style={{ animationDelay: '0.4s' }}>F</span>
        <span className="inline-block animate-bounce text-gradient" style={{ animationDelay: '0.5s' }}>l</span>
        <span className="inline-block animate-bounce text-gradient" style={{ animationDelay: '0.6s' }}>i</span>
        <span className="inline-block animate-bounce text-gradient" style={{ animationDelay: '0.7s' }}>x</span>
      </div>
    </div>
  );
};

export default EaziFlixSpinner;