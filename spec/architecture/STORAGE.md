# konspekt — storage (spec)

The operations a store provides to read a konspekt instance by reference, and
how an instance declares where its content lives. `TRANSPORT.md` defines the
store contract as two operations, `read` and `write`, over the instance
directory. This document defines the reads a tool performs on top of them when
it holds a reference and needs the content: a source excerpt, an entity, the
edge table, the last checkpoint.

## Atoms carry references, not locations

An atom refers to stored content by content identity only: an RFC 6920
`ni:///sha-256;<base64url>` reference (`SERIALIZATION.md` § Content
references), or an entity id. An atom never contains a store URL, hostname,
collection name or credential. Moving an instance from one store to another
therefore rewrites no atom, and no internal host enters a repository that may be
public.

Where content lives is declared once per instance, in `project.md`
(`SERIALIZATION.md` § Store and locators):

```yaml
store:
  kind: git
  ref: main
  resolve:
    source:      <template>
    command:     <template>
    entity:      <template>
    edges:       <template>
    checkpoints: <template>
```

A template is a string with placeholders: `{hex}` and `{b64}` (the hex and
base64url forms of a content reference's digest), `{path}` (an entity's path in
the `SERIALIZATION.md` layout), `{id}` (an entity id) and `{ref}` (the value of
`store.ref`). A reader substitutes the placeholders to obtain a location it can
fetch. An instance without a `store` block is resolved by the layout
convention, relative to the instance directory.

## Operations

Every store binding provides these four reads. Each is a composition of the
transport `read`; none adds a write path.

| operation | input | returns |
|-----------|-------|---------|
| `getSource(ref)` | a content reference, optionally with a channel prefix (`command:`) | the stored bytes |
| `getEntity(id)` | an entity id | the entity file: front-matter and body |
| `getEdges()` | — | the edge table |
| `getLastCheckpoint()` | — | the last row of the checkpoint log and the bytes of the excerpt its `source` names |

- `getSource` MUST return the bytes unchanged. The caller verifies them: SHA-256
  over the returned bytes equals the reference's digest
  (`RECONCILIATION.md` § Verify probe). A store that cannot find the content
  reports it missing; it does not substitute other content.
- `getSource` reads the channel from the reference's prefix: no prefix is a
  source excerpt, `command:` is an executed command (a persona-layer channel).
- A legacy git-blob-SHA-1 reference (`SERIALIZATION.md` § Content references)
  is resolved by the layout convention, `<dir>/<sha1>.md`, and verified by
  `git hash-object`.

## Bindings

**git.** `kind: git`. The instance is a directory in a repository. Content is
read from the working tree or from a revision named by `store.ref`. The
templates follow the layout:

```yaml
store:
  kind: git
  ref: main
  resolve:
    source:      https://github.com/<owner>/<repo>/blob/{ref}/<instance>/sources/sha-256/{hex}.md
    command:     https://github.com/<owner>/<repo>/blob/{ref}/<instance>/commands/sha-256/{hex}.md
    entity:      https://github.com/<owner>/<repo>/blob/{ref}/<instance>/{path}
    edges:       https://github.com/<owner>/<repo>/blob/{ref}/<instance>/edges/edges.md
    checkpoints: https://github.com/<owner>/<repo>/blob/{ref}/<instance>/checkpoints/checkpoints.md
```

The document and relational examples below are illustrative: no binding for
either is implemented yet, and a binding's own documentation fixes the exact
template syntax it reads.

**Document store (e.g. MongoDB).** A collection per kind of content; the
document key of a source or command is its hex digest, and of an entity its id:

```yaml
store:
  kind: mongodb
  resolve:
    source:  sources/{hex}
    command: commands/{hex}
    entity:  entities/{id}
    edges:   edges
    checkpoints: checkpoints
```

**Relational store (e.g. Postgres).** A table per kind of content, keyed the
same way:

```yaml
store:
  kind: postgres
  resolve:
    source:  sources?hex={hex}
    command: commands?hex={hex}
    entity:  entities?id={id}
    edges:   edges
    checkpoints: checkpoints
```

The non-git templates name collections and tables, never hosts or credentials;
connection details stay in the reading tool's configuration, outside the
instance.

## The well-known read path

A konspekt read server SHOULD serve each stored source and command at the
RFC 6920 well-known path:

```
https://<host>/.well-known/ni/sha-256/<base64url>
```

returning the raw bytes, so a tool that knows RFC 6920 and nothing about
konspekt can fetch content by reference. This is a recommendation, not a
conformance requirement: a git-only instance has no server, and a repository
host cannot serve `.well-known` paths from a repository. For such an instance
the `project.md` templates are the way to resolve. The implementation-zero
server (`implementations/implementation-zero/app/server.mjs`) serves the path.

## Conformance

A binding conforms to this document iff each of the four operations returns
what the table above states for every reference the instance holds, and
`getSource` returns bytes that pass the verify probe. The store adjudicates
nothing: review, acceptance and verification happen in the reading tool and the
conversation (`TRANSPORT.md` § Review lives in the conversation).
