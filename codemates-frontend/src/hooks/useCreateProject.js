/**
 * src/hooks/useCreateProject.js
 *
 * React Query mutation hook for creating a project.
 *
 * Data flow:
 *   CreateProject.jsx
 *     → useCreateProject()
 *       → projectsApi.createProject()
 *         → createProjectMock()        (VITE_USE_MOCK=true)
 *         → POST /api/projects         (VITE_USE_MOCK=false)
 *
 * On success the cache is updated so the new project appears without a manual
 * reload:
 *   ['projects', id]  → seeded with the created project, so /projects/:id
 *                       (useProject) can render immediately
 *   ['projects']      → invalidated, which refreshes ['projects', 'my']
 *                       (My Projects) and any other project lists
 *
 * Usage:
 *   const { createProject, isCreating, isSuccess, createdProject } = useCreateProject();
 *   const project = await createProject(payload);   // rejects on failure
 *   navigate(`/projects/${project.id}`);
 *
 * `createProject` rejects with an Error that has `.status` and, for
 * validation failures, `.fieldErrors` ({ fieldName: message }).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '../api/projectsApi';

export function useCreateProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData(['projects', project.id], project);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    createProject:  mutation.mutateAsync,
    isCreating:     mutation.isPending,
    isSuccess:      mutation.isSuccess,
    isError:        mutation.isError,
    error:          mutation.error,
    createdProject: mutation.data ?? null,
    reset:          mutation.reset,
  };
}

export default useCreateProject;