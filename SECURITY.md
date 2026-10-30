# Security

AREC documents carry recording-derived content, so parts of the specification
are security rules: diagnostics must never carry headers, bodies, cookies,
tokens or raw query values, and a reader removes those keys and the query values
in diagnostic URLs before it uses or passes on what it read. The strict check
flags a string that begins with a URL carrying a raw query value; a URL later
in free text (a console message or a `text` block) is the producer's to redact,
and the reader strips parameter values from every URL it finds in a
diagnostics section.

If you find a way for a document to leak secrets through a conformant reader,
or for the strict check to accept a document that breaks those rules, please
report it privately to security@clipy.online rather than opening a public
issue.

For vulnerabilities in Clipy's hosted service, see
https://clipy.online/security.
