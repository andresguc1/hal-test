# Project Management Architecture Investigation
## Haltest - Bulk Actions, Project Export/Import & Project List Scalability

---

## 1. Executive Summary

### Current Problems
1. **Project Selector doesn't scale** - Uses native `<select>` with all projects loaded; no search, pagination, or virtualization
2. **No bulk operations** - Cannot select multiple projects for delete/export
3. **Export is flow-level only** - No project-level export that includes all flows, sub-flows, dependencies
4. **Delete is single-project only** - No transactional bulk delete
5. **Sub-flow dependency resolution** - Export resolves components recursively but import doesn't fully reconstruct project structure

### Why Current Architecture Doesn't Scale
- Frontend loads ALL projects at once (`/api/projects` returns full hierarchy)
- Project list rendering uses virtualization only for flows, not projects
- No server-side search/filter/pagination for projects
- Project delete uses cascade but no bulk endpoint
- Export resolves sub-flows but creates flat component list, not project structure

---

## 2. Current Architecture

### 2.1 Data Models (Backend)

#### Project (`apps/backend/database/models/Project.js`)
```javascript
{
  id: STRING (UUID),
  name: STRING,
  description: TEXT,
  activeFlowId: STRING,
  userId: STRING,
  collaborationEnabled: BOOLEAN,
  createdAt/updatedAt: TIMESTAMPS
}
```

#### Flow (`apps/backend/database/models/Flow.js`)
```javascript
{
  id: STRING (UUID),
  name: STRING,
  viewport: JSON,
  projectId: STRING (FK),
  order: INTEGER,
  type: 'main' | 'component' | 'loop',
  canvasId: STRING (FK),
  parentId: STRING (FK - for nested flows),
  hasInput: BOOLEAN,
  hasOutput: BOOLEAN
}
```

#### Node (`apps/backend/database/models/Node.js`)
```javascript
{
  id: INTEGER (auto-increment),
  nodeId: STRING (React Flow ID),
  type: STRING,
  data: JSON (includes configuration, flowId for components),
  position: JSON,
  flowId: STRING (FK),
  parentId: STRING,
  order: INTEGER
}
```

#### Edge (`apps/backend/database/models/Edge.js`)
```javascript
{
  id: INTEGER,
  edgeId: STRING,
  source: STRING,
  target: STRING,
  sourceHandle/targetHandle: STRING,
  flowId: STRING (FK)
}
```

### 2.2 Key Relationships
- **Project → Flows** (1:N, cascade delete via `onDelete: 'CASCADE'`)
- **Flow → Nodes** (1:N, cascade delete)
- **Flow → Edges** (1:N, cascade delete)
- **Canvas → Flows** (1:N, cascade delete)
- **Project → Canvas** (1:N, cascade delete)

### 2.3 Sub-Flow Architecture
- **Component flows** (`type: 'component'`) are referenced by `node.data.configuration.flowId`
- **Loop flows** (`type: 'loop'`) similarly referenced
- **Resolution**: `FlowResolver` (core/FlowResolver.js) recursively loads sub-flows from DB
- **Cross-project components**: `DependencyService` resolves by `flowId` without projectId filter (line 26-27)
- **Disk storage**: `ProjectStorageService` mirrors DB to `~/.haltest/projects/{id}/`

### 2.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects with flows |
| `/api/projects/:id` | GET | Get project with flows |
| `/api/projects` | POST | Create project |
| `/api/projects/:id` | PUT | Update project |
| `/api/projects/:id` | DELETE | Delete project (cascade) |
| `/api/projects/:projectId/flows/:flowId/export` | GET | Export flow with dependencies (v3) |
| `/api/import/flow-package/:projectId` | POST | Import flow package with components |
| `/api/export/code` | POST | Generate code (Playwright, etc.) |
| `/api/export/json` | POST | Export flow as JSON |

