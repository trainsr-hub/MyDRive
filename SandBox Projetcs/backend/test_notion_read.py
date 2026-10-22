#!/usr/bin/env python3
"""
Notion Connection Live Verification Runner
Tests genuine connection to Notion API using credentials in .env
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from notion_client import NotionClient

def main():
    print("==================================================")
    print(" [FAUST] NOTION CONNECTION LIVE VERIFICATION")
    print("==================================================")
    client = NotionClient()
    print(f"[*] Configured: {client.is_configured()}")
    print(f"[*] Target Database ID: {client.database_id}")

    if not client.api_key:
        print("[FAIL LOUDLY] NOTION_API_KEY is not set in .env")
        sys.exit(1)

    try:
        print("[*] Dispatching query to Notion REST API...")
        res = client.query_database()
        tasks = client.parse_tasks(res)
        print(f"\n[SUCCESS] Retrieved {len(tasks)} tasks from Notion:")
        for idx, t in enumerate(tasks, 1):
            print(f"  {idx}. [{t['status']}] {t['title']} | Priority: {t['priority']} | Tags: {t['tags']}")
        print("\n[DONE] Notion data engine verified successfully.")
    except Exception as e:
        print(f"\n{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
