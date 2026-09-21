/**
 * Mock project settings for the Project Settings page.
 *
 * Only projectSettingsApi.js should import this file, so it can be deleted
 * when the real endpoints are wired in.
 *
 * createMockProjectSettings(projectId) returns a fresh object each call:
 *
 * {
 *   project: {
 *     id, status ('ACTIVE' | 'COMPLETED' | 'ARCHIVED'),
 *     memberCount, pendingInviteCount
 *   },
 *   general: {
 *     name, description,
 *     projectType   'OPEN_SOURCE' | 'STARTUP' | 'HACKATHON' | 'ACADEMIC' | 'PERSONAL'
 *     techStack     string[]
 *     visibility    'PUBLIC' | 'PRIVATE'
 *   },
 *   repository: {
 *     connected, repoUrl ('' when not connected), isPrivate,
 *     lastSyncedAt (ISO | null), connectedBy (username | null)
 *   },
 *   team: {
 *     maxMembers,
 *     whoCanInvite        'LEADERS' | 'LEADERS_REVIEWERS'
 *     defaultRole         'CONTRIBUTOR' | 'REVIEWER'
 *     allowLeaving, invitationsEnabled, openToNewMembers   booleans
 *   }
 * }
 *
 * The name and description start from the Project Details mock, so this page
 * matches what that page shows for the same project.
 */

import { projectDetails, defaultProjectDetails } from './projectDetailsMock';

/** Names of other projects, so a rename can conflict. */
export const MOCK_TAKEN_PROJECT_NAMES = ['DevConnect', 'TaskFlow'];

/** Repositories already linked to a different project. */
export const MOCK_LINKED_REPOSITORIES = ['codemates-dev/codemates-docs'];

/** The signed-in user, recorded as whoever connected the repository. */
export const MOCK_CURRENT_USERNAME = 'aarav_dev';

const FALLBACK_NAME = 'CodeMates';
const FALLBACK_DESCRIPTION =
  "CodeMates is a collaboration platform where developers find teammates, form project teams, manage tasks on a Kanban board and track each person's contribution, all in one place.";

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

const nonEmptyString = (value, fallback) =>
  typeof value === 'string' && value.trim() ? value : fallback;

export function createMockProjectSettings(projectId) {
  const details = projectDetails?.[projectId] ?? defaultProjectDetails;

  return {
    // Matches the Team page mock: 7 members and 1 pending invite.
    project: {
      id: projectId,
      status: 'ACTIVE',
      memberCount: 7,
      pendingInviteCount: 1,
    },

    general: {
      name: nonEmptyString(details?.name, FALLBACK_NAME),
      description: nonEmptyString(details?.description, FALLBACK_DESCRIPTION),
      projectType: 'OPEN_SOURCE',
      techStack: ['React', 'Tailwind CSS', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Redis'],
      visibility: 'PUBLIC',
    },

    // Same repository as the GitHub page's sample data.
    repository: {
      connected: true,
      repoUrl: 'https://github.com/codemates-dev/codemates-frontend',
      isPrivate: true,
      lastSyncedAt: minutesAgo(12),
      connectedBy: MOCK_CURRENT_USERNAME,
    },

    team: {
      maxMembers: 10,
      whoCanInvite: 'LEADERS',
      defaultRole: 'CONTRIBUTOR',
      allowLeaving: true,
      invitationsEnabled: true,
      openToNewMembers: true,
    },
  };
}