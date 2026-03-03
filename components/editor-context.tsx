'use client';

import { createContext, useContext } from 'react';

interface EditorContextType {
  isEditable: boolean;
}

const EditorContext = createContext<EditorContextType>({
  isEditable: true,
});

export const useEditorContext = () => useContext(EditorContext);

export const EditorProvider = EditorContext.Provider;
