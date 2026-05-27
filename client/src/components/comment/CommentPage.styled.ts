import styled from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    bg: string;
    cardBg: string;
    inputBg: string;
    border: string;
    text: string;
    textSecondary: string;
    textTitle: string;
    primary: string;
    toggleBg: string;
    toggleText: string;
    successBg: string;
    successBorder: string;
    successText: string;
    errorBg: string;
    errorBorder: string;
    errorText: string;
  }
}

export const Container = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  transition: all 0.3s ease;
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.textTitle};
`;

export const ThemeToggle = styled.button`
  background: ${({ theme }) => theme.toggleBg};
  color: ${({ theme }) => theme.toggleText};
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  border-bottom: 2px solid ${({ theme }) => theme.border};
`;

export const Tab = styled.button<{ $active?: boolean }>`
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.textSecondary)};
  border-bottom: 3px solid ${({ theme, $active }) => ($active ? theme.primary : 'transparent')};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

// Filters
export const FiltersSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.cardBg};
`;

export const FiltersSectionTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.textTitle};
`;

export const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

export const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const FilterValue = styled.div`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  font-weight: 500;
`;

// Form
export const CommentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

export const Input = styled.input`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  font-family: system-ui, -apple-system, sans-serif;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.primary};
    outline-offset: 2px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
  }
`;

export const Select = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  font-family: system-ui, -apple-system, sans-serif;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.primary};
    outline-offset: 2px;
  }
`;

export const CommentTextArea = styled.textarea`
  min-height: 80px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  line-height: 1.5;
  font-family: system-ui, -apple-system, sans-serif;
  resize: vertical;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.primary};
    outline-offset: 2px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
  }
`;

export const FormActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const AddButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AiRegenerateButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.primary};
  background: transparent;
  color: ${({ theme }) => theme.primary};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 140ms ease;

  &:hover {
    background: ${({ theme }) => theme.primary}20;
  }
`;

export const AiSuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  padding: 10px;
  border-radius: 6px;
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
`;

export const AiSuggestionItem = styled.button`
  text-align: left;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  cursor: pointer;
  transition: all 140ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.primary};
    background: ${({ theme }) => theme.primary}10;
  }
`;

// Comments List
export const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CommentCard = styled.div`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.cardBg};
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.1);
`;

export const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const CommentUser = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
`;

export const CommentDate = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.textSecondary};
`;

export const CommentText = styled.div`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.text};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const EditButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
  
  &:hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.primary};
  }
`;

export const CommentFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

export const CommentFilterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => theme.inputBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
`;

export const CommentFilterLabel = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
`;

export const CommentFilterValue = styled.span`
  color: ${({ theme }) => theme.text};
`;

// Interactive Comment Types
export const ChecklistContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`;

export const ChecklistItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.primary};
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
  
  label {
    font-size: 13px;
    color: ${({ theme }) => theme.text};
  }
`;

export const PollContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`;

export const PollOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  input[type="radio"] {
    accent-color: ${({ theme }) => theme.primary};
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
  
  label {
    font-size: 13px;
    color: ${({ theme }) => theme.text};
  }
`;

export const InteractiveCreator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  background: ${({ theme }) => theme.cardBg};
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 6px;
`;

export const AddOptionButton = styled.button`
  align-self: flex-start;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.primary};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

export const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 13px;
  border-radius: 8px;
  border: 1px dashed ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.cardBg};
`;

export const SuccessMessage = styled.div`
  padding: 10px 14px;
  border-radius: 6px;
  background: ${({ theme }) => theme.successBg};
  border: 1px solid ${({ theme }) => theme.successBorder};
  color: ${({ theme }) => theme.successText};
  font-size: 13px;
  margin-bottom: 12px;
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
`;

export const ErrorMessage = styled.div`
  padding: 10px 14px;
  border-radius: 6px;
  background: ${({ theme }) => theme.errorBg};
  border: 1px solid ${({ theme }) => theme.errorBorder};
  color: ${({ theme }) => theme.errorText};
  font-size: 13px;
  margin-bottom: 12px;
  animation: slideIn 0.3s ease;
`;
