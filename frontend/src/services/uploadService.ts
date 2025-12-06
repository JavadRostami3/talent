import api from './api';
import type { Document } from './userService';

export interface UploadResponse {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
const MOCK_DOCUMENTS_KEY = 'mockDocuments';
const MOCK_PROFILE_KEY = 'mockStudentProfile';

const getMockDocuments = (): Document[] => {
  const stored = localStorage.getItem(MOCK_DOCUMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const persistMockDocuments = (documents: Document[]) => {
  localStorage.setItem(MOCK_DOCUMENTS_KEY, JSON.stringify(documents));
  return documents;
};

const updateMockProfileDocuments = (documents: Document[]) => {
  const storedProfile = localStorage.getItem(MOCK_PROFILE_KEY);
  if (!storedProfile) return;
  const profile = JSON.parse(storedProfile);
  profile.documents = documents;
  profile.updatedAt = new Date().toISOString();
  localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
};

export const uploadService = {
  uploadDocument: async (
    file: File,
    documentType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> => {
    if (USE_MOCK_API) {
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });

      const mockDocument: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: documentType,
        uploadedAt: new Date().toISOString(),
      };

      const updatedDocuments = [...getMockDocuments(), mockDocument];
      persistMockDocuments(updatedDocuments);
      updateMockProfileDocuments(updatedDocuments);

      return Promise.resolve(mockDocument);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    const response = await api.post<UploadResponse>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    if (USE_MOCK_API) {
      const documents = getMockDocuments().filter((doc) => doc.id !== documentId);
      persistMockDocuments(documents);
      updateMockProfileDocuments(documents);
      return Promise.resolve();
    }
    await api.delete(`/documents/${documentId}`);
  },
};
