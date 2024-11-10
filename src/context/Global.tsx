import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import React, { createContext, useState } from 'react';

export interface AppState {
  mode: 'upload' | 'chat',
  loading: boolean,
  retriever: VectorStoreRetriever<MemoryVectorStore> | null,
  error: string | null,
}

interface AppContext {
  globalState: AppState,
  setGlobalState: React.Dispatch<React.SetStateAction<AppState>>
}

export const GlobalContext = createContext<AppContext>({} as AppContext)

export const GlobalProvider = ({children}: {children: React.ReactNode}) => {
  const [globalState, setGlobalState] = useState<AppState>({
    // mode: 'chat',
    mode: 'upload',
    loading: false,
    retriever: null,
    error: null,
  })

  return (
    <GlobalContext.Provider
      value={{ globalState, setGlobalState }}
    >
      {children}
    </GlobalContext.Provider>
  )
}