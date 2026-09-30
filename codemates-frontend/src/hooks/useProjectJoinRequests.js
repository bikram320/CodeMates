import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptJoinRequest,
  getJoinRequests,
  rejectJoinRequest,
} from "../api/projectApi";

/**
 * Pending join requests for a project (leader only).
 *
 * Uses the real projectApi.js endpoints:
 *   GET /api/projects/{id}/join-requests
 *   PUT /api/projects/join-requests/{joinRequestId}/accept
 *   PUT /api/projects/join-requests/{joinRequestId}/reject
 *
 * ProjectJoinRequestResponseDto's exact fields weren't in projectApi.js, so
 * the applicant's id is read from the first of userId / requesterUserId /
 * requesterId / requestedByUserId that exists and exposed as `userId`.
 * If your DTO uses another name, add it to APPLICANT_KEYS below.
 *
 * accept(requestId) / reject(requestId) return promises; `busyId` is the
 * request currently being processed.
 */
const APPLICANT_KEYS = ["userId", "requesterUserId", "requesterId", "requestedByUserId"];

const withApplicant = (r) => ({
  ...r,
  userId: APPLICANT_KEYS.map((k) => r[k]).find(Boolean),
});

export default function useProjectJoinRequests(projectId, enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = ["project", projectId, "join-requests"];
  const [busyId, setBusyId] = useState(null);

  const query = useQuery({
    queryKey,
    queryFn: () => getJoinRequests(projectId),
    enabled: !!projectId && enabled,
  });

  const run = (apiFn) => async (requestId) => {
    setBusyId(requestId);
    try {
      await apiFn(requestId);
      await queryClient.invalidateQueries({ queryKey });
    } finally {
      setBusyId(null);
    }
  };

  const requests = (Array.isArray(query.data) ? query.data : [])
    .filter((r) => !r.status || r.status === "PENDING")
    .map(withApplicant);

  return {
    requests,
    isLoading: query.isLoading,
    isError: query.isError,
    busyId,
    approve: run(acceptJoinRequest),
    reject: run(rejectJoinRequest),
  };
}
