# How to contribute

- [System requirements](#system-requirements)
- [Basics](#basics)
- [Create new example](#create-new-example)
- [Modify existing example](#modify-existing-example)
- [Docs](#docs)

<br/>


## System requirements

> These requirements are only needed for developing the source code of Vike. The npm package `vike` can be used with Windows and with any package manager.

- Node.js `>= v16.0.0`.
- [pnpm](https://pnpm.io/).
  > Install it with `$ npm install -g pnpm`.
- Unix (e.g. Linux or macOS).
  > Windows may work but there are no guarantees.

<br/>


## Basics

#### Install

Download and install the entire monorepo:

```shell
git clone git@github.com:vikejs/vike
# Go to the monorepo root
cd vike/
pnpm install
```

#### Build & Dev

Build Vike's source code:

```shell
# At the monorepo root
pnpm run build
```

Develop vike:

```shell
# At the monorepo root
pnpm run dev
```

#### Run tests

```shell
# At the monorepo root

# Run the end-to-end tests (`/**/*.test.js`)
pnpm exec test-e2e
# Run the unit tests (`/**/*.spec.js`)
pnpm exec vitest
# Typecheck all `.ts` files
pnpm exec test-types
```

> On Debian, [these additional steps](https://github.com/vikejs/vike/issues/283#issuecomment-1072974554) are required.

Run only the tests of one example/boilerplate:

```shell
cd examples/some-example/ # From the monorepo root
pnpm exec test-e2e
```

Alternatively:

```shell
# At the monorepo root
pnpm exec test-e2e ome-exampl
```

<br/>


## Create new example

New examples should be minimal and implement only what you want to showcase.

<br/>


## Modify existing example

Follow the setup instructions at [Basics](#basics).

> The `README` instructions of examples use `npm`. We use `pnpm` instead if we want to install the entire monorepo and build & link Vike's source code.

To run the example:

```shell
cd examples/some-example/ # From the monorepo root
# See package.json#scripts, e.g. package.json#scripts['dev']:
pnpm run dev
```

Check whether the tests defined in `examples/some-example/*.spec.ts` are still valid and make changes accordingly. See [Basics](#basics) for how to run the example's tests.

<br/>


## Docs

To develop Vike's documentation (`https://vike.dev`):

1. Download and install the entire monorepo:
   ```shell
   git clone git@github.com:vikejs/vike
   # Go to the monorepo root
   cd vike/
   pnpm install
   ```

1. Build Vike:
   ```shell
   # At the monorepo root
   pnpm run build
   ```

1. Develop Vike's docs:
   ```shell
   cd docs/ # From the monorepo root
   pnpm run dev
   ```
   Or build Vike's docs:
   ```shell
   cd docs/ # From the monorepo root
   pnpm run build
   ```
