import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

// Component for URL submission form
function UrlForm({ onShortenSuccess }) {
  // State variables
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  // Basic URL validation using regex
  const validateUrl = (url) => {
    const pattern = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;
    return pattern.test(url);
  };

  // Handle input change
  const handleChange = (e) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    
    // Only validate if there's actual input
    if (inputUrl) {
      setIsValidUrl(validateUrl(inputUrl));
    } else {
      setIsValidUrl(true); // Reset validation when input is empty
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL before submission
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Ensure URL has http:// or https:// prefix
      let urlToShorten = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToShorten = `https://${url}`;
      }
      
      // Make API request to shorten URL
      const response = await axios.post('/api/shorten', {
        originalUrl: urlToShorten
      });
      
      // Handle successful response
      if (response.data && response.data.success) {
        onShortenSuccess(response.data);
        setUrl('');
      }
    } catch (err) {
      // Handle error response
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="url-form">
      <h2>Shorten Your URL</h2>
      <p>Enter a long URL to create a short, easy-to-share link.</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formUrl">
          <Form.Control
            type="text"
            placeholder="Enter URL (e.g., https://example.com/long-url)"
            value={url}
            onChange={handleChange}
            isInvalid={!isValidUrl && url.length > 0}
            className="rounded-pill"
          />
          {!isValidUrl && url.length > 0 && (
            <Form.Control.Feedback type="invalid">
              Please enter a valid URL
            </Form.Control.Feedback>
          )}
        </Form.Group>
        
        <Button 
          variant="primary" 
          type="submit" 
          disabled={isLoading || (url.length > 0 && !isValidUrl)}
          className="rounded-pill"
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Shortening...</span>
            </>
          ) : (
            'Shorten URL'
          )}
        </Button>
      </Form>
    </div>
  );
}

export default UrlForm;
