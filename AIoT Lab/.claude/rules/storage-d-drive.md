# Strict Local Disk D: Installation & Download Invariant

### Non-Negotiable Rule
- **Target Drive**: **`D:\` (Local Disk D:) ALWAYS**.
- **Drive Philosophy (Sovereign D: vs Disposable C:)**:
  - `C:\` is treated as a strictly **disposable OS substrate**. In the event of a Windows reinstallation or OS wipe, `C:\` will be erased clean. Nothing irreplaceable or constructed with Faust may reside permanently on `C:\`.
  - `D:\` is our **sovereign permanent vault**. All original configurations, intelligence cores, master directories, memories, skills, templates, tools, and installed plugins reside natively on `D:\` (synchronized via Google Drive across all workstations).
  - Any path required by the OS or tools on `C:\` (such as user profile directories) must only exist as **NTFS Directory Junctions (`mklink /J`)** pointing to their master originals on `D:\`.
- **Software & Tool Locations**:
  - Under no circumstances should software, packages, AI models, CLI tools (e.g. GitHub CLI), binaries, virtual environments, caches, or downloaded assets ever be placed on `C:\` or default OS user folders unless strictly required by the Windows kernel.
  - Any temporary downloads must use `D:\Temp\`.
  - All persistent applications, tools, and runtimes must reside in `D:\Program Files\`, `D:\Program Data\`, or within `D:\My Drive\Blue AI\`.
