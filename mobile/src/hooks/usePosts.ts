import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getPosts, createPost, updatePost, deletePost } from '../services/posts';

export const postsKeys = {
  all: ['posts'] as const,
  infinite: () => [...postsKeys.all, 'infinite'] as const,
};

// ========== Infinite Scroll Query ==========
export function useInfinitePosts(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: postsKeys.infinite(),
    queryFn: ({ pageParam = 1 }) => getPosts(pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// ========== Create Post Mutation ==========
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.infinite() });
    },
  });
}

// ========== Update Post Mutation ==========
export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; content?: string } }) =>
      updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.infinite() });
    },
  });
}

// ========== Delete Post Mutation ==========
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.infinite() });
    },
  });
}