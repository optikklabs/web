import { useMutation } from "@tanstack/react-query";
import { approveDevice } from "../api/deviceAuthApi";

export function useApproveDevice() {
  return useMutation({
    mutationFn: (userCode: string) => approveDevice(userCode),
  });
}
