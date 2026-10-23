// imports for react state and context below this code block
import React, { createContext, useContext, useState } from 'react';

// preview context creation defaulting to real live mode below this code block
const PreviewContext = createContext({
  previewMode: null,
  setPreviewMode: () => {},
  isPopulated: false,
  isEmpty: false,
  isLoading: false
});

// preview context provider component below this code block
export const PreviewProvider = ({ children }) => {
  // previewMode defaults to null for real authenticated live database telemetry
  const [previewMode, setPreviewMode] = useState(null);

  const isPopulated = previewMode === 'populated';
  const isEmpty = previewMode === 'empty';
  const isLoading = previewMode === 'loading';

  return (
    <PreviewContext.Provider
      value={{
        previewMode,
        setPreviewMode,
        isPopulated,
        isEmpty,
        isLoading
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
};

// custom hook to access preview state below this code block
export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
};
