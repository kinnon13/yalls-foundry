# `/docs` - Project Documentation

This directory contains all documentation for Y'alls Foundry.

## 📁 Structure

```
docs/
├── README.md                    This file
│
├── architecture/                System design and architecture
│   ├── 10-SECTION-LOCKDOWN.md  10-section architecture
│   ├── ARCHITECTURE_AUDIT.md   Dynamic vs hardcoded analysis
│   └── ...
│
├── processes/                   Workflows and procedures
│   ├── BRANCHING_STRATEGY.md   Git workflow
│   ├── SOLO_WORKFLOW.md        Solo developer workflow
│   └── ...
│
├── production/                  Production hardening and deployment
│   ├── PRODUCTION_HARDENING.md Production best practices
│   └── ...
│
└── audit/                       Audit reports and findings
    ├── main-snapshot.md        Repository snapshot
    └── verification-report.md  Post-cleanup verification
```

## 📚 Key Documents

### Architecture
- **10-SECTION-LOCKDOWN.md**: Locked architecture with exactly 10 sections
- **ARCHITECTURE_AUDIT.md**: Analysis of what's dynamic vs hardcoded, large files, organization

### Processes
- **BRANCHING_STRATEGY.md**: How we use Git branches
- **SOLO_WORKFLOW.md**: Workflow for solo developers

### Production
- **PRODUCTION_HARDENING.md**: Billion-user scale hardening guide
- Performance optimization
- Security best practices
- Monitoring and alerting

### Audit
- **main-snapshot.md**: Point-in-time repository snapshot
- **verification-report.md**: Post-refactor verification results

## 🔒 Security Note

**All example API keys, tokens, and secrets in docs MUST be clearly marked as examples.**

Use this format:
```markdown
<!-- ⚠️ EXAMPLE ONLY - DO NOT USE REAL KEYS -->
API_KEY=sk_test_EXAMPLE_KEY_DO_NOT_USE
```

## 📝 Documentation Standards

### File Naming
- Use kebab-case: `my-document.md`
- Be descriptive: `authentication-flow.md` not `auth.md`
- Use consistent naming across related docs

### Structure
Every doc should have:
1. **Title** (H1)
2. **Overview** - What this doc covers
3. **Body** - Main content with clear sections
4. **Related Docs** - Links to related documentation
5. **Last Updated** - Date stamp

### Markdown Style
```markdown
# Title (H1 - once per doc)

## Section (H2)

### Subsection (H3)

- Use bullet lists for items
- Use numbered lists for steps
- Use code blocks with language hints
- Use tables for structured data
```

### Code Examples
Always specify language:
````markdown
```typescript
const example = 'with syntax highlighting';
```

```sql
SELECT * FROM users WHERE active = true;
```
````

## 🔄 Keeping Docs Updated

### When to Update
- Architecture changes → Update `architecture/`
- Process changes → Update `processes/`
- Production changes → Update `production/`
- After audits → Add report to `audit/`

### How to Update
1. Edit the relevant doc
2. Update "Last Updated" date
3. Commit with message: `docs: update [filename] - [reason]`
4. Reference in PR description if part of larger change

## 🔍 Finding Documentation

### By Topic
- **How do I...** → Check `processes/`
- **Why is it designed...** → Check `architecture/`
- **How do I deploy...** → Check `production/`
- **What changed...** → Check `audit/`

### Search Tips
Use your IDE's search:
```bash
# Find all docs about authentication
grep -r "authentication" docs/

# Find all docs mentioning rate limiting
grep -r "rate limit" docs/
```

## 📊 Doc Types

| Type | Purpose | Examples |
|------|---------|----------|
| **Architecture** | System design decisions | 10-SECTION-LOCKDOWN.md |
| **Process** | How we work | BRANCHING_STRATEGY.md |
| **Guide** | How to do something | PRODUCTION_HARDENING.md |
| **Reference** | Quick lookup | API-REFERENCE.md |
| **Report** | Point-in-time findings | main-snapshot.md |

## 🚫 What NOT to Put Here

- ❌ Code (use `/src` or `/supabase`)
- ❌ Tests (use `/tests`)
- ❌ Scripts (use `/scripts`)
- ❌ Real secrets (use Lovable Cloud secrets)
- ❌ Build artifacts (auto-generated)

## 🔗 External Resources

- [PROJECT_RULES.md](../PROJECT_RULES.md) - Project-wide rules
- [Lovable Docs](https://docs.lovable.dev/) - Lovable platform docs
- [Supabase Docs](https://supabase.com/docs) - Supabase docs
- [React Docs](https://react.dev/) - React documentation

## ✅ Documentation Checklist

When writing new docs:
- [ ] Clear title and purpose
- [ ] Organized with headers
- [ ] Code examples are tested
- [ ] All secrets are placeholders
- [ ] Links to related docs
- [ ] Date stamp at top or bottom
- [ ] Proper markdown formatting
- [ ] Spell-checked and reviewed

---

**Last Updated**: 2025-10-22  
**Maintainer**: Architecture Team
