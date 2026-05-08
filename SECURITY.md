# Security Policy

## Supported Versions

OpenFinch is currently in early development (pre-1.0). Security updates are provided for the latest release only.

## Reporting a Vulnerability

If you discover a security vulnerability in OpenFinch, please report it privately:

1. **Do not** open a public GitHub issue.
2. Email the maintainers or open a GitHub Security Advisory.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You can expect:

- **Acknowledgement** within 48 hours
- **Initial assessment** within 5 business days
- **Fix timeline** based on severity

## Scope

- API endpoints and authentication
- MCP server communication
- Docker container security
- Data isolation between users
- LLM API key handling

## Out of Scope

- Issues in third-party dependencies (report to upstream)
- Self-inflicted issues from misconfiguration
- Attacks requiring physical access

## Self-Hosted Security

Since OpenFinch is self-hosted:

- Keep your Docker and Node.js versions up to date
- Use firewall rules to restrict API access
- Do not expose the dashboard or API to the public internet without authentication
- Regularly rotate LLM API keys
- Monitor logs for unusual activity

Thank you for helping keep OpenFinch secure.
