import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
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
    <Container className="py-5">
      <Row className="justify-content-center mb-4">
        <Col xs={12} className="text-center">
          <h1 className="display-4 mb-3">URL Shortener</h1>
          <p className="lead text-muted">Make your long URLs short and easy to share</p>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8} xl={6}>
          <UrlForm onShortenSuccess={handleShortenSuccess} />
          {urlResult && <UrlResult result={urlResult} />}
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
