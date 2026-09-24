/**
 * useProfile()
 *
 * Data layer for the signed-in user's own Profile page (TanStack Query),
 * talking to the real user-profile backend:
 *   Profile.jsx → useProfile → profileApi.js → user-profile service
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * Returns
 *   profile          ProfileResponse, or undefined while loading
 *   isLoading         first load in flight
 *   isNotReady        loaded, and there's no profile yet (brand-new account —
 *                     the Kafka-driven profile-creation event may not have
 *                     landed; refetch() after a moment)
 *   error             a real failure (not "not ready") | null
 *   refetch()
 *
 *   updateProfile(partialData)   → Promise<ProfileResponse> (rejects with ProfileApiError)
 *   isSaving                     any of the section mutations below is in flight
 *
 *   addSkill({ skillName, proficiencyLevel?, yearsOfExperience? }) → Promise<SkillResponse>
 *   removeSkill(skillId)                                            → Promise<void>
 *   addInterest({ interestName })                                   → Promise<InterestResponse>
 *   removeInterest(interestId)                                      → Promise<void>
 *
 * updateProfile is optimistic (the section shows as saved immediately and
 * rolls back on failure). addSkill/addInterest are not optimistic — there's
 * no client-side id to show a "pending" row with, so the list updates once
 * the server confirms. removeSkill/removeInterest ARE optimistic (removing a
 * row you can already see is safe to do immediately, and it rolls back if
 * the delete fails).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addInterest as addInterestApi,
  addSkill as addSkillApi,
  getMyProfile,
  isNotFoundError,
  removeInterest as removeInterestApi,
  removeSkill as removeSkillApi,
  updateProfile as updateProfileApi,
} from '../api/profileApi';

export const profileQueryKey = ['profile', 'me'];

// Mutation status names differ between TanStack Query v4 ('loading') and v5 ('pending').
const isMutating = (mutation) => mutation.status === 'pending' || mutation.status === 'loading';

// Don't retry 4xx (including "not ready"); retry a flaky 5xx/network error once.
const retry = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileQueryKey,
    queryFn: getMyProfile,
    retry: (count, error) => !isNotFoundError(error) && retry(count, error),
  });

  const notReady = isNotFoundError(query.error);
  const profile = query.data;

  const patch = (updater) =>
    queryClient.setQueryData(profileQueryKey, (current) => (current ? updater(current) : current));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: profileQueryKey });

  /* ── Profile fields: optimistic, rolled back per-section on failure ─────── */

  const updateMutation = useMutation({
    mutationFn: (partialData) => updateProfileApi(partialData),
    onMutate: async (partialData) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData(profileQueryKey);
      patch((current) => ({ ...current, ...partialData }));
      return { previous };
    },
    onSuccess: (saved) => queryClient.setQueryData(profileQueryKey, saved),
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(profileQueryKey, context.previous);
    },
    onSettled: invalidate,
  });

  /* ── Skills / interests: add waits for the server; remove is optimistic ── */

  const addSkillMutation = useMutation({
    mutationFn: (skill) => addSkillApi(skill),
    onSuccess: (saved) => patch((current) => ({ ...current, skills: [...current.skills, saved] })),
    onSettled: invalidate,
  });

  const removeSkillMutation = useMutation({
    mutationFn: (skillId) => removeSkillApi(skillId),
    onMutate: async (skillId) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData(profileQueryKey);
      patch((current) => ({ ...current, skills: current.skills.filter((s) => s.id !== skillId) }));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(profileQueryKey, context.previous);
    },
    onSettled: invalidate,
  });

  const addInterestMutation = useMutation({
    mutationFn: (interest) => addInterestApi(interest),
    onSuccess: (saved) => patch((current) => ({ ...current, interests: [...current.interests, saved] })),
    onSettled: invalidate,
  });

  const removeInterestMutation = useMutation({
    mutationFn: (interestId) => removeInterestApi(interestId),
    onMutate: async (interestId) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData(profileQueryKey);
      patch((current) => ({
        ...current,
        interests: current.interests.filter((i) => i.id !== interestId),
      }));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(profileQueryKey, context.previous);
    },
    onSettled: invalidate,
  });

  return {
    profile,
    isLoading: profile === undefined && !notReady && !query.isError,
    isNotReady: notReady,
    error: !notReady && query.isError ? query.error : null,
    refetch: query.refetch,

    updateProfile: (partialData) => updateMutation.mutateAsync(partialData),
    isSaving: isMutating(updateMutation),

    addSkill: (skill) => addSkillMutation.mutateAsync(skill),
    isAddingSkill: isMutating(addSkillMutation),
    removeSkill: (skillId) => removeSkillMutation.mutateAsync(skillId),

    addInterest: (interest) => addInterestMutation.mutateAsync(interest),
    isAddingInterest: isMutating(addInterestMutation),
    removeInterest: (interestId) => removeInterestMutation.mutateAsync(interestId),
  };
}

export default useProfile;