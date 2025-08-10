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
    <Container>
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <UrlForm onShortenSuccess={handleShortenSuccess} />
          <UrlResult result={urlResult} />
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
