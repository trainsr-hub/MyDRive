# n8n Workflows Repository

This directory serves as the version-controlled repository for our n8n automation workflows.

## Architecture

- **Engine & Runtime**: Installed natively on Local Disk `D:\` (`D:\Program Data\n8n\runtime`).
- **Data & Credentials**: Preserved in `D:\Program Data\n8n\data` (with NTFS Junction `C:\Users\Admin\.n8n` pointing directly to Local Disk `D:\`).
- **Workflow Definitions**: Exported and tracked in this directory (`d:\My Drive\SandBox Projetcs\n8n_workflows\`) as declarative JSON schemas.

## Workflow Import / Export

1. **Importing into n8n**:
   - Open n8n at `http://localhost:5678`.
   - In the canvas, open the top-right menu (three dots) -> **Import from File...**
   - Select any `.json` workflow file from this directory.

2. **Exporting from n8n**:
   - In the canvas menu -> **Download**.
   - Save the file here to commit it into Git.
