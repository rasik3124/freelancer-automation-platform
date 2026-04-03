import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Project, ProjectFiltersState } from "../../types/project";
import { ProjectFilters } from "../../components/projects/ProjectFilters";
import { ProjectList } from "../../components/projects/ProjectList";
import { ProjectDetailsModal } from "../../components/projects/ProjectDetailsModal";
import { PostProjectForm } from "../../components/projects/PostProjectForm";
import api from "../../services/api";

// ─── ClientProjects ───────────────────────────────────────────────────────────

/**
 * ClientProjects — /dashboard/client/projects
 *
 * State managed here (single source of truth):
 *   projects         — fetched from GET /api/projects, live-updated by actions
 *   filters          — controlled by ProjectFilters (search, status, priority)
 *   view             — "grid" | "list"
 *   selectedId       — opens ProjectDetailsModal when non-null
 *   showPostForm     — opens PostProjectForm modal
 */
export const ClientProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<ProjectFiltersState>({ search: "", status: "all", priority: "all" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);

  // ── Fetch projects ──────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await api.get<{ data: Project[] }>("/api/projects");
      setProjects(res.data.data);
    } catch {
      setFetchError("Could not load projects. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return projects.filter((p) => {
      if (filters.status !== "all"   && p.status   !== filters.status)   return false;
      if (filters.priority !== "all" && p.priority !== filters.priority) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, filters]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleProjectUpdated = (updated: Project) =>
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const handleProjectCreated = (newProject: Project) =>
    setProjects((prev) => [newProject, ...prev]);

  const hasFilters = filters.search !== "" || filters.status !== "all" || filters.priority !== "all";

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl font-bold text-textPrimary">My Projects</h2>
          <p className="text-sm text-textMuted">Manage and track all your projects in one place.</p>
        </div>
        <button
          id="post-new-project-btn"
          onClick={() => setShowPostForm(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:bg-accent/90 transition-colors sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Post New Project
        </button>
      </motion.div>

      {/* ── Global fetch error ── */}
      {fetchError && (
        <div className="flex items-center justify-between rounded-2xl border border-error/20 bg-error/5 px-5 py-4">
          <p className="text-sm text-error">{fetchError}</p>
          <button
            onClick={fetchProjects}
            className="rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <ProjectFilters
        filters={filters}
        onChange={setFilters}
        totalCount={projects.length}
        filteredCount={filtered.length}
      />

      {/* ── Project list ── */}
      <ProjectList
        projects={filtered}
        isLoading={isLoading}
        view={view}
        onViewChange={setView}
        onSelectProject={setSelectedId}
        onPostProject={() => setShowPostForm(true)}
        hasFilters={hasFilters}
      />

      {/* ── Project details modal (drawer) ── */}
      {selectedId && (
        <ProjectDetailsModal
          projectId={selectedId}
          onClose={() => setSelectedId(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {/* ── Post project form (modal) ── */}
      {showPostForm && (
        <PostProjectForm
          onClose={() => setShowPostForm(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};
