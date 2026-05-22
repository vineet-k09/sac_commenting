import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import CommentPage from './components/CommentPage';
import './App.css';

const darkTheme = {
  bg: '#0b0b0b',
  cardBg: '#151515',
  inputBg: '#1a1a1a',
  border: '#2a2a2a',
  text: '#f5f5f5',
  textSecondary: '#b3b3b3',
  textTitle: '#ffffff',
  primary: '#c92a2a',
  toggleBg: '#2a2a2a',
  toggleText: '#f5f5f5',
  successBg: '#1e4620',
  successBorder: '#2d5f30',
  successText: '#7ec985',
  errorBg: '#4a1f23',
  errorBorder: '#5c2329',
  errorText: '#ea868f'
};

const lightTheme = {
  bg: '#f9f9f9',
  cardBg: '#ffffff',
  inputBg: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  textSecondary: '#666666',
  textTitle: '#111111',
  primary: '#e57373',
  toggleBg: '#e0e0e0',
  toggleText: '#333333',
  successBg: '#d4edda',
  successBorder: '#c3e6cb',
  successText: '#155724',
  errorBg: '#f8d7da',
  errorBorder: '#f5c6cb',
  errorText: '#721c24'
};

function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('theme-light', !isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CommentPage isDark={isDark} toggleTheme={toggleTheme} />
    </ThemeProvider>
  );
}

export default App;
