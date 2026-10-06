import api from "@/shared/api/http/client";
import { validateResponse } from "@/shared/api/utils/validate";
import { API_CONFIG } from "@config/apiConfig";
import { z } from "zod";

const V1 = API_CONFIG.ENDPOINTS.V1_BASE;

const memberRoleSchema = z.enum(["admin", "member"]);

const memberSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: memberRoleSchema,
  active: z.boolean(),
  tenantId: z.number(),
  createdAt: z.string(),
});

export type MemberRole = z.infer<typeof memberRoleSchema>;
export type Member = z.infer<typeof memberSchema>;

export interface CreateMemberPayload {
  email: string;
  name: string;
  /** Omit to email the member a password-reset link instead. */
  password?: string;
  role: MemberRole;
}

export async function listMembers(): Promise<Member[]> {
  return validateResponse(z.array(memberSchema), await api.get<unknown>(`${V1}/users`));
}

export async function createMember(payload: CreateMemberPayload): Promise<Member> {
  return validateResponse(memberSchema, await api.post<unknown>(`${V1}/users`, payload));
}

export async function updateMemberRole(id: number, role: MemberRole): Promise<Member> {
  return validateResponse(
    memberSchema,
    await api.request<unknown>({ method: "PATCH", url: `${V1}/users/${id}/role`, data: { role } })
  );
}

export async function removeMember(id: number): Promise<void> {
  await api.delete<unknown>(`${V1}/users/${id}`);
}
