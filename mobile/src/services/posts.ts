import api from './api';

export interface Post {
  id: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  status: 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    photo: string | null;
  };
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getPosts(page: number = 1, limit: number = 10): Promise<PostsResponse> {
  const response = await api.get(`/posts?page=${page}&limit=${limit}`);
  return response.data;
}

// ========== FIXED: createPost with proper FormData ==========
export async function createPost(data: {
  title?: string;
  content: string;
  image?: any;
}): Promise<Post> {
  const formData = new FormData();

  if (data.title) {
    formData.append('title', data.title);
  }
  formData.append('content', data.content);

  if (data.image) {
    const uri = data.image.uri;
    const filename = uri.split('/').pop() || 'photo.jpg';
    // Determine mime type from file extension
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    // ✅ React Native expects this exact format
    formData.append('image', {
      uri: uri,
      name: filename,
      type: mimeType,
    } as any);
  }

  const response = await api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function updatePost(id: number, data: { title?: string; content?: string }): Promise<Post> {
  const response = await api.put(`/posts/${id}`, data);
  return response.data;
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/posts/${id}`);
}