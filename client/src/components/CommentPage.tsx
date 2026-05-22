import React, { useEffect, useState } from 'react';
import {
  Container,
  HeaderRow,
  PageTitle,
  ThemeToggle,
  TabsContainer,
  Tab,
  FiltersSection,
  FiltersSectionTitle,
  FiltersGrid,
  FilterItem,
  FilterLabel,
  FilterValue,
  CommentForm,
  FormActions,
  Input,
  Select,
  CommentTextArea,
  AddButton,
  AiRegenerateButton,
  AiSuggestionsContainer,
  AiSuggestionItem,
  CommentsList,
  CommentCard,
  CommentHeader,
  CommentUser,
  CommentDate,
  CommentText,
  EditButton,
  EmptyState,
  SuccessMessage,
  ErrorMessage,
  ChecklistContainer,
  ChecklistItem,
  PollContainer,
  PollOption,
  InteractiveCreator,
  AddOptionButton
} from './CommentPage.styled';

type CommentType = 'text' | 'checklist' | 'multiple_choice' | 'poll';

type Comment = {
  id?: string;
  user: string;
  comment: string;
  filter: string;
  timestamp?: string;
  type?: CommentType;
  options?: string[]; // for interactive elements
};

interface CommentPageProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const AI_SUGGESTIONS = [
  "This looks correct and aligns with our projections.",
  "I noticed a slight discrepancy here, could we verify?",
  "Great results this quarter. Let's maintain this momentum."
];

const API_BASE_URL = '/api/comment';

function CommentPage({ isDark, toggleTheme }: CommentPageProps) {
  const [activeTab, setActiveTab] = useState<'post' | 'view'>('post');
  const [user, setUser] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('text');
  const [interactiveOptions, setInteractiveOptions] = useState<string[]>(['']);
  
  // Adding some filler comments as requested
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'filler-1',
      user: 'Alice',
      comment: 'Please make sure to review the Q3 targets before the meeting.',
      filter: 'Page:Dashboard',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      type: 'text'
    },
    {
      id: 'filler-2',
      user: 'Bob',
      comment: 'Which of these metrics should we prioritize?',
      filter: 'Page:Dashboard',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      type: 'poll',
      options: ['Revenue Growth', 'Customer Retention', 'Net Promoter Score']
    }
  ]);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // Generic filters state
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Generate stable filter string from filter combination
  const getFilterString = () => {
    const keys = Object.keys(filters);
    if (keys.length === 0) return null;
    const sortedKeys = keys.sort();
    return sortedKeys.map(key => `${key}:${filters[key]}`).join(';');
  };

  const fetchComments = async (filterString: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}?filter=${encodeURIComponent(filterString)}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      // If data is empty and we have filler comments, let's just keep fillers for demonstration if the user wants
      if (data && data.length > 0) {
        setComments(data);
        localStorage.setItem(`comments_${filterString}`, JSON.stringify(data));
      }
    } catch (error) {
      const cached = localStorage.getItem(`comments_${filterString}`);
      if (cached) {
        setComments(JSON.parse(cached));
      }
    }
  };

  const handleSaveComment = async () => {
    if (!commentText.trim() || !user.trim()) {
      setErrorMessage('Please enter both user name and comment');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const filterString = getFilterString() || 'DefaultContext';
    
    // Filter out empty options if interactive
    const validOptions = commentType !== 'text' ? interactiveOptions.filter(o => o.trim() !== '') : [];

    const commentPayload: Comment = {
      id: editingCommentId || crypto.randomUUID(), // Assign ID if new
      user: user.trim(),
      comment: commentText.trim(),
      filter: filterString,
      timestamp: new Date().toISOString(),
      type: commentType,
      options: validOptions.length > 0 ? validOptions : undefined,
    };

    try {
      const method = editingCommentId ? 'PUT' : 'POST';
      const url = editingCommentId ? `${API_BASE_URL}/${editingCommentId}` : API_BASE_URL;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentPayload),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      setSuccessMessage(editingCommentId ? 'Comment updated successfully!' : 'Comment saved successfully!');
      resetForm();
      setActiveTab('view');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchComments(filterString);
    } catch (error) {
      // Fallback
      const storageKey = `comments_${filterString}`;
      let updatedComments = [...comments];
      
      if (editingCommentId) {
        updatedComments = updatedComments.map(c => c.id === editingCommentId ? commentPayload : c);
      } else {
        updatedComments.unshift(commentPayload); // Add new comment to top
      }
      
      localStorage.setItem(storageKey, JSON.stringify(updatedComments));
      setComments(updatedComments);
      setErrorMessage('API unavailable - saved locally');
      resetForm();
      setActiveTab('view');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const resetForm = () => {
    setCommentText('');
    setCommentType('text');
    setInteractiveOptions(['']);
    setEditingCommentId(null);
    setShowAiSuggestions(false);
  };

  const handleEditClick = (comment: Comment) => {
    setEditingCommentId(comment.id || null);
    setCommentText(comment.comment);
    setCommentType(comment.type || 'text');
    setInteractiveOptions(comment.options && comment.options.length > 0 ? comment.options : ['']);
    setActiveTab('post');
  };

  const handleInteractiveOptionChange = (index: number, value: string) => {
    const newOptions = [...interactiveOptions];
    newOptions[index] = value;
    setInteractiveOptions(newOptions);
  };

  const addInteractiveOption = () => {
    setInteractiveOptions([...interactiveOptions, '']);
  };

  useEffect(() => {
    const filterString = getFilterString();
    if (!filterString) return;
    fetchComments(filterString);
  }, [filters]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin === 'https://vodafone-company-q.eu10.hcs.cloud.sap') {
        const data = e.data;
        if (typeof data === 'string') {
          // Parse a string like "Username:John Doe;Region:EMEA;Year:2024"
          const parts = data.split(';');
          
          parts.forEach(part => {
            const separatorIndex = part.indexOf(':');
            if (separatorIndex !== -1) {
              const key = part.substring(0, separatorIndex).trim();
              const value = part.substring(separatorIndex + 1).trim();
              
              if (key && value) {
                if (key.toLowerCase() === 'username') {
                  setUser(value);
                } else {
                  setFilters(prev => ({ ...prev, [key]: value }));
                }
              }
            }
          });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const renderInteractiveContent = (comment: Comment) => {
    if (!comment.options || comment.options.length === 0) return null;

    if (comment.type === 'checklist') {
      return (
        <ChecklistContainer>
          {comment.options.map((opt, idx) => (
            <ChecklistItem key={idx}>
              <input type="checkbox" id={`${comment.id}-check-${idx}`} />
              <label htmlFor={`${comment.id}-check-${idx}`}>{opt}</label>
            </ChecklistItem>
          ))}
        </ChecklistContainer>
      );
    }
    
    if (comment.type === 'poll' || comment.type === 'multiple_choice') {
      return (
        <PollContainer>
          {comment.options.map((opt, idx) => (
            <PollOption key={idx}>
              <input 
                type={comment.type === 'poll' ? 'radio' : 'checkbox'} 
                name={`group-${comment.id}`} 
                id={`${comment.id}-opt-${idx}`} 
              />
              <label htmlFor={`${comment.id}-opt-${idx}`}>{opt}</label>
            </PollOption>
          ))}
        </PollContainer>
      );
    }
    return null;
  };

  return (
    <Container>
      <HeaderRow>
        <PageTitle>Comments</PageTitle>
        <ThemeToggle onClick={toggleTheme}>
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </ThemeToggle>
      </HeaderRow>

      <FiltersSection>
        <FiltersSectionTitle>Context</FiltersSectionTitle>
        <FiltersGrid>
          {Object.keys(filters).length === 0 ? (
            <div style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', gridColumn: '1 / -1' }}>
              Waiting for data from SAC...
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

      <TabsContainer>
        <Tab $active={activeTab === 'post'} onClick={() => setActiveTab('post')}>
          {editingCommentId ? 'Edit Comment' : 'Post Comment'}
        </Tab>
        <Tab $active={activeTab === 'view'} onClick={() => setActiveTab('view')}>
          View Comments ({comments.length})
        </Tab>
      </TabsContainer>

      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {activeTab === 'post' && (
        <CommentForm>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text)' }}>Name</label>
              <Input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Your name"
                aria-label="User name"
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text)' }}>Type</label>
              <Select value={commentType} onChange={(e) => setCommentType(e.target.value as CommentType)}>
                <option value="text">Text</option>
                <option value="checklist">Checklist</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="poll">Poll</option>
              </Select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text)' }}>Comment Description</label>
            <CommentTextArea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              aria-label="Comment text"
            />
          </div>

          {commentType !== 'text' && (
            <InteractiveCreator>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Options</label>
              {interactiveOptions.map((opt, idx) => (
                <Input 
                  key={idx}
                  value={opt}
                  onChange={(e) => handleInteractiveOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
              ))}
              <AddOptionButton type="button" onClick={addInteractiveOption}>
                + Add Option
              </AddOptionButton>
            </InteractiveCreator>
          )}

          <FormActions>
            <AddButton 
              onClick={handleSaveComment} 
              disabled={!commentText.trim() || !user.trim()} 
              type="button"
            >
              {editingCommentId ? 'Save Changes' : 'Add Comment'}
            </AddButton>
            
            <AiRegenerateButton 
              type="button" 
              onClick={() => setShowAiSuggestions(!showAiSuggestions)}
            >
              ✨ Regenerate with AI
            </AiRegenerateButton>
            
            {editingCommentId && (
              <button 
                type="button" 
                onClick={resetForm}
                style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                Cancel Edit
              </button>
            )}
          </FormActions>

          {showAiSuggestions && (
            <AiSuggestionsContainer>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>AI Suggestions:</div>
              {AI_SUGGESTIONS.map((suggestion, idx) => (
                <AiSuggestionItem 
                  key={idx} 
                  onClick={() => {
                    setCommentText(suggestion);
                    setShowAiSuggestions(false);
                  }}
                >
                  {suggestion}
                </AiSuggestionItem>
              ))}
            </AiSuggestionsContainer>
          )}
        </CommentForm>
      )}

      {activeTab === 'view' && (
        <CommentsList>
          {comments.length === 0 ? (
            <EmptyState>No comments yet for this context. Be the first to add one!</EmptyState>
          ) : (
            comments.map((comment) => (
              <CommentCard key={comment.id || comment.timestamp}>
                <CommentHeader>
                  <div>
                    <CommentUser>{comment.user}</CommentUser>
                    {comment.timestamp && (
                      <CommentDate style={{ marginLeft: '8px' }}>
                        {new Date(comment.timestamp).toLocaleString()}
                      </CommentDate>
                    )}
                  </div>
                  {comment.user === user && (
                    <EditButton onClick={() => handleEditClick(comment)}>
                      ✏️ Edit
                    </EditButton>
                  )}
                </CommentHeader>
                <CommentText>{comment.comment}</CommentText>
                {renderInteractiveContent(comment)}
              </CommentCard>
            ))
          )}
        </CommentsList>
      )}
    </Container>
  );
}

export default CommentPage;
