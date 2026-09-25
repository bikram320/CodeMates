import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import ResourceHeader from "../components/resources/ResourceHeader";
import ResourceList from "../components/resources/ResourceList";
import AddResourceModal from "../components/resources/AddResourceModal";

import { getProjectResources, addResource, deleteResource } from "../api/resourceApi";

/**
 * Project Resources page (/projects/:projectId/resources).
 *
 * Directly wired to ProjectResourceController via resourceApi.js — no
 * mock data, no mock delay.
 *
 * There is no edit endpoint on the backend (only add / list / delete),
 * so the earlier mock-based "Edit" action, AddResourceModal's edit
 * mode, and the member-lookup "addedBy" enrichment (which relied on
 * mock project members) have all been removed. ResourceResponse only
 * carries `uploadedByUserId`, and the real member endpoint doesn't
 * expose a display name, so there's nothing to enrich that with yet —
 * ResourceCard shows the created date instead.
 */
export default function ProjectResources() {
  const { projectId } = useParams();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectResources(projectId);
      setResources(data ?? []);
    } catch (err) {
      setError(err?.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSearch =
        !term ||
        resource.name.toLowerCase().includes(term) ||
        (resource.description || "").toLowerCase().includes(term) ||
        resource.url.toLowerCase().includes(term);
      const matchesType = !selectedType || resource.resourceType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [resources, search, selectedType]);

  const hasActiveFilters = search.trim() !== "" || !!selectedType;

  function clearFilters() {
    setSearch("");
    setSelectedType(null);
  }

  async function handleSave(resourceData) {
    setSaving(true);
    setError(null);
    try {
      const created = await addResource(projectId, {
        name: resourceData.name,
        url: resourceData.url,
        description: resourceData.description || undefined,
        resourceType: resourceData.resourceType,
      });
      setResources((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(err?.message || "Failed to add resource.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resource) {
    setDeletingId(resource.id);
    setError(null);
    try {
      await deleteResource(projectId, resource.id);
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
    } catch (err) {
      setError(err?.message || "Failed to delete resource.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="project-resources-page">
      <div className="head-container">
        <PageHeader
          title="Resources"
          description="Shared files, links, and docs for this project."
        />
      </div>

      <div className="controls-container mt-6">
        <ResourceHeader
          search={search}
          onSearchChange={setSearch}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onAddClick={() => setModalOpen(true)}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="results-container mt-6">
        {loading ? (
          <div className="flex justify-center py-16 text-sm text-[var(--cm-muted)]">
            Loading resources...
          </div>
        ) : (
          <ResourceList
            resources={filteredResources}
            hasActiveFilters={hasActiveFilters}
            onDelete={handleDelete}
            deletingId={deletingId}
            onAddClick={() => setModalOpen(true)}
            onClearFilters={clearFilters}
          />
        )}
      </div>

      <AddResourceModal
        open={modalOpen}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}