import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { Document } from 'langchain/document';
import { getPDFData } from '../utils/pdf';
import { env } from '@xenova/transformers';
env.allowLocalModels = false;

self.addEventListener('message', async (event: MessageEvent<{file: File}>) => {
  console.warn('Worker received message', event.data);
  if (!event.data.file) return
  const { file } = event.data

  let fileData: Document[] = []

  if (file.type.includes('pdf')) {
    for (const page of await getPDFData(file)) {
      fileData.push(new Document({ pageContent: page }))
    }
  } else if (file.type.includes('plain')) {
    const loader = new TextLoader(file)
    fileData = await loader.load()  
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 50,
  })

  const splits = await textSplitter.splitDocuments(fileData)
  const embeddings = new HuggingFaceTransformersEmbeddings()
  const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings)
  const vectors = vectorStore.memoryVectors
  
  self.postMessage({ vectors })
})

self.addEventListener('error', (event) => {
  console.error('Error in fileReaderWorker', event)
})