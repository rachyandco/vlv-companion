import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { bucketOf, invokeCommand } from "@/api/commands";
import type {
  CommandName,
  EngineStartRequest,
  Invoke,
  InvokeResponse,
  InvokeUnlock,
} from "@/api/types";
import { useApi } from "./useApi";

type Variables = {
  vin: string;
  command: CommandName;
  body?: EngineStartRequest;
};

export function useInvokeCommand(): UseMutationResult<InvokeResponse<Invoke | InvokeUnlock>, Error, Variables> {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ vin, command, body }) => {
      if (!api) throw new Error("Not signed in.");
      return invokeCommand(api, vin, command, body);
    },
    // Invalidate everything queried for this VIN — covers Connected Vehicle,
    // Energy, and Location queries since they all share the `["vehicle", vin]`
    // prefix. Delay the refetch a few seconds: Volvo accepts the request
    // immediately but the car needs ~3–6 s to actually transition state, so an
    // instant re-fetch would still read the OLD value.
    //
    // The setTimeout deliberately outlives this hook's component: the
    // queryClient is process-global, and a user who triggers Lock then
    // navigates away should still see fresh data when they come back.
    // Cancelling on unmount would silently swallow the post-command refresh.
    //
    // Skip the refetch when the API returned 200 but the body reports a failure
    // bucket (REJECTED, CAR_ERROR, NOT_SUPPORTED, etc.) — the car state didn't
    // change, so there's nothing new to read.
    onSuccess: (data, { vin }) => {
      const bucket = bucketOf(data.data.invokeStatus);
      if (bucket !== "success" && bucket !== "pending") return;
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["vehicle", vin] });
      }, 5000);
    },
  });
}
