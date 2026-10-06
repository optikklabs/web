import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type CreateMonitorPayload, deleteMonitor, updateMonitor } from "../api/monitorsApi";

export function useUpdateMonitor(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMonitorPayload) => updateMonitor(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monitors", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["monitors", "list"] });
    },
  });
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMonitor(id),
    onSuccess: (_void, id) => {
      void queryClient.removeQueries({ queryKey: ["monitors", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["monitors", "list"] });
    },
  });
}
