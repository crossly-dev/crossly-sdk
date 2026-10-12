# Crossly TypeScript SDK

Official TypeScript clients for the Crossly APIs. Zero runtime dependencies.

Crossly has two APIs with separate keys: the **seller** API runs a store, the **buyer** API is for shoppers. Each has its own package in this repo.

| Folder | Package | For |
|---|---|---|
| [`seller/`](./seller) | `@crossly/sdk` | the seller API: inventory, listings, crossposting, orders, automations |
| [`buyer/`](./buyer) | `@crossly/buyer-sdk` | the buyer API: cart, orders, wishlists, offers and cashback for shoppers |

```bash
npm install @crossly/sdk
npm install @crossly/buyer-sdk
```

Each folder has its own README with setup and examples. Docs: https://crossly.net/docs

_Synced from the Crossly monorepo at 284f6a8f7. Open issues here; pull requests are welcome but are applied upstream._
