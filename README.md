<div align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/casomer-cms/website/main/docs/casomer-dark.svg">
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/casomer-cms/website/main/docs/casomer-light.svg">
        <img alt="casomer" height="96" src="https://raw.githubusercontent.com/casomer-cms/website/main/docs/casomer-w-bg.svg">
    </picture>
    <div><a href="https://www.npmjs.com/package/casomer"><img alt="npm" src="https://img.shields.io/npm/v/casomer?label=npm&color=E8A13D"></a></div>
    <h2>The JSON-native CMS. Visual editing in, static sites out.</h2>
    <div><a href='https://ko-fi.com/G0G2231VF9' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a></div>
    <div><span>&nbsp;</span></div>
</div>

Your whole site - content, components, structure - lives as JSON. Publish compiles it to pre-rendered static HTML with view transitions that make static feel alive. Git-friendly. Self-host it, or let casomer cloud handle the nitty gritty.

> ⚠️ **Casomer is in early active development.** Watch this repo or check [casomer.com](https://casomer.com) for the first real release.

## Install

Install once globally, then run `caso` in any project:

```bash
npm install -g casomer
cd my-project
caso
```

The `caso` command currently prints a friendly note. Soon it will build websites.

## Pages

The homepage is `dist/index.html`. Other pages are folders with their
own `index.html` (`dist/supporters/`, `dist/license/`, `dist/thanks/`), which the
Worker's asset serving resolves as `/supporters` and `/license`; no
router is involved. Those two are draft 1, unlisted: `noindex` and
no links from the homepage until they are ready.

## casomer.cloud

Not here. The Cloud domain, its landing page, and later the hosted
Studio all come from the private cloud repo, so one place owns that
domain. This repo is casomer.com only.

## The relay

casomer.com is a static site plus one small Worker (`src/relay.ts`).
The Worker serves `dist/` and forwards a handful of `/api/*` routes
to Casomer Cloud, which holds the signing key and the registry:
verifying keys, activating licenses, the supporter wall, and Stripe
checkout (`/api/checkout`; the pages start it, `/thanks` confirms it). Nothing
here decides anything, and the only secret is the relay token, set
with `wrangler secret put CLOUD_RELAY_TOKEN`. `CLOUD_ORIGIN` is a
plain var in `wrangler.jsonc`.

---

© Casomer™. All rights reserved.
