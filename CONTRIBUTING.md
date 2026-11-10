# Contributing

## Requirements

- Node.js 22 and npm
- Docker, to build and run the container

## Local setup

```bash
git clone https://github.com/vitlixe/staqtype.git
cd staqtype
npm ci
npm run dev
```

## Development workflow

CI runs the same checks on every push and pull request:

```bash
npm run lint
npx vitest run
npm run build
```

## Making changes

### Adding a lesson

1. Append an object to the `lessons` array in `src/data/lessons.ts`:

   ```ts
   {
     id: "python-rotate-backups", // stable slug: stored results reference it
     title: "Rotate old backups",
     difficulty: "beginner",      // beginner | intermediate | advanced
     language: "python",          // a key of LANGUAGES in src/data/languages.ts
     text: `...`,                 // the exact text to retype
   }
   ```

2. Write the template literal at column 0: every character in it is part of the exercise.
3. Keep snippets realistic and roughly 5 to 30 lines. Indent with spaces, except languages that use real tabs (Go, Makefile); never mix both in one lesson.
4. Never rename an existing `id`: saved progress is keyed by it.

`src/data/lessons.test.ts` checks ids, languages, trailing whitespace and mixed indentation.

### Adding a language

Add the language id and its dot color to `LANGUAGES` in `src/data/languages.ts`. The order there is the order of the filter buttons.

To run the production image locally:

```bash
docker build -t staqtype .
docker run --rm -p 8080:8080 staqtype
```

## Releases

The version lives only in the `VERSION` file (`X.Y.Z`); the build reads it, shows it on the settings page and serves it at `/VERSION`.

1. Bump `VERSION` and commit.
2. Tag the commit `vX.Y.Z` (it must equal `VERSION`) and push the tag.
3. CI runs the checks, builds the image and installs it with `compose.yaml`, serves `staqtype.tar.gz` with stock nginx, then pushes `ghcr.io/vitlixe/staqtype:X.Y.Z` and `:latest` (amd64 and arm64) and publishes the GitHub release with `compose.yaml`, `staqtype.tar.gz` and `checksums.sha256`.
