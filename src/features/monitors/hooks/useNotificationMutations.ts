import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type CreateChannelPayload,
  type CreatePolicyPayload,
  type CreateTemplatePayload,
  createChannel,
  createPolicy,
  createTemplate,
  deleteChannel,
  deletePolicy,
  deleteTemplate,
  updateChannel,
  updatePolicy,
  updateTemplate,
} from "../api/notificationsApi";

const CHANNELS_KEY = ["notifications", "channels"] as const;
const POLICIES_KEY = ["notifications", "policies"] as const;
const TEMPLATES_KEY = ["notifications", "templates"] as const;

// Channels ------------------------------------------------------------------

export function useChannelMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY });

  const create = useMutation({
    mutationFn: (payload: CreateChannelPayload) => createChannel(payload),
    onSuccess: () => void invalidate(),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateChannelPayload }) =>
      updateChannel(id, payload),
    onSuccess: () => void invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteChannel(id),
    onSuccess: () => void invalidate(),
  });

  return { create, update, remove };
}

export function usePolicyMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: POLICIES_KEY });

  const create = useMutation({
    mutationFn: (payload: CreatePolicyPayload) => createPolicy(payload),
    onSuccess: () => void invalidate(),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreatePolicyPayload }) =>
      updatePolicy(id, payload),
    onSuccess: () => void invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deletePolicy(id),
    onSuccess: () => void invalidate(),
  });

  return { create, update, remove };
}

export function useTemplateMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });

  const create = useMutation({
    mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
    onSuccess: () => void invalidate(),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateTemplatePayload }) =>
      updateTemplate(id, payload),
    onSuccess: () => void invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => void invalidate(),
  });

  return { create, update, remove };
}
