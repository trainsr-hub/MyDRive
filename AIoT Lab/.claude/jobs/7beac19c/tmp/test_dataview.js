// Test DataviewJS script under multiple simulated Obsidian Dataview environments

function runDataviewTest(testName, mockDv, mockApp) {
    console.log(`\n=== Running Test: ${testName} ===`);
    try {
        const code = `
        (async () => {
            const getAccounts = () => {
                // Layer 1: Dataview current page
                const current = dv.current();
                if (current?.accounts) return current.accounts;
                if (current?.file?.frontmatter?.accounts) return current.file.frontmatter.accounts;

                // Layer 2: Obsidian metadataCache via currentFilePath
                if (dv.currentFilePath && typeof app !== "undefined" && app.metadataCache) {
                    const cache = app.metadataCache.getCache(dv.currentFilePath);
                    if (cache?.frontmatter?.accounts) return cache.frontmatter.accounts;
                }

                // Layer 3: Obsidian metadataCache via active file
                if (typeof app !== "undefined" && app.workspace?.getActiveFile) {
                    const activeFile = app.workspace.getActiveFile();
                    if (activeFile) {
                        const cache = app.metadataCache.getFileCache(activeFile);
                        if (cache?.frontmatter?.accounts) return cache.frontmatter.accounts;
                    }
                }
                return [];
            };

            const rawAccounts = getAccounts();
            const accounts = Array.isArray(rawAccounts)
                ? rawAccounts
                : (rawAccounts?.values ? Array.from(rawAccounts.values) : (rawAccounts ? [rawAccounts] : []));

            if (!accounts || accounts.length === 0) {
                if (dv.paragraph) {
                    dv.paragraph("*(No account metadata found in this note. Ensure 'accounts:' is defined in frontmatter.)*");
                }
                return;
            }

            const escapeHtml = (value = "") =>
                String(value ?? "")
                    .replaceAll("&", "&amp;")
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll('"', "&quot;")
                    .replaceAll("'", "&#039;");

            const formatLink = (raw = "") => {
                if (!raw) return "";
                const str = String(raw).trim();
                const mdMatch = str.match(/^\\[(.*?)\\]\\((.*?)\\)$/);
                if (mdMatch) {
                    const [, label, url] = mdMatch;
                    return \`<a href="\${escapeHtml(url)}" class="external-link" target="_blank" rel="noopener">\${escapeHtml(label)}</a>\`;
                }
                if (str.startsWith("http://") || str.startsWith("https://")) {
                    return \`<a href="\${escapeHtml(str)}" class="external-link" target="_blank" rel="noopener">\${escapeHtml(str)}</a>\`;
                }
                return escapeHtml(str);
            };

            const cards = accounts.map(account => {
                if (!account) return "";
                const rawPasswords = account.hidden_passwords;
                const passwords = Array.isArray(rawPasswords)
                    ? rawPasswords
                    : (rawPasswords?.values ? Array.from(rawPasswords.values) : (rawPasswords ? [rawPasswords] : []));

                const coverImg = account.cover
                    ? \`<img class="account-cover" src="\${escapeHtml(account.cover)}" alt="\${escapeHtml(account.name ?? 'Cover')}">\`
                    : \`<div class="account-cover-placeholder"></div>\`;

                const passwordItems = passwords.length > 0
                    ? passwords.map(p => \`<code>\${escapeHtml(p)}</code>\`).join("")
                    : \`<span class="empty">No stored passwords</span>\`;

                return \`
                    <div class="account-card">
                        \${coverImg}
                        <div class="account-body">
                            <div class="account-name">\${escapeHtml(account.name ?? "Unnamed Account")}</div>
                            \${account.gmail ? \`<div class="account-email">\${escapeHtml(account.gmail)}</div>\` : ""}
                            \${account.drive ? \`<div class="account-links">\${formatLink(account.drive)}</div>\` : ""}
                            <details class="account-passwords">
                                <summary>Passwords (\${passwords.length})</summary>
                                <div class="password-list">\${passwordItems}</div>
                            </details>
                        </div>
                    </div>
                \`;
            }).join("");

            if (dv.container) {
                dv.container.innerHTML = \`
                    <style>
                        .account-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                            gap: 16px;
                            margin-top: 12px;
                        }
                        .account-card {
                            background: var(--background-secondary);
                            border: 1px solid var(--background-modifier-border);
                            border-radius: 8px;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                            transition: transform 0.15s ease, box-shadow 0.15s ease;
                        }
                        .account-card:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
                        }
                        .account-cover {
                            width: 100%;
                            height: 120px;
                            object-fit: cover;
                            background: var(--background-modifier-form-field);
                            border-bottom: 1px solid var(--background-modifier-border);
                        }
                        .account-cover-placeholder {
                            width: 100%;
                            height: 48px;
                            background: var(--background-modifier-form-field);
                            border-bottom: 1px solid var(--background-modifier-border);
                        }
                        .account-body {
                            padding: 14px;
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                            flex-grow: 1;
                        }
                        .account-name {
                            font-size: 1.05em;
                            font-weight: 700;
                            color: var(--text-normal);
                        }
                        .account-email {
                            font-size: 0.88em;
                            color: var(--text-muted);
                            word-break: break-all;
                        }
                        .account-links a {
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                            text-decoration: none;
                            font-size: 0.88em;
                            color: var(--text-accent);
                        }
                        .account-links a:hover {
                            text-decoration: underline;
                        }
                        .account-passwords {
                            margin-top: 6px;
                            padding-top: 6px;
                            border-top: 1px dashed var(--background-modifier-border);
                            font-size: 0.85em;
                        }
                        .account-passwords summary {
                            cursor: pointer;
                            color: var(--text-muted);
                            font-weight: 600;
                        }
                        .password-list {
                            margin-top: 6px;
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                        }
                        .password-list code {
                            background: var(--background-primary);
                            padding: 2px 6px;
                            border-radius: 4px;
                            border: 1px solid var(--background-modifier-border);
                            font-size: 0.85em;
                            color: var(--text-accent);
                            word-break: break-all;
                        }
                        .password-list .empty {
                            color: var(--text-faint);
                            font-style: italic;
                        }
                    </style>
                    <div class="account-grid">
                        \${cards}
                    </div>
                \`;
            }
        })();
        `;

        // Run in eval context as Dataview does
        const fn = new Function('dv', 'app', code);
        fn(mockDv, mockApp);
        console.log(`[PASS] ${testName}`);
    } catch (e) {
        console.error(`[FAIL] ${testName}:`, e);
    }
}

