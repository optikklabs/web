import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useStandardQuery } from "@shared/hooks/useStandardQuery";

import {
  type CreateMemberPayload,
  type Member,
  type MemberRole,
  createMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "../api/membersApi";

const MEMBERS_KEY = ["settings", "members"] as const;

export function useMembers() {
  return useStandardQuery<Member[]>({
    queryKey: MEMBERS_KEY,
    queryFn: listMembers,
  });
}

export function useMemberMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });

  const create = useMutation({
    mutationFn: (payload: CreateMemberPayload) => createMember(payload),
    onSuccess: () => void invalidate(),
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: MemberRole }) => updateMemberRole(id, role),
    onSuccess: () => void invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: number) => removeMember(id),
    onSuccess: () => void invalidate(),
  });

  return { create, updateRole, remove };
}