### 2.5 Frontend State Management
- **Project Selector** (`ProjectSelector.jsx`): Native `<select>` with all projects
- **Project Explorer** (`ProjectExplorer.jsx`): Collapsible sidebar with virtualized flow list
- **useProjectManager** (`hooks/useProjectManager.js`): TanStack Query for projects/flows
- **useExplorerStore** (`stores/useExplorerStore.js`): UI state (search, filters, expanded folders)

---

## 3. Current Behavior Analysis

### 3.1 Project Delete
**Backend** (`project.router.js:714-727`):
```javascript
router.delete('/projects/:id', async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  await project.destroy(); // CASCADE deletes canvases, flows, nodes, edges
  res.json({ message: 'Project deleted' });
});
```
- Single project only
- Transactional (sequelize cascade)
- No soft delete
- No confirmation of dependent data count

### 3.2 Project Export
**Flow Export** (`project.router.js:942-1007`):
- Exports single flow + recursive component dependencies
- Returns v3 package: `{ meta, flow, dependencies: { components: [] } }`
- Sanitizes secrets optionally
- **No project-level export exists**

### 3.3 Project Import
**Flow Package Import** (`import.router.js:377-535`):
- Creates new flows for each component with fresh IDs
- Remaps `flowId` references in node data
- Returns hydrated main flow + component mapping
- **No project-level import exists**

### 3.4 Project Switching
- `useProjectManager.loadProject(projectId)` sets current project
- Auto-selects default flow (last used, activeFlowId, "Main Flow", or first)
- Loads full project hierarchy (all flows with nodeCount)

### 3.5 Project List Loading
- `GET /api/projects` returns ALL projects with full flow hierarchy
- No pagination, search, or filtering on backend
- Frontend filters client-side only (SearchFilterBar)

---

## 4. Bulk Delete Feasibility

### YES WITH CHANGES

**Required Changes:**
1. **New API endpoint**: `DELETE /api/projects/bulk` accepting `{ projectIds: string[] }`
2. **Backend**: Transaction spanning multiple project deletions
3. **Frontend**: Multi-select UI in Project Explorer/Selector
4. **Safety**: Confirmation dialog showing impact (project count, flow count, sub-flow count)

**Implementation Approach:**
```javascript
// Backend - bulk delete in transaction
router.delete('/projects/bulk', async (req, res) => {
  const { projectIds } = req.body;
  const transaction = await sequelize.transaction();
  try {
    for (const id of projectIds) {
      await Project.destroy({ where: { id }, transaction });
    }
    await transaction.commit();
    res.json({ deleted: projectIds.length });
  } catch (e) {
    await transaction.rollback();
    res.status(500).json({ error: e.message });
  }
});
```

---

## 5. Project Export Feasibility

### YES WITH CHANGES

**Current Gap:** Flow export exists but not project export.

**Required:**
1. **New endpoint**: `GET /api/projects/:id/export`
2. **Export format**: Self-contained ZIP with manifest + project.json + flows/ + components/
3. **Include**: Project metadata, all flows (main + components), variables, datasets, settings
4. **Sub-flow handling**: Must preserve internal references (component flowIds)

**Format Recommendation:**
```
project-export.zip
├── manifest.json          # { formatVersion, haltestVersion, exportedAt, projectId }
├── project.json           # Full project with flows array (metadata only)
├── flows/
│   ├── {flowId}.json      # Main flows with nodes/edges
│   └── ...
├── components/
│   ├── {flowId}.json      # Component flows
│   └── ...
├── datasets/
│   └── {datasetId}.json
└── variables.json
```

---

## 6. Sub-Flow Dependency Analysis

### Current Behavior
- **Component nodes** store `data.configuration.flowId` referencing another flow
- **FlowResolver** recursively loads sub-flows from DB (max depth 10)
- **DependencyService** resolves for export, sanitizes secrets
- **Cross-project**: Components can reference flows in other projects (no projectId filter)

### Export Strategy
When exporting a project:
1. Collect all flows in project (main + component + loop)
2. Build dependency graph from component node references
3. Include ALL referenced flows (even if type='component' in same project)
4. For cross-project refs: **Include the external component** (snapshot) with metadata noting external origin
5. On import: Recreate all flows, remap internal flowIds, warn about external refs

