<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Coding conventions

- Prefer simple code over complicated code.
- Prioritize readability and use clear, descriptive variable names.
- Treat separation of concerns as a core design rule. Use dedicated components whenever it makes sense, and give each a clear responsibility.
- Define clear interfaces and contracts between components.
- Test those contracts and observable behavior, not implementation details.
- Follow existing project patterns and Vite+ conventions.
- Keep changesets small and focused.

## Styling

- Make the first iteration work with plain HTML and little to no styling.
- Use CSS only for small layout adjustments at first.
- Leave visual polish for a later iteration.

## Commit conventions

- Use Conventional Commits, such as `feat:`, `fix:`, `docs:`, and `chore:`.
- Keep commit subjects short and clear.
- Commit automatically after each small, atomic set of changes.
- Commit throughout feature development; do not wait until the whole feature is done.
- Run broader validation, including `vp check`, `vp test`, and any relevant project scripts, when a feature is complete. It is not required after every intermediate commit.

## Human-facing language

- Use simple, short, concise language in all human-facing text, including UI text, documentation, comments, and commit messages.
- Bullet points are encouraged, but not required.
