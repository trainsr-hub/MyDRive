# Rebased: Hazard Trigger Full-Stack Reconstruction

## Overview

Rebased is a standalone full-stack project that merges the **Hazard Trigger** gacha-driven prompt engineering system with **Rose's** 5-tier SQLite architecture. It provides a deterministic, zero-LLM approach to AI art prompt generation with weighted node sampling and preset management.

**Status**: Ready for development

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Installation

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Development

```bash
# Windows
./run.bat

# Linux/Mac
./run.sh
```

Frontend opens at `http://localhost:5173`
Backend API at `http://localhost:20140`

## Architecture

### Backend (FastAPI + SQLite)

- **Port**: 20140
- **Database**: SQLite with WAL mode, IMMEDIATE transactions
- **Schema**: 5-tier relational (categories, nodes, pools, presets, wildcards)
- **Key Features**:
  - Deterministic graph resolver (zero LLM)
  - Weighted random sampling for gacha mechanics
  - REST API for full CRUD operations
  - Graceful error handling and logging

### Frontend (React 18 + TypeScript + Vite)

- **Port**: 5173
- **State Management**: Zustand with Immer middleware
- **Styling**: Tailwind CSS with custom hazard theme
- **Key Features**:
  - Real-time node matrix grid with search/filter
  - Preset management and loading
  - Output panel with prompt assembly
  - Gacha pool inspector
  - Dark theme with theme-aware tokens

## File Structure

```
Rebased/
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── db.py                   # 5-tier SQLite schema
│   ├── models.py               # Pydantic models
│   ├── graph_resolver.py       # Deterministic resolver
│   ├── seed_data.py            # Database initialization
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                # React components
│   │   ├── store/              # Zustand store
│   │   ├── types/              # TypeScript definitions
│   │   ├── styles/             # Global styles
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
├── run.bat                      # Windows launcher
├── run.sh                       # POSIX launcher
└── README.md
```

## API Endpoints

### Categories
- `GET /api/categories` - List all
- `POST /api/categories` - Create
- `DELETE /api/categories/{id}` - Delete

### Nodes
- `GET /api/nodes` - List (optional filter by category_id)
- `POST /api/nodes` - Create
- `PUT /api/nodes/{id}` - Update
- `DELETE /api/nodes/{id}` - Delete

### Pools
- `GET /api/pools` - List all
- `POST /api/pools` - Create
- `DELETE /api/pools/{id}` - Delete

### Presets
- `GET /api/presets` - List all
- `POST /api/presets` - Create
- `DELETE /api/presets/{id}` - Delete

### Graph Resolution
- `POST /api/graph/resolve?preset_id=<id>&seed=<seed>` - Resolve prompt graph

## Database Schema

### Tables
1. **categories** (0002...): Node groupings with hierarchy
2. **nodes** (0001...): Prompt nodes with weights and rarity
3. **pools** (0003...): Gacha pools with weighted items
4. **presets** (0004...): Saved configurations
5. **wildcards** (0005...): Token replacement patterns (future)

### Key Properties
- Hex IDs with prefixes for fast type identification
- Foreign key constraints with cascade deletes
- JSON fields for flexible data structures
- WAL mode for concurrent access

## Key Concepts

### Hex ID Format
- 16-character uppercase hex: `<4-char prefix><12-char unix ms>`
- Prefixes: 0001=nodes, 0002=categories, 0003=pools, 0004=presets, 0005=wildcards

### Gacha System
- Weighted random sampling without replacement
- Per-node default weights
- Gacha pool draw counts
- Wildcard expansion in tokens

### Graph Resolution
- Deterministic algorithm (seeded random)
- Active node selection
- Weight modifier application
- Exclusion rule enforcement
- LoRA extraction
- Prompt assembly with weights

## Development Notes

### Code Style
- Max 300 lines per file (4-tier separation)
- Strict typing (Pydantic models + TypeScript interfaces)
- No untyped dictionaries across layer boundaries
- Clean folder structure with clear responsibilities

### Testing
- Backend: Manual API testing with curl/Postman
- Frontend: Component testing with user interactions
- Integration: End-to-end preset resolution workflow

### Deployment
- Backend: `python -m uvicorn main:app --host 0.0.0.0 --port 20140`
- Frontend: `npm run build` produces `dist/` directory

## TODOs

- [ ] Wildcard system with token replacement
- [ ] Exclusion rules UI
- [ ] Export formats (JSON, CSV, ComfyUI JSON)
- [ ] Preset import/export
- [ ] User authentication
- [ ] Database migrations

## License

MIT

## Author

Faust & The Manager

---

Built with precision, zero speculation, and golden standards.