### Import Strategy
1. Create new project
2. Create all component flows first (leaf nodes of dependency graph)
3. Create main flows, remapping flowId references to new IDs
4. Handle ID collisions by generating new UUIDs
5. Preserve flow hierarchy (parentId)

---

## 7. Import/Export Format Recommendation

### Project Export Format (ZIP)
```json
// manifest.json
{
  "formatVersion": 1,
  "haltestVersion": "1.0.0",
  "exportedAt": "2026-09-07T...",
  "projectId": "original-project-uuid",
  "projectName": "My Project",
  "flowCount": 15,
  "componentCount": 8,
  "hasCrossProjectRefs": false
}

// project.json (subset of DB model)
{
  "id": "new-uuid-on-import",
  "name": "My Project",
  "description": "...",
  "config": { ... },
  "flows": [
    { "id": "flow-1", "name": "Main Flow", "type": "main", "order": 0, "parentId": null },
    { "id": "flow-2", "name": "Auth Component", "type": "component", "order": 0, "parentId": null }
  ]
}

// flows/flow-1.json
{
  "id": "flow-1",
  "name": "Main Flow",
  "viewport": { x: 0, y: 0, zoom: 1 },
  "nodes": [...],
  "edges": [...]
}
```

### Versioning
- Add `formatVersion` in manifest
- Backend validates on import
- Forward-compatible: ignore unknown fields

---

## 8. Project List Scalability

### Current Problems
| Scale | Issue |
|-------|-------|
| 10 projects | Works fine |
| 50 projects | Dropdown unwieldy |
| 100 projects | Slow render, hard to find |
| 500+ projects | Unusable |

### Recommended Solution: **Server-side Search + Virtualized List**

#### Backend Changes
```javascript
// GET /api/projects?search=&page=1&limit=50&sort=updatedAt&order=desc
router.get('/projects', async (req, res) => {
  const { search, page = 1, limit = 50, sort = 'updatedAt', order = 'DESC' } = req.query;
  const where = { userId: req.user.id };
  
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  
  const { count, rows } = await Project.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (page - 1) * limit,
    order: [[sort, order.toUpperCase()]],
    include: [{ model: Flow, as: 'flows', attributes: ['id', 'name', 'type'] }]
  });
  
  res.json({ projects: rows, total: count, page, limit });
});
```

#### Frontend Changes
- Replace `ProjectSelector` native select with custom dropdown
- Use `@tanstack/react-virtual` for project list (already used for flows)
- Debounced search input (300ms)
- Server-side pagination with "Load more" or infinite scroll
- Recent/Favorite projects pinned at top

### UI Components Needed
1. **ProjectSearchInput** - Debounced search with clear
2. **ProjectListVirtualized** - Virtualized list with checkbox selection
3. **ProjectSelectorDropdown** - Replaces native select, supports search + multi-select
4. **BulkActionBar** - Appears when items selected (Delete, Export)

---

## 9. UX Proposal

### Project Selector (Top-Left) - Enhanced
```
┌─────────────────────────────────────────┐
│  📁 My Project          ▼  [+ New]      │
├─────────────────────────────────────────┤
│  🔍 Search projects...                  │
├─────────────────────────────────────────┤
│  ⭐ FAVORITES                           │
│  ☐  Project Alpha        [3 flows]     │
│  ☐  Project Beta         [1 flow]      │
├─────────────────────────────────────────┤
│  📂 RECENT                             │
│  ☐  Project Gamma        [5 flows]     │
│  ☐  Project Delta        [2 flows]     │
├─────────────────────────────────────────┤
│  📋 ALL PROJECTS (47)                  │
│  ☐  Project A            [10 flows]    │
│  ☐  Project B            [3 flows]     │
│  ☐  Project C            [8 flows]     │
│  ...                                    │
├─────────────────────────────────────────┤
│  3 selected  [Export] [Delete] [Cancel] │
└─────────────────────────────────────────┘
```

### Project Explorer (Sidebar) - Bulk Mode
- Checkbox column when in selection mode
- "Select all visible" / "Select all X projects"
- Bulk action bar at bottom

---

## 10. Security / Data Integrity

### Bulk Delete Safety
1. **Confirmation Dialog** showing:
   - Number of projects
   - Total flows (main + components)
   - Warning: "This cannot be undone"
   - Require typing "DELETE" to confirm (for >5 projects)
2. **Soft Delete Option** (future): Add `deletedAt` column, filter by default
3. **Active Project Protection**: Prevent deleting currently loaded project
4. **Permission Check**: Owner only (or admin)
5. **Race Condition**: Use transaction, validate projects exist before delete

### Export/Import Security
1. **Secrets Sanitization**: Default ON for export (strip passwords, tokens)
2. **Import Validation**: Verify formatVersion, schema, no executable code
3. **ID Remapping**: Always generate new UUIDs on import
4. **Cross-project Refs**: Warn but allow; store as metadata

---

## 11. Performance Analysis

| Layer | Current | Target | Action |
|-------|---------|--------|--------|
| Database | Full hierarchy load | Paginated + indexed search | Add indexes on Project.name, updatedAt |
| API | ~500KB for 100 projects | ~50KB per page | Server-side pagination |
| Frontend | All in React state | Virtualized + windowed | React Virtual for projects |
| Render | 100+ DOM nodes | ~20 visible | Virtualized list |

### Database Indexes Needed
```sql
CREATE INDEX idx_projects_user_updated ON "Projects"("userId", "updatedAt" DESC);
CREATE INDEX idx_projects_name_search ON "Projects" USING gin (name gin_trgm_ops);
```

---

## 12. Implementation Plan

### Phase 1: Backend Foundation (Week 1-2)
**Objective**: Core APIs for bulk operations and project export/import

| Task | Files | Dependencies |
|------|-------|--------------|
| 1.1 Add bulk delete endpoint | `project.router.js`, `ProjectManager.js` | None |
| 1.2 Add project export endpoint | `project.router.js`, new `ProjectExportService.js` | DependencyService, FlowResolver |
| 1.3 Add project import endpoint | `import.router.js`, new `ProjectImportService.js` | Flow creation, ID remapping |
| 1.4 Add project search/pagination | `project.router.js` | Database indexes |
| 1.5 Add database indexes | Migration script | None |

### Phase 2: Frontend Project List Overhaul (Week 2-3)
**Objective**: Scalable project selector with search and multi-select

| Task | Files | Dependencies |
|------|-------|--------------|
| 2.1 Create ProjectSelectorDropdown | `components/ProjectSelectorDropdown.jsx` | Phase 1.4 |
| 2.2 Add virtualized project list | `components/explorer/ProjectListVirtualized.jsx` | useVirtualizer |
| 2.3 Add bulk selection state | `stores/useExplorerStore.js` (extend) | Phase 2.1 |
| 2.4 Bulk action bar component | `components/BulkActionBar.jsx` | Phase 2.3 |
| 2.5 Integrate with ExplorerHeader | `ExplorerHeader.jsx` | Phase 2.1-2.4 |

### Phase 3: Bulk Delete Implementation (Week 3)
**Objective**: Safe multi-project deletion

| Task | Files | Dependencies |
|------|-------|--------------|
| 3.1 Bulk delete mutation | `useProjectManager.js` | Phase 1.1 |
| 3.2 Confirmation dialog with impact | `components/BulkDeleteConfirm.jsx` | Phase 1.1 |
| 3.3 Active project protection | `useProjectManager.js`, `ProjectSelectorDropdown` | Phase 3.1 |
| 3.4 Toast notifications | Existing toast system | Phase 3.1 |

### Phase 4: Project Export (Week 4)
**Objective**: Complete project export as ZIP

| Task | Files | Dependencies |
|------|-------|--------------|
| 4.1 ProjectExportService | `services/ProjectExportService.js` | Phase 1.2 |
| 4.2 ZIP generation (JSZip) | `ProjectExportService.js` | npm: jszip |
| 4.3 Export modal for project | `modals/ProjectExportModal.jsx` | ExportModal pattern |
| 4.4 Frontend export handler | `useProjectManager.js`, `App.jsx` | Phase 4.1-4.3 |

### Phase 5: Project Import (Week 5)
**Objective**: Import project from ZIP

| Task | Files | Dependencies |
|------|-------|--------------|
| 5.1 ProjectImportService | `services/ProjectImportService.js` | Phase 1.3 |
| 5.2 ZIP parsing + validation | `ProjectImportService.js` | npm: jszip |
| 5.3 ID remapping logic | `ProjectImportService.js` | Phase 1.3 |
| 5.4 Import modal | `modals/ProjectImportModal.jsx` | ImportModal pattern |
| 5.5 Frontend import handler | `useProjectManager.js`, `App.jsx` | Phase 5.1-5.4 |

### Phase 6: Polish & Testing (Week 6)
**Objective**: Integration testing, edge cases, performance

| Task | Files | Dependencies |
|------|-------|--------------|
| 6.1 E2E tests | `tests/e2e/project-management.spec.js` | All phases |
| 6.2 Performance test (1000 projects) | Script + k6/Playwright | Phase 2 |
| 6.3 Accessibility audit | All new components | Phase 2-5 |
| 6.4 Documentation | README updates | All phases |

---

## 13. Detailed Tasks

### Task 1.1: Bulk Delete Endpoint
- **Objective**: Delete multiple projects atomically
- **Files**: `apps/backend/routes/project.router.js`, `apps/frontend/src/utils/ProjectManager.js`
- **Current**: Single `DELETE /projects/:id`
- **Proposed**: `DELETE /projects/bulk` with `{ projectIds: [] }`
- **Dependencies**: None
- **Risks**: Cascade delete could be slow for large projects; timeout
- **Validation**: Test with 50 projects, verify all related data removed

### Task 1.2: Project Export Endpoint
- **Objective**: Export entire project as self-contained ZIP
- **Files**: `apps/backend/routes/project.router.js`, new `apps/backend/services/ProjectExportService.js`
- **Current**: Flow-level export only
- **Proposed**: `GET /projects/:id/export` → ZIP download
- **Dependencies**: DependencyService, FlowResolver, JSZip
- **Risks**: Large projects → memory; streaming ZIP needed
- **Validation**: Export 100-flow project, verify import works

### Task 1.3: Project Import Endpoint
- **Objective**: Import project from ZIP, recreate all flows
- **Files**: `apps/backend/routes/import.router.js`, new `apps/backend/services/ProjectImportService.js`
- **Current**: Flow-package import only
- **Proposed**: `POST /import/project/:projectId` (multipart/form-data)
- **Dependencies**: Flow creation, ID remapping
- **Risks**: ID collisions, circular refs, cross-project components
- **Validation**: Import exported project, verify flow execution

### Task 1.4: Project Search/Pagination
- **Objective**: Server-side search and pagination for projects
- **Files**: `apps/backend/routes/project.router.js`
- **Current**: `GET /projects` returns all
- **Proposed**: `GET /projects?search=&page=&limit=&sort=&order=`
- **Dependencies**: Database indexes (Task 1.5)
- **Risks**: Breaking frontend if not backward compatible
- **Validation**: Load 500 projects, search <200ms

### Task 1.5: Database Indexes
- **Objective**: Optimize project queries
- **Files**: Migration script (new)
- **Proposed**: 
  - `idx_projects_user_updated` on (userId, updatedAt DESC)
  - `idx_projects_name_trgm` on name (pg_trgm)
- **Dependencies**: None
- **Validation**: EXPLAIN ANALYZE queries

### Task 2.1: ProjectSelectorDropdown
- **Objective**: Replace native select with searchable, multi-select dropdown
- **Files**: New `apps/frontend/src/components/ProjectSelectorDropdown.jsx`
- **Current**: `ProjectSelector.jsx` (native select)
- **Proposed**: Custom component with search, virtualized list, checkboxes
- **Dependencies**: Task 1.4 (backend search)
- **Risks**: Keyboard navigation, accessibility
- **Validation**: Screen reader test, keyboard only navigation

### Task 2.2: Virtualized Project List
- **Objective**: Render 1000+ projects smoothly
- **Files**: New `apps/frontend/src/components/explorer/ProjectListVirtualized.jsx`
- **Current**: Native select (all in DOM)
- **Proposed**: `@tanstack/react-virtual` (already in deps)
- **Dependencies**: Task 1.4
- **Risks**: Dynamic heights, scroll position restoration
- **Validation**: 1000 projects, 60fps scroll

### Task 2.3: Bulk Selection State
- **Objective**: Track selected projects across pages
- **Files**: `apps/frontend/src/stores/useExplorerStore.js` (extend)
- **Current**: No multi-select
- **Proposed**: `selectedProjectIds: Set<string>`, `selectionMode: boolean`
- **Dependencies**: Task 2.1
- **Risks**: Selection persistence across search/page changes
- **Validation**: Select all, filter, verify selection maintained

### Task 2.4: Bulk Action Bar
- **Objective**: Show actions when projects selected
- **Files**: New `apps/frontend/src/components/BulkActionBar.jsx`
- **Proposed**: Fixed bottom bar with Export/Delete, count badge
- **Dependencies**: Task 2.3
- **Risks**: Mobile layout, focus management
- **Validation**: Visual regression, mobile test

### Task 3.1-3.4: Bulk Delete Frontend
- **Objective**: Wire up bulk delete with safety
- **Files**: `useProjectManager.js`, new `BulkDeleteConfirm.jsx`, `ProjectSelectorDropdown.jsx`
- **Dependencies**: Task 1.1, 2.1, 2.3
- **Risks**: Accidental deletion, active project deletion
- **Validation**: Try deleting active project → blocked; undo not needed (hard delete)

### Task 4.1-4.4: Project Export
- **Objective**: One-click project export as ZIP
- **Files**: `ProjectExportService.js`, `ProjectExportModal.jsx`, `useProjectManager.js`
- **Dependencies**: Task 1.2
- **Risks**: Large ZIP memory, streaming needed for >50MB
- **Validation**: Export → Import roundtrip, verify flows execute

### Task 5.1-5.5: Project Import
- **Objective**: Import project ZIP, recreate structure
- **Files**: `ProjectImportService.js`, `ProjectImportModal.jsx`, `useProjectManager.js`
- **Dependencies**: Task 1.3, 4.1 (format)
- **Risks**: Duplicate names, ID conflicts, version mismatch
- **Validation**: Import v1 export, import cross-project refs

---

## 14. Testing Strategy

### Unit Tests
| Component | Scenarios |
|-----------|-----------|
| ProjectExportService | Empty project, single flow, nested components, cross-project refs, large project streaming |
| ProjectImportService | Valid ZIP, invalid format, version mismatch, duplicate names, ID collision, missing deps |
| BulkDeleteMutation | Single, multiple, active project, non-existent, permission denied |
| ProjectSelectorDropdown | Search, multi-select, keyboard nav, a11y, 0/1/1000 projects |

### Integration Tests
- **API**: Bulk delete, export, import, search/pagination
- **Database**: Cascade delete verification, index usage

### E2E Tests (Playwright)
```javascript
// Project Management Flow
test('Bulk delete multiple projects', async () => {
  // Create 5 projects
  // Select 3 in dropdown
  // Click Delete → confirm
  // Verify 2 remain
});

test('Export and import project roundtrip', async () => {
  // Create project with main flow + 3 components
  // Export as ZIP
  // Import as new project
  // Verify all flows execute
});

test('Project list scalability', async () => {
  // Seed 500 projects
  // Search by name → <500ms
  // Scroll virtualized list → 60fps
  // Multi-select across pages
});
```

### Performance Benchmarks
| Metric | Target |
|--------|--------|
| Project list load (500) | < 500ms |
| Search debounce response | < 200ms |
| Virtual scroll (1000) | 60fps |
| Export (100 flows) | < 10s |
| Import (100 flows) | < 15s |
| Bulk delete (50 projects) | < 30s |

---

## 15. Future Scalability (Not Implemented Now)

### Architecture Ready For:
1. **Favorites/Pinned Projects** - Add `isFavorite` to Project, pin to top of list
2. **Archive** - Add `archivedAt` timestamp, filter by default, restore action
3. **Tags** - Many-to-many Project↔Tag, filter by tag
4. **Folders/Groups** - ProjectGroup model, hierarchical organization
5. **Recent Projects** - Already tracked in localStorage (`hal_last_project_id`)
6. **Project Templates** - Export as template, import as new project
7. **Project Sharing** - Extend CollaboratorRole with export/import permissions

### Database Extensions (Future)
```javascript
// Project model additions (when needed)
tags: STRING[] (or many-to-many)
isFavorite: BOOLEAN
archivedAt: DATE
lastAccessedAt: DATE
templateId: STRING (FK to template)
```

---

## 16. Key Files Summary

### Backend (Modify)
| File | Purpose |
|------|---------|
| `apps/backend/routes/project.router.js` | Add bulk delete, export, search endpoints |
| `apps/backend/routes/import.router.js` | Add project import endpoint |
| `apps/backend/services/ProjectExportService.js` | **NEW** - Export logic |
| `apps/backend/services/ProjectImportService.js` | **NEW** - Import logic |
| `apps/backend/database/init.js` | Add indexes (migration) |

### Frontend (Modify)
| File | Purpose |
|------|---------|
| `apps/frontend/src/components/ProjectSelector.jsx` | Replace with ProjectSelectorDropdown |
| `apps/frontend/src/components/ProjectSelectorDropdown.jsx` | **NEW** - Main selector |
| `apps/frontend/src/components/explorer/ProjectListVirtualized.jsx` | **NEW** - Virtualized list |
| `apps/frontend/src/components/BulkActionBar.jsx` | **NEW** - Bulk actions UI |
| `apps/frontend/src/components/BulkDeleteConfirm.jsx` | **NEW** - Safety dialog |
| `apps/frontend/src/components/modals/ProjectExportModal.jsx` | **NEW** - Export options |
| `apps/frontend/src/components/modals/ProjectImportModal.jsx` | **NEW** - Import options |
| `apps/frontend/src/stores/useExplorerStore.js` | Add selection state |
| `apps/frontend/src/components/hooks/useProjectManager.js` | Add bulk mutations, export/import |
| `apps/frontend/src/utils/ProjectManager.js` | Add bulkDelete, exportProject, importProject |

### Shared
| File | Purpose |
|------|---------|
| `apps/backend/services/DependencyService.js` | Already handles sub-flow resolution |
| `apps/backend/core/FlowResolver.js` | Already handles recursive resolution |

---

## 17. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large project export OOM | Medium | High | Stream ZIP, chunk flows |
| Cross-project component refs | Medium | Medium | Snapshot + metadata warning |
| Bulk delete timeout | Low | High | Async job queue (future) |
| Import ID collisions | Medium | Medium | Always generate new UUIDs |
| Search performance (10k projects) | Low | Medium | pg_trgm index, consider Elasticsearch |
| Breaking existing frontend | Medium | High | Version API, feature flag |
| Accessibility regression | Medium | High | Test with screen readers, axe-core |

---

## 18. Conclusion

The current architecture provides solid foundations:
- ✅ Cascade delete works for single projects
- ✅ Flow export/import with dependency resolution exists
- ✅ Virtualized list pattern established for flows
- ✅ TanStack Query for server state management
- ✅ Component registry for cross-project refs

**Key gaps to fill:**
1. Project-level (not flow-level) export/import
2. Bulk operations API + UI
3. Server-side project search/pagination
4. Multi-select project UI

The phased approach minimizes risk by delivering value incrementally:
- Phase 1-2: Backend + scalable list (immediate UX win)
- Phase 3: Bulk delete (high-value, low complexity)
- Phase 4-5: Export/import (complex but isolated)
- Phase 6: Quality assurance