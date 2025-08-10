import React, { useState } from 'react';
import UrlForm from '../components/UrlForm';
import UrlResult from '../components/UrlResult';

// Home page component
function Home() {
  const [urlResult, setUrlResult] = useState(null);

  // Handle successful URL shortening
  const handleShortenSuccess = (result) => {
    setUrlResult(result);
  };

  return (
    <div>
      <UrlForm onShortenSuccess={handleShortenSuccess} />
      <UrlResult result={urlResult} />
    </div>
  );
}

export default Home;
