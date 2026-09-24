/**
 * InterestsSection
 *
 * Interests are their own sub-resource too (POST/DELETE
 * /api/users/me/interests), so — like Skills — there's no draft/Save: adding
 * or removing calls the API immediately.
 *
 * Props:
 *   interests  {Array}   InterestResponse[] { id, interestName }
 *   onAdd      {fn}      ({ interestName }) → Promise
 *   onRemove   {fn}      (interestId) → Promise
 *   isAdding   {boolean}
 */

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

import {
  inputClass,
  primaryButtonClass,
  SectionBody,
  SettingsSection,
} from '../shared/formControls';

const MAX_INTEREST_NAME_LENGTH = 100;

export default function InterestsSection({ interests, onAdd, onRemove, isAdding }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const interestName = name.trim();

    if (!interestName) {
      setError('Enter an interest.');
      inputRef.current?.focus();
      return;
    }
    if (interestName.length > MAX_INTEREST_NAME_LENGTH) {
      setError(`Keep interests under ${MAX_INTEREST_NAME_LENGTH} characters.`);
      return;
    }
    if (interests.some((i) => i.interestName.toLowerCase() === interestName.toLowerCase())) {
      setError(`${interestName} is already on your list.`);
      return;
    }

    try {
      await onAdd({ interestName });
      setName('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Could not add that interest. Try again.');
    }
  };

  const handleRemove = async (interest) => {
    setRemovingId(interest.id);
    try {
      await onRemove(interest.id);
    } catch {
      // Rolls back on its own if the delete fails.
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SettingsSection
      id="profile-interests"
      title="Interests"
      description="Topics and technologies you'd like to work on — helps with project matching."
    >
      <SectionBody>
        {interests.length === 0 ? (
          <p className="text-sm text-[#6B6890]">No interests yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Your interests">
            {interests.map((interest) => (
              <li
                key={interest.id}
                className="flex items-center gap-2 rounded-lg border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 py-1.5 pl-3 pr-1.5"
              >
                <span className="text-sm text-[#F5F5F5]">{interest.interestName}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(interest)}
                  disabled={removingId === interest.id}
                  aria-label={`Remove ${interest.interestName}`}
                  className="flex h-6 w-6 items-center justify-center rounded text-[#8B88AE] transition-colors
                             hover:bg-[#2E2A66] hover:text-[#F5F5F5] disabled:opacity-40
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="interest-name" className="sr-only">
            Interest
          </label>
          <input
            ref={inputRef}
            id="interest-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Machine Learning"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            className={`flex-1 ${inputClass(Boolean(error))}`}
          />
          <button
            type="submit"
            disabled={isAdding}
            aria-busy={isAdding}
            className={`${primaryButtonClass} shrink-0`}
          >
            <Plus size={15} />
            {isAdding ? 'Adding…' : 'Add'}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}
      </SectionBody>
    </SettingsSection>
  );
}