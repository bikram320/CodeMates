/**
 * Mock resources, keyed by project id to match projectDetailsMock.js.
 * Shaped to match the real ResourceResponse contract (see
 * codemates-api-docs.md, "Project resources / workspace file sharing"):
 * { id, projectId, uploadedByUserId, name, url, description,
 *   resourceType, createdAt }
 *
 * resourceType is one of: LINK, DOCUMENT, DESIGN, OTHER.
 *
 * uploadedByUserId refers to a member id from that project's `members`
 * list in projectDetailsMock.js.
 *
 * Filename note: this is "resourcesMock.js" (plural) deliberately —
 * ProjectResources.jsx imports from this exact name. There should be no
 * other "resourceMock.js"/"resourcesMock.js" file anywhere in src/mock/.
 */
export const projectResources = {
  p1: [
    {
      id: "r1",
      projectId: "p1",
      uploadedByUserId: "m1",
      name: "OpenBoard UI Kit",
      url: "https://figma.com/file/example-openboard-ui",
      description: "Design system and component library for the board UI.",
      resourceType: "DESIGN",
      createdAt: "2026-09-05T10:00:00Z",
    },
    {
      id: "r2",
      projectId: "p1",
      uploadedByUserId: "m2",
      name: "API Reference Doc",
      url: "https://docs.google.com/document/d/example-api-ref",
      description: "Draft REST API reference for the sync backend.",
      resourceType: "DOCUMENT",
      createdAt: "2026-09-08T14:20:00Z",
    },
    {
      id: "r3",
      projectId: "p1",
      uploadedByUserId: "m1",
      name: "Architecture Notes",
      url: "https://github.com/example/openboard/wiki/architecture",
      description: "Wiki page covering the real-time sync architecture.",
      resourceType: "LINK",
      createdAt: "2026-09-10T09:15:00Z",
    },
    {
      id: "r4",
      projectId: "p1",
      uploadedByUserId: "m3",
      name: "Deployment Guide",
      url: "https://drive.google.com/file/d/example-deploy-guide",
      description: "Step-by-step guide for deploying to staging.",
      resourceType: "DOCUMENT",
      createdAt: "2026-09-14T11:40:00Z",
    },
    {
      id: "r5",
      projectId: "p1",
      uploadedByUserId: "m2",
      name: "Brand Assets",
      url: "https://drive.google.com/drive/folders/example-assets",
      description: "Logos, icons, and screenshots for the README.",
      resourceType: "OTHER",
      createdAt: "2026-09-16T08:00:00Z",
    },
  ],

  p2: [
    {
      id: "r1",
      projectId: "p2",
      uploadedByUserId: "m1",
      name: "TraceWell Architecture Diagram",
      url: "https://figma.com/file/example-tracewell-arch",
      description: "High-level diagram of the collector and exporter pipeline.",
      resourceType: "DESIGN",
      createdAt: "2026-08-25T10:00:00Z",
    },
    {
      id: "r2",
      projectId: "p2",
      uploadedByUserId: "m2",
      name: "Contributor Onboarding",
      url: "https://docs.google.com/document/d/example-onboarding",
      description: "How to set up the project locally and submit a PR.",
      resourceType: "DOCUMENT",
      createdAt: "2026-09-01T09:30:00Z",
    },
    {
      id: "r3",
      projectId: "p2",
      uploadedByUserId: "m1",
      name: "OpenTelemetry Spec",
      url: "https://opentelemetry.io/docs/specs/otel/",
      description: "Reference spec we're targeting for the exporter.",
      resourceType: "LINK",
      createdAt: "2026-09-05T13:10:00Z",
    },
  ],
};

export const defaultProjectResources = projectResources.p1;