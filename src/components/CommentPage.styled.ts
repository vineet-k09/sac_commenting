import styled from 'styled-components';

export const Container = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

export const FiltersSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;

  @media (prefers-color-scheme: dark) {
    border-color: #2a2a2a;
    background: #151515;
  }
`;

export const FiltersSectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #0b0c0d;

  @media (prefers-color-scheme: dark) {
    color: #f5f5f5;
  }
`;

export const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

export const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (prefers-color-scheme: dark) {
    color: #b3b3b3;
  }
`;

export const FilterValue = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #0b0c0d;
  font-size: 14px;
  font-weight: 500;

  @media (prefers-color-scheme: dark) {
    border-color: #2a2a2a;
    background: #1a1a1a;
    color: #f5f5f5;
  }
`;

export const PageTitle = styled.h1`
  margin: 0 0 24px;
  font-size: 28px;
  font-weight: 600;
  color: #0b0c0d;

  @media (prefers-color-scheme: dark) {
    color: #f5f5f5;
  }
`;

export const CommentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
`;

export const Input = styled.input`
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #0b0c0d;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;

  &:focus {
    outline: 2px solid #00b0ca;
    outline-offset: 2px;
  }

  &::placeholder {
    color: #999;
    opacity: 0.8;
  }

  @media (prefers-color-scheme: dark) {
    border-color: #2a2a2a;
    background: #1a1a1a;
    color: #f5f5f5;

    &::placeholder {
      color: #666;
    }
  }
`;

export const CommentTextArea = styled.textarea`
  min-height: 120px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #0b0c0d;
  font-size: 14px;
  line-height: 1.5;
  font-family: system-ui, -apple-system, sans-serif;
  resize: vertical;

  &:focus {
    outline: 2px solid #00b0ca;
    outline-offset: 2px;
  }

  &::placeholder {
    color: #999;
    opacity: 0.8;
  }

  @media (prefers-color-scheme: dark) {
    border-color: #2a2a2a;
    background: #1a1a1a;
    color: #f5f5f5;

    &::placeholder {
      color: #666;
    }
  }
`;

export const AddButton = styled.button`
  align-self: flex-start;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #00b0ca;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease;

  &:hover:not(:disabled) {
    background: #5c68b2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid #00b0ca;
    outline-offset: 2px;
  }
`;

export const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const CommentCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  box-shadow: 0 2px 8px -4px rgba(0, 0, 0, 0.15);

  @media (prefers-color-scheme: dark) {
    border-color: #2a2a2a;
    background: #111111;
    box-shadow: 0 2px 8px -4px rgba(0, 0, 0, 0.4);
  }
`;

export const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const CommentUser = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #00b0ca;

  @media (prefers-color-scheme: dark) {
    color: #00b0ca;
  }
`;

export const CommentDate = styled.span`
  font-size: 12px;
  color: #999;

  @media (prefers-color-scheme: dark) {
    color: #b3b3b3;
  }
`;

export const CommentText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #2f3133;
  white-space: pre-wrap;
  word-break: break-word;

  @media (prefers-color-scheme: dark) {
    color: #b3b3b3;
  }
`;

export const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-radius: 12px;
  border: 1px dashed #e0e0e0;
  background: #f9f9f9;

  @media (prefers-color-scheme: dark) {
    color: #666;
    border-color: #2a2a2a;
    background: #0b0b0b;
  }
`;

export const SuccessMessage = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  font-size: 14px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-color-scheme: dark) {
    background: #1e4620;
    border-color: #2d5f30;
    color: #7ec985;
  }
`;

export const ErrorMessage = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  font-size: 14px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease;

  @media (prefers-color-scheme: dark) {
    background: #4a1f23;
    border-color: #5c2329;
    color: #ea868f;
  }
`;
