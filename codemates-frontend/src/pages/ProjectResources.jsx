import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import ResourceHeader from "../components/resources/ResourceHeader";
import ResourceList from "../components/resources/ResourceList";
import AddResourceModal from "../components/resources/AddResourceModal";

import { projectResources, defaultProjectResources } from "../mock/resourcesMock";
import { projectDetails, defaultProjectDetails } from "../mock/projectDetailsMock";

/**
 * Project Resources page (/projects/:projectId/resources).
 *
 * Local mock state only, no API layer yet — matches how Discover
 * Projects and the Kanban/Chat pages started before their data layers
 * were added in a follow-up pass.
 *
 * uploadedByUserId on each resource is resolved against this project's
 * `members` list (from projectDetailsMock) since ResourceResponse itself
 * only carries the id, not a name/avatar.
 */
export default function ProjectResources() {
  const { projectId } = useParams();

  const project = projectDetails[projectId] ?? defaultProjectDetails;
  const initialResources = projectResources[projectId] ?? defaultProjectResources;

  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const enrichedResources = resources.map((resource) => ({
    ...resource,
    addedBy: project.members.find((m) => m.id === resource.uploadedByUserId) ?? null,
  }));

  const filteredResources = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedResources.filter((resource) => {
      const matchesSearch =
        !term ||
        resource.name.toLowerCase().includes(term) ||
        (resource.description || "").toLowerCase().includes(term) ||
        resource.url.toLowerCase().includes(term);
      const matchesType = !selectedType || resource.resourceType === selectedType;
      return matchesSearch && matchesType;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, search, selectedType]);

  const hasActiveFilters = search.trim() !== "" || !!selectedType;

  function clearFilters() {
    setSearch("");
    setSelectedType(null);
  }

  function openAddModal() {
    setEditingResource(null);
    setModalOpen(true);
  }

  function openEditModal(resource) {
    setEditingResource(resource);
    setModalOpen(true);
  }

  function handleSave(resourceData) {
    if (resourceData.id) {
      setResources((prev) =>
        prev.map((r) => (r.id === resourceData.id ? { ...r, ...resourceData } : r))
      );
    } else {
      setResources((prev) => [
        {
          ...resourceData,
          id: `r${Date.now()}`,
          projectId,
          uploadedByUserId: project.members[0]?.id ?? null, // mock "current user" stand-in
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setModalOpen(false);
  }

  // Soft delete in the real API — this mock just removes it locally.
  function handleDelete(resource) {
    setResources((prev) => prev.filter((r) => r.id !== resource.id));
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
          onAddClick={openAddModal}
        />
      </div>

      <div className="results-container mt-6">
        <ResourceList
          resources={filteredResources}
          hasActiveFilters={hasActiveFilters}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onAddClick={openAddModal}
          onClearFilters={clearFilters}
        />
      </div>

      <AddResourceModal
        open={modalOpen}
        resource={editingResource}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}