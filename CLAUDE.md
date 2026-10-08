# Claude Code

@AGENTS.md

## Claude-specific notes
- **Browser (route 1):** use Claude in Chrome. Its tools are named `mcp__claude-in-chrome__*`; load them in one ToolSearch call (tabs_context_mcp, tabs_create_mcp, navigate, javascript_tool, tabs_close_mcp). If it isn't connected, tell the person: install it from https://claude.ai/chrome, sign in with the same account as Claude Code, restart Chrome, and say "ready".
- Work in a **new tab** you create, and close it when you're done.
- **Gmail (optional Instamart step):** use the Gmail connector if the person has one (claude.ai Settings → Connectors). Never send, label or delete mail.
