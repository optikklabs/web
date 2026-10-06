import type { ApiErrorShape } from "@shared/api/utils/errorNormalization";
import { QueryClient } from "@tanstack/react-query";

// Every API call rejects with an ApiErrorShape (see errorInterceptor).
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiErrorShape;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      staleTime: 5_000,
      gcTime: 300_000,
    },
  },
});
