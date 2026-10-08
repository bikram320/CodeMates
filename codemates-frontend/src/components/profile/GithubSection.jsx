/**
 * GithubSection
 *
 * Compact "connect GitHub" widget for the Profile page. This is the missing
 * link between "user exists" and discovery-service's ML matching actually
 * having data: MatchSyncService reads a skill profile that github-sync-
 * service can only build after /api/github/connect + /api/github/sync have
 * both run for that user.
 *
 * This does NOT reimplement the connect/sync UI — it composes the same
 * components the full GitHub Integration page uses (src/components/github/),
 * driven by the same useGithub() hook and TanStack Query cache. Connecting
 * or syncing here stays in sync with that page automatically, and there's
 * only one place (GitHubConnectPanel, GitHubProfileCard) that owns the
 * connect/profile UI.
 *
 * Props:
 *   onNotify  {fn}  (text, tone?) — same signature as Profile.jsx's notify()
 */

import useGithub from '../../hooks/useGitHub';
import GitHubConnectPanel from '../github/GitHubConnectPanel';
import GitHubProfileCard from '../github/GitHubProfileCard';
import RepositoryList from '../github/RepositoryList';

import { SectionBody, SettingsSection } from '../shared/formControls';

export default function GithubSection({ onNotify = () => {} }) {
  const {
    profile,
    isLoadingProfile,
    isNotConnected,
    profileError,
    connect,
    isConnecting,
    connectError,

    repositories,
    isLoadingRepositories,
    repositoriesError,
    refetchRepositories,

    sync,
    isSyncing,
  } = useGithub();

  const handleConnect = async (accessToken) => {
    // connect() throws/rejects on failure — GitHubConnectPanel handles that
    // itself (via connectError below) and keeps the token in the field.
    await connect(accessToken);
    // Connecting alone only stores the token — sync is what actually pulls
    // repos/languages, which is what matching needs.
    try {
      const result = await sync();
      onNotify(
          typeof result?.repositoriesSynced === 'number'
              ? `GitHub connected — synced ${result.repositoriesSynced} repositories.`
              : 'GitHub connected and synced.'
      );
    } catch (err) {
      // Connect succeeded even if this first sync didn't — profile card will
      // render with a "Sync now" button so they can retry from there.
      onNotify(err?.message || 'Connected, but the first sync failed. Try syncing again.', 'error');
    }
  };

  const handleSync = async () => {
    try {
      const result = await sync();
      onNotify(
          typeof result?.repositoriesSynced === 'number'
              ? `Synced ${result.repositoriesSynced} repositories.`
              : 'Sync complete.'
      );
    } catch (err) {
      onNotify(err?.message || 'Sync failed. Try again.', 'error');
    }
  };

  return (
      <SettingsSection
          id="profile-github"
          title="GitHub"
          description="Connect GitHub so your skills and activity can be used for developer matching."
      >
        <SectionBody>
          {isLoadingProfile ? (
              <div className="h-10 animate-pulse rounded-lg bg-[#1D1A40]/60" />
          ) : profileError ? (
              <p role="alert" className="text-xs text-red-300">
                {profileError.message || 'Could not check your GitHub connection.'}
              </p>
          ) : isNotConnected || !profile ? (
              <GitHubConnectPanel onConnect={handleConnect} isConnecting={isConnecting} error={connectError} />
          ) : (
              <div className="flex flex-col gap-4">
                <GitHubProfileCard profile={profile} onSync={handleSync} isSyncing={isSyncing} />
                {/* Capped height so a long repo list scrolls inside the card
                    instead of stretching the whole Profile page. */}
                <div className="max-h-96 overflow-y-auto pr-1">
                  <RepositoryList
                      repositories={repositories}
                      isLoading={isLoadingRepositories}
                      error={repositoriesError}
                      onRetry={refetchRepositories}
                  />
                </div>
              </div>
          )}
        </SectionBody>
      </SettingsSection>
  );
}