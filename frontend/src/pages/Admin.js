import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import UrlList from '../components/UrlList';
import axios from 'axios';

// Admin page component with dashboard
function Admin() {
  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    mostClickedUrl: null,
    recentUrls: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/stats');
        setStats(response.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <div className="admin-dashboard">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} sm={6} xs={6} className="mb-3">
          <Card className="stats-card stats-card-primary h-100">
            <Card.Body>
              <div className="stats-number">{stats.totalUrls}</div>
              <div className="stats-label">Total URLs</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} sm={6} xs={6} className="mb-3">
          <Card className="stats-card stats-card-success h-100">
            <Card.Body>
              <div className="stats-number">{stats.totalClicks}</div>
              <div className="stats-label">Total Clicks</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} sm={6} xs={6} className="mb-3">
          <Card className="stats-card stats-card-warning h-100">
            <Card.Body>
              <div className="stats-number">{stats.recentUrls}</div>
              <div className="stats-label">Last 24 Hours</div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="stats-card stats-card-danger h-100">
            <Card.Body>
              <div className="stats-number">
                {stats.mostClickedUrl ? stats.mostClickedUrl.clicks : 0}
              </div>
              <div className="stats-label">Most Clicked</div>
              {stats.mostClickedUrl && (
                <small className="text-muted truncate d-block mt-2">
                  {stats.mostClickedUrl.shortCode}
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* URL List with CRUD functionality */}
      <UrlList refreshStats={() => {
        setLoading(true);
        const fetchStats = async () => {
          try {
            const response = await axios.get('/api/stats');
            
            setStats(response.data);
            
            setLoading(false);
          } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
          }
        };
        
        fetchStats();
      }} />
    </div>
  );
}

export default Admin;
