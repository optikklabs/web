import api from "@/shared/api/http/client";
import { API_CONFIG } from "@config/apiConfig";

// Approves a CLI device-login by binding its userCode to the current session.
export async function approveDevice(userCode: string): Promise<void> {
  await api.post<unknown>(API_CONFIG.ENDPOINTS.AUTH.DEVICE_APPROVE, { userCode });
}