// Test case 1: Normal standard dv.current()
runDataviewTest("Normal dv.current()", {
    current: () => ({
        accounts: [
            {
                name: "Big Topaz",
                gmail: "khadeptraivailon@gmail.com",
                hidden_passwords: [],
                cover: "https://lh3.googleusercontent.com/...",
                drive: "[✉️ Texting](https://drive.google.com/...)"
            },
            {
                name: "Third Account",
                gmail: "third@example.com",
                hidden_passwords: ["pwd1", "pwd2"],
                cover: "https://example.com/cover.jpg",
                drive: "[📁 Drive](https://drive.google.com/...)"
            }
        ]
    }),
    currentFilePath: "ZZ ~ Sandbox/Untitled.md",
    container: { innerHTML: "" },
    paragraph: (msg) => console.log("dv.paragraph:", msg)
}, {
    metadataCache: { getCache: () => null, getFileCache: () => null },
    workspace: { getActiveFile: () => null }
});

// Test case 2: dv.current() returns undefined (indexing lag or sandbox rename), fallback to metadataCache
runDataviewTest("dv.current() is undefined, fallback to app.metadataCache", {
    current: () => undefined,
    currentFilePath: "ZZ ~ Sandbox/Untitled.md",
    container: { innerHTML: "" },
    paragraph: (msg) => console.log("dv.paragraph:", msg)
}, {
    metadataCache: {
        getCache: (path) => ({
            frontmatter: {
                accounts: [
                    { name: "Cached Account", gmail: "cached@gmail.com", hidden_passwords: [] }
                ]
            }
        }),
        getFileCache: () => null
    },
    workspace: { getActiveFile: () => null }
});

// Test case 3: Both dv.current() and metadataCache empty
runDataviewTest("Empty accounts (Graceful fallback)", {
    current: () => ({ accounts: [] }),
    currentFilePath: "ZZ ~ Sandbox/Untitled.md",
    container: { innerHTML: "" },
    paragraph: (msg) => console.log("dv.paragraph rendered:", msg)
}, {
    metadataCache: { getCache: () => null, getFileCache: () => null },
    workspace: { getActiveFile: () => null }
});
