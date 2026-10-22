const fs = require('fs');

const mockAccounts = [
    {
        name: "Big Topaz",
        gmail: "khadeptraivailon@gmail.com",
        hidden_passwords: ["topaz_secret_1", "backup_pin_99"],
        cover: "https://lh3.googleusercontent.com/a/ACg8ocJt-6QAt1g4cAl8noORhvNl-_XkAtN017di8sywiU9lBmvPwsWX=s288-c-no",
        drive: "[✉️ Texting](https://drive.google.com/drive/folders/14DEA4fDR1bdQnqU5Dt8q3S9K06UUhvH8?usp=drive_link)"
    },
    {
        name: "Another Account",
        gmail: "example@gmail.com",
        hidden_passwords: [],
        cover: "https://example.com/cover.jpg",
        drive: "[📁 Drive](https://drive.google.com/...)"
    },
    {
        name: "Third Account",
        gmail: "third@example.com",
        hidden_passwords: ["password_a", "password_b"],
        cover: "",
        drive: "[📁 Drive](https://drive.google.com/...)"
    }
];

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
    const mdMatch = str.match(/^\[(.*?)\]\((.*?)\)$/);
    if (mdMatch) {
        const [, label, url] = mdMatch;
        return `<a href="${escapeHtml(url)}" class="account-link-btn" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
    }
    if (str.startsWith("http://") || str.startsWith("https://")) {
        return `<a href="${escapeHtml(str)}" class="account-link-btn" target="_blank" rel="noopener">🔗 Link</a>`;
    }
    return `<span class="account-link-text">${escapeHtml(str)}</span>`;
};

const cards = mockAccounts.map(account => {
    if (!account) return "";
    const rawPasswords = account.hidden_passwords;
    const passwords = Array.isArray(rawPasswords)
        ? rawPasswords
        : (rawPasswords?.values ? Array.from(rawPasswords.values) : (rawPasswords ? [rawPasswords] : []));

    const initial = (account.name || "A").trim().charAt(0).toUpperCase();

    const avatarHtml = account.cover
        ? `<img class="account-avatar" src="${escapeHtml(account.cover)}" alt="${escapeHtml(account.name ?? 'Avatar')}">`
        : `<div class="account-avatar-placeholder">${escapeHtml(initial)}</div>`;

    const emailHtml = account.gmail
        ? `<a href="mailto:${escapeHtml(account.gmail)}" class="account-email" target="_blank" rel="noopener" title="Email: ${escapeHtml(account.gmail)}">
             <span class="account-icon">✉️</span> ${escapeHtml(account.gmail)}
           </a>`
        : "";

    const passwordItems = passwords.length > 0
        ? passwords.map(p => `<code class="password-chip">${escapeHtml(p)}</code>`).join("")
        : `<span class="empty-passwords">No stored passwords</span>`;

    return `
        <div class="account-card">
            <div class="account-header">
                ${avatarHtml}
                <div class="account-title-group">
                    <div class="account-name">${escapeHtml(account.name ?? "Unnamed Account")}</div>
                    ${emailHtml}
                </div>
            </div>

            <div class="account-body">
                ${account.drive ? `<div class="account-links">${formatLink(account.drive)}</div>` : ""}

                <details class="account-passwords">
                    <summary>
                        <span class="passwords-label">🔒 Passwords</span>
                        <span class="passwords-badge">${passwords.length}</span>
                    </summary>
                    <div class="password-list">${passwordItems}</div>
                </details>
            </div>
        </div>
    `;
}).join("");

console.log("Rendered cards output successfully. Cards length:", cards.length);
