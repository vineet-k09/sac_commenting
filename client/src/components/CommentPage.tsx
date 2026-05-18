import React, { useEffect, useState } from 'react';
import {
  Container,
  PageTitle,
  FiltersSection,
  FiltersSectionTitle,
  FiltersGrid,
  FilterItem,
  FilterLabel,
  FilterValue,
  CommentForm,
  Input,
  CommentTextArea,
  AddButton,
  CommentsList,
  CommentCard,
  CommentHeader,
  CommentUser,
  CommentDate,
  CommentText,
  EmptyState,
  SuccessMessage,
  ErrorMessage,
} from './CommentPage.styled';

type Comment = {
  user: string;
  comment: string;
  filter: string;
  timestamp?: string;
};

const API_BASE_URL = '/api/comment';
const API_BASE_URL2 = '/api/getAll';

function CommentPage() {
  const [user, setUser] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Generic filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    "apple": "red",
    "banana": "yellow"
  }); // dummy filter for demo

  // Generate stable filter string from filter combination
  const getFilterString = () => {
    const keys = Object.keys(filters);
    if (keys.length === 0) return null;
    
    // Sort keys to ensure the string is deterministic regardless of message order
    const sortedKeys = keys.sort();
    
    return sortedKeys.map(key => `${key}:${filters[key]}`).join(';');
  };

  // Fetch comments from API
  const fetchComments = async (filterString: string) => {
    try {
      const response = await fetch(`${API_BASE_URL2}`);
      // const response = await fetch(`${API_BASE_URL}?filter=${encodeURIComponent(filterString)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data);
      
      console.log('📥 Fetched comments:', data);
      
      // Cache in localStorage
      localStorage.setItem(`comments_${filterString}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem(`comments_${filterString}`);
      if (cached) {
        const cachedComments = JSON.parse(cached);
        setComments(cachedComments);
        console.log('📦 Loaded from localStorage:', cachedComments);
      }
    }
  };

  // Save comment to API
  const handleAddComment = async () => {
    if (!commentText.trim() || !user.trim()) {
      setErrorMessage('Please enter both user name and comment');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const filterString = getFilterString();
    if (!filterString) {
      setErrorMessage('Please ensure all filters are selected');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const newComment: Comment = {
      user: user.trim(),
      comment: commentText.trim(),
      filter: filterString,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComment),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment');
      }

      const savedComment = await response.json();
      
      console.log('✅ Comment saved successfully:', savedComment);
      console.log('📤 Payload:', newComment);

      setSuccessMessage('Comment saved successfully!');
      setCommentText('');
      
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh comments
      await fetchComments(filterString);
    } catch (error) {
      console.error('Error saving comment:', error);
      
      // Fallback to localStorage
      const storageKey = `comments_${filterString}`;
      const existingComments = localStorage.getItem(storageKey);
      const updatedComments = existingComments 
        ? [...JSON.parse(existingComments), newComment]
        : [newComment];
      
      localStorage.setItem(storageKey, JSON.stringify(updatedComments));
      setComments(updatedComments);
      
      console.log('💾 Saved to localStorage (API unavailable):', newComment);
      
      setErrorMessage('API unavailable - saved locally');
      setCommentText('');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Load comments when filters change
  const filterString = getFilterString();
  
  useEffect(() => {
    if (!filterString) {
      setComments([]);
      return;
    }

    fetchComments(filterString);
  }, [filterString]);

  // Listen for SAC postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      console.log('📨 Message received from SAC:', e.data);
      console.log('Origin:', e.origin);
      
      if (e.origin === 'https://vodafone-company-q.eu10.hcs.cloud.sap') {
        const data = e.data;
        // SAC messages are assumed to be "Key:Value"
        const separatorIndex = data.indexOf(':');
        if (separatorIndex !== -1) {
          const key = data.substring(0, separatorIndex).trim();
          const value = data.substring(separatorIndex + 1).trim();
          
          if (key && value) {
            setFilters(prev => ({ ...prev, [key]: value }));
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <Container>
      <PageTitle>Comments</PageTitle>

      <FiltersSection>
        <FiltersSectionTitle>Selected Filters</FiltersSectionTitle>
        <FiltersGrid>
          {Object.keys(filters).length === 0 ? (
            <div style={{ color: '#999', fontSize: '14px', fontStyle: 'italic', gridColumn: '1 / -1' }}>
              Waiting for filters from SAC...
            </div>
          ) : (
            Object.entries(filters).map(([key, value]) => (
              <FilterItem key={key}>
                <FilterLabel>{key.replace(/_/g, ' ')}</FilterLabel>
                <FilterValue>{value}</FilterValue>
              </FilterItem>
            ))
          )}
        </FiltersGrid>
      </FiltersSection>

      <CommentForm>
        <Input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Your name"
          aria-label="User name"
        />
        <CommentTextArea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your comment here... (Ctrl+Enter to submit)"
          aria-label="Comment text"
        />
        <AddButton 
          onClick={handleAddComment} 
          disabled={!commentText.trim() || !user.trim()} 
          type="button"
        >
          Add Comment
        </AddButton>
      </CommentForm>

      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      <CommentsList>
        {comments.length === 0 ? (
          <EmptyState>No comments yet. Be the first to add one!</EmptyState>
        ) : (
          comments.map((comment, index) => (
            <CommentCard key={index}>
              <CommentHeader>
                <CommentUser>{comment.user}</CommentUser>
                {comment.timestamp && (
                  <CommentDate>
                    {new Date(comment.timestamp).toLocaleString()}
                  </CommentDate>
                )}
              </CommentHeader>
              <CommentText>{comment.comment}</CommentText>
            </CommentCard>
          ))
        )}
      </CommentsList>
    </Container>
  );
}

export default CommentPage;
