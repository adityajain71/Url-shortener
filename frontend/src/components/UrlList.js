import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Spinner, Alert, Card, Modal } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import axios from 'axios';
import config from '../config';

// Component to display all URLs in admin view
function UrlList({ refreshStats }) {
  // State variables
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  // CRUD state variables
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch all URLs from the API
  useEffect(() => {
    fetchUrls();
  }, []);
  
  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/urls`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setUrls(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load URLs. Please try again later.');
      setLoading(false);
    }
  };

  // Handle copy action
  const handleCopy = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000); // Reset copied state after 3 seconds
  };
  
  // Edit URL functions
  const handleShowEditModal = (url) => {
    setCurrentUrl(url);
    setEditUrl(url.originalUrl);
    setActionError('');
    setShowEditModal(true);
  };
  
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentUrl(null);
    setEditUrl('');
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError('');
    
    try {
      const response = await axios.put(`${config.API_BASE_URL}/api/url/${currentUrl.id}`, {
        originalUrl: editUrl
      });
      
      if (response.data.success) {
        // Update the URLs list
        setUrls(prevUrls => 
          prevUrls.map(url => 
            url.id === currentUrl.id ? response.data : url
          )
        );
        handleCloseEditModal();
        if (refreshStats) refreshStats();
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete URL functions
  const handleShowDeleteModal = (url) => {
    setCurrentUrl(url);
    setActionError('');
    setShowDeleteModal(true);
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentUrl(null);
  };
  
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);
    setActionError('');
    
    try {
      const response = await axios.delete(`${config.API_BASE_URL}/api/url/${currentUrl.id}`);
      
      if (response.data.success) {
        // Remove the deleted URL from the list
        setUrls(prevUrls => prevUrls.filter(url => url.id !== currentUrl.id));
        handleCloseDeleteModal();
        if (refreshStats) refreshStats();
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort URLs based on the selected field and direction
  const sortedUrls = [...urls]
    .filter(url => {
      if (!search) return true;
      return (
        url.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
        url.shortCode.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'clicks':
          comparison = a.clicks - b.clicks;
          break;
        case 'originalUrl':
          comparison = a.originalUrl.localeCompare(b.originalUrl);
          break;
        case 'shortCode':
          comparison = a.shortCode.localeCompare(b.shortCode);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

  // Handle sort change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading URLs...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // Render empty state
  if (urls.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center">
          <Card.Title>No URLs Found</Card.Title>
          <Card.Text>
            No URLs have been shortened yet. Create your first short URL on the home page.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // Sort indicator arrow
  const getSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>All Shortened URLs</h3>
        <InputGroup className="w-50">
          <Form.Control
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button 
              variant="outline-secondary" 
              onClick={() => setSearch('')}
            >
              Clear
            </Button>
          )}
        </InputGroup>
      </div>

      <Table responsive hover>
        <thead>
          <tr>
            <th 
              className="clickable" 
              onClick={() => handleSort('shortCode')}
            >
              Short Code {getSortArrow('shortCode')}
            </th>
            <th 
              className="clickable" 
              onClick={() => handleSort('originalUrl')}
            >
              Original URL {getSortArrow('originalUrl')}
            </th>
            <th 
              className="clickable" 
              onClick={() => handleSort('clicks')}
            >
              Clicks {getSortArrow('clicks')}
            </th>
            <th 
              className="clickable" 
              onClick={() => handleSort('createdAt')}
            >
              Created At {getSortArrow('createdAt')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUrls.map((url) => (
            <tr key={url.id}>
              <td>{url.shortCode}</td>
              <td>
                <div className="truncate" title={url.originalUrl}>
                  {url.originalUrl}
                </div>
              </td>
              <td>{url.clicks}</td>
              <td>{new Date(url.createdAt).toLocaleString()}</td>
              <td>
                <div className="d-flex gap-1">
                  <CopyToClipboard text={url.shortUrl} onCopy={() => handleCopy(url.id)}>
                    <Button size="sm" variant="outline-primary">
                      <i className="bi bi-clipboard"></i>
                      {copiedId === url.id ? ' Copied!' : ' Copy'}
                    </Button>
                  </CopyToClipboard>
                  <Button 
                    size="sm" 
                    variant="outline-success"
                    onClick={() => window.open(url.shortUrl, '_blank')}
                  >
                    <i className="bi bi-box-arrow-up-right"></i> Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => handleShowEditModal(url)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleShowDeleteModal(url)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {/* Edit URL Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit URL</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Short URL</Form.Label>
              <Form.Control
                type="text"
                value={currentUrl?.shortUrl || ''}
                readOnly
                disabled
              />
              <Form.Text className="text-muted">
                The short URL cannot be changed.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Original URL</Form.Label>
              <Form.Control
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                required
                placeholder="https://example.com"
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete URL Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete URL</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          <p>Are you sure you want to delete this shortened URL?</p>
          <p><strong>Original URL:</strong> {currentUrl?.originalUrl}</p>
          <p><strong>Short URL:</strong> {currentUrl?.shortUrl}</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              'Delete URL'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UrlList;
