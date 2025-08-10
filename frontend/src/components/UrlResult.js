import React, { useState } from 'react';
import { Card, Button, InputGroup, FormControl } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Component to display shortened URL result
function UrlResult({ result }) {
  const [copied, setCopied] = useState(false);

  // Handle copy action
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000); // Reset copied state after 3 seconds
  };

  if (!result) return null;

  return (
    <div className="url-result">
      <h3>Your Shortened URL</h3>
      
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Original URL</Card.Title>
          <Card.Text className="text-muted truncate">
            {result.originalUrl}
          </Card.Text>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          <Card.Title>Shortened URL</Card.Title>
          <InputGroup className="mb-3">
            <FormControl
              value={result.shortUrl}
              readOnly
              aria-label="Shortened URL"
            />
            <CopyToClipboard text={result.shortUrl} onCopy={handleCopy}>
              <Button variant="outline-primary">
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </CopyToClipboard>
          </InputGroup>
          
          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              onClick={() => window.open(result.shortUrl, '_blank')}
            >
              Open URL
            </Button>
          </div>
        </Card.Body>
        <Card.Footer className="text-muted">
          Created: {new Date(result.createdAt).toLocaleString()}
        </Card.Footer>
      </Card>
    </div>
  );
}

export default UrlResult;
