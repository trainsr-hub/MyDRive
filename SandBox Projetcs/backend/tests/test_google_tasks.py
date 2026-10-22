#!/usr/bin/env python3
"""
Google Tasks OAuth & Live Read Diagnostic Test
Run this to perform one-time Google OAuth authorization and verify live task access.
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from integrations.google_tasks.client import GoogleTasksClient

def main():
    print("==================================================")
    print(" [FAUST] GOOGLE TASKS OAUTH & LIVE DIAGNOSTIC")
    print("==================================================")
    client = GoogleTasksClient()
    print(f"[*] Credentials Present: {client.is_credentials_present()}")
    print(f"[*] Authenticated: {client.is_authenticated()}")

    try:
        print("\n[*] Initializing Google Tasks Client (Browser authorization will launch if unauthenticated)...")
        tasklists = client.get_tasklists()
        print(f"\n[SUCCESS] Found {len(tasklists)} Google Task list(s):")
        for tl in tasklists:
            print(f"  - \"{tl.get('title')}\" (ID: {tl.get('id')})")

        primary_id = client.get_primary_tasklist_id()
        tasks = client.list_tasks(tasklist_id=primary_id, show_completed=False)
        print(f"\n[SUCCESS] Retrieved {len(tasks)} active task(s) from primary list:")
        for idx, t in enumerate(tasks, 1):
            print(f"  {idx}. [Active] \"{t['title']}\" (Due: {t.get('due', 'None')})")
        print("\n[DONE] Google Tasks engine initialized and authenticated.")
    except Exception as e:
        print(f"\n[FAIL LOUDLY] Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
