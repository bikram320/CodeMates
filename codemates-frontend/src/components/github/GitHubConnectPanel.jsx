/**
 * GithubConnectPanel
 *
 * Shown when the signed-in user has no GitHub account connected yet (or when
 * they choose to connect a different one). Takes a GitHub Personal Access
 * Token — that's what GithubConnectRequestDto expects; there's no OAuth
 * redirect in the backend that was shared.
 *
 * Props:
 *   onConnect  {fn}       (accessToken) — expected to throw/reject on failure
 *   isConnecting {boolean}
 *   error       {Error|null}  A failed connect attempt (e.g. an invalid token)
 */

import { useRef, useState } from 'react';
import { Eye, EyeOff, ExternalLink, Link2, ShieldCheck } from 'lucide-react';

import { GitHubMark } from './githubSharedHelpers';

const TOKEN_HELP_URL = 'https://github.com/settings/tokens?type=beta';

export default function GithubConnectPanel({ onConnect, isConnecting, error }) {
  const [token, setToken] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  const trimmed = token.trim();
  const clientError = submitted && !trimmed ? 'Paste your GitHub personal access token.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trimmed) {
      setSubmitted(true);
      inputRef.current?.focus();
      return;
    }
    try {
      await onConnect(trimmed);
      setToken('');
      setSubmitted(false);
    } catch {
      // `error` (from the mutation) carries the message; nothing else to do here.
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D1A40] text-[#F5F5F5]">
            <GitHubMark size={22} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#F5F5F5]">Connect your GitHub account</h2>
            <p className="mt-0.5 text-sm text-[#8B88AE]">
              See your repositories and commit activity right in CodeMates.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5">
          <label htmlFor="github-token" className="mb-1.5 block text-sm font-medium text-[#F5F5F5]">
            Personal access token
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="github-token"
              type={visible ? 'text' : 'password'}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (submitted) setSubmitted(false);
              }}
              placeholder="ghp_..."
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(clientError || error)}
              aria-describedby="github-token-hint"
              className={`w-full rounded-lg border bg-[#1D1A40]/50 py-2.5 pl-3 pr-11 font-mono text-sm text-[#F5F5F5]
                          placeholder:text-[#6B6890] focus:outline-none focus:ring-2 ${
                            clientError || error
                              ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'
                              : 'border-[#2E2A66] hover:border-[#3A3580] focus:border-[#6C7BFF] focus:ring-[#6C7BFF]/30'
                          }`}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide token' : 'Show token'}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md
                         text-[#6B6890] transition-colors hover:text-[#F5F5F5]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {clientError ? (
            <p id="github-token-hint" role="alert" className="mt-1.5 text-xs text-red-300">
              {clientError}
            </p>
          ) : error ? (
            <p id="github-token-hint" role="alert" className="mt-1.5 text-xs text-red-300">
              {error.message || "That token didn't work. Check it and try again."}
            </p>
          ) : (
            <p id="github-token-hint" className="mt-1.5 flex items-start gap-1.5 text-xs text-[#8B88AE]">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" />
              Only used to read your public profile and repositories. It&apos;s sent straight to CodeMates&apos;s
              server and never shown again after this.
            </p>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            aria-busy={isConnecting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5
                       text-sm font-semibold text-[#0A0918] transition-colors hover:bg-[#8190FF]
                       disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]"
          >
            <Link2 size={15} />
            {isConnecting ? 'Connecting…' : 'Connect GitHub'}
          </button>
        </form>

        <a
          href={TOKEN_HELP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded text-xs text-[#8B88AE] transition-colors
                     hover:text-[#C9A8FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          How do I create a token on GitHub?
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}