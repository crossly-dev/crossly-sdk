# @crossly/sdk

Official TypeScript SDK for the [Crossly](https://crossly.net) public API.

List once, sell on 15 marketplaces — Poshmark, eBay, Etsy, Mercari, Depop,
Grailed, Vinted, Whatnot, Shopify, Vestiaire, OfferUp, Facebook Marketplace,
Amazon, Walmart, and counting.

> **Not on npm yet.** `@crossly/sdk` is unreleased — the install command below
> will 404 until the first publish. To try it now, clone this repo and build from
> source. Star or watch to hear when it lands.


```bash
npm install @crossly/sdk
```

## Quick start

```ts
import { createClient } from '@crossly/sdk';

const crossly = createClient({ pat: process.env.CROSSLY_PAT! });

// Add an item to your catalog
const item = await crossly.inventory.create({
  defaultTitle: 'Vintage Levi 501s, dark wash',
  defaultPrice: 48,
  brand: 'Levi\'s',
  size: '32x32',
  condition: 'good',
  images: ['https://cdn.example.com/jeans-1.jpg'],
});

// Crosspost to three platforms
await crossly.listings.create({
  inventoryItemId: item.id,
  platforms: ['poshmark', 'mercari', 'depop'],
});

// Watch sales come in
const sales = await crossly.sales.list({ limit: 10 });
```

## Authentication

Every request uses a Personal Access Token. Mint one at
**[Settings → Personal Access Tokens](https://crossly.net/settings)**
in the Crossly web app, scope it to what your integration needs, and pass it
to `createClient`. Tokens start with `crossly_pat_`.

The SDK throws `CrosslyConfigError` if the token is missing or malformed.

## Resources

Every `/api/v1/*` endpoint is wrapped. The namespaces:

| Namespace | Methods | Notes |
|---|---|---|
| `inventory` | list, get, getActivity, create, update, archive, bulkLabels, bulkArchive, bulkDelete, labelsStats, labelsRename | Bulk endpoints for 50k-row select-alls |
| `listings` | list, get, create, update, delist, bulkRelist, bulkCrosspost, bulkDelist, bulkDelete, bulkHardDelete, bulkUpdate, bulkCheckStatus, bulkDelistPreview, byIds | Coordinator returns instantly; fan-out streams to workers |
| `orders` | list, get, submitTracking, refund, updateOrder, dispute, rates, label, pullPlatformLabel, packingSlip, bulkPackingSlips, bulkDelete, bulkMarkShipped, bulkMarkDisputed, bulkExport, counts | EasyPost rate-quote + label purchase + bulk PDF slips |
| `sales` | list, bulkDelete | Soft-delete keeps idempotency cookies + analytics history |
| `inbox` | list, get, reply, offer, updateConversation, conversationMessages, unreadCount, offerAction, cannedResponsesList, cannedResponsesCreate, cannedResponsesUpdate, cannedResponsesDelete, aiSuggest, triageMessage | Includes AI-suggested reply + re-triage |
| `analytics` | summary, byPlatform, timeseries | |
| `accounts` | list, listConnections, create, delete | |
| `connections` | connect, disconnect, refreshStatus, oauthInitUrl, byIdDelete, requestInterest, updatePreferences, imapList, imapCreate, imapUpdate, imapDelete, imapTest, extensionOnline, platformLimits | Programmatic OAuth init + IMAP CRUD + per-platform settings |
| `automation` | listRules, getRule, createRule, updateRule, deleteRule, toggleRule, runRuleNow, getCatalog, listRuns, exportRule, exportRules, importRecipes, validateRecipe | Full rule lifecycle + per-fire history |
| `workflows` | list, get, create, replace, delete, toggle, runNow | Multi-step chains with branching `condition` steps |
| `notifications` | list, create, update, delete, test | Slack / Discord / Webhook destinations |
| `network` | getPool, joinPool, updatePool, leavePool, log, size | Crossly Network reciprocal engagement pool |
| `taxonomy` | categories, children, aspects, suggest, requiredFields, preflight | Per-platform category walks + required-field discovery |
| `webhooks` | list, create, delete, test | |
| `templates` | list, create, update, delete | |
| `imports` | list, get, start | |
| `returns` | list, get, create, update | |
| `customers` | list, get, bulkDelete, bulkExport | Push to HubSpot/Salesforce/Pipedrive/Zoho/custom CRM |
| `reference` | categories, brands | Canonical Crossly taxonomy + brand index |
| `ai` | enhanceListing, enhanceTitle, enhanceDescription, generateListing, magicListing, categorize, categorizeFromImage, extractReceipt, help, status, providers, setKey, deleteKey, testKey | BYO-key supported |
| `tax` | mileage, mileageSummary, scheduleC | |
| `magic` | scan, synthesize, recent, getDraft | Photo-driven AI listing draft |
| `compWatchlists` | list, create, delete, recent, scrape | Competitor-pricing watch |
| `restockPrompts` | list, dismiss, republish | Post-sale restock suggestions |
| `savedViews` | list, create, update, delete | Filter presets |
| `pat` | scopes, list, create, delete | Mint child PATs programmatically |
| `profile` | me, updateMe | |

Total: **150+ endpoints across 27 namespaces**. Anything not yet wrapped is reachable via `crossly.raw.request({ method, path, body, query })`.

## Errors

```ts
import { CrosslyAPIError } from '@crossly/sdk';

try {
  await crossly.orders.refund(orderId, { amount: 25 });
} catch (err) {
  if (err instanceof CrosslyAPIError) {
    console.error(err.status, err.code, err.message);
    if (err.code === 'rate_limited') {
      // back off and retry
    }
  } else {
    throw err;
  }
}
```

## Idempotency

Every mutation method takes an optional `idempotencyKey`. The server stores
the first response for 24h and replays it on any retry with the same key.
Use it for anything where a duplicate would cost money (creating orders,
issuing refunds, sending offers).

```ts
const key = crypto.randomUUID();
await crossly.orders.refund(orderId, { amount: 25 }, { idempotencyKey: key });
// Network blips? Hit it again with the same key — same response, no double-refund.
await crossly.orders.refund(orderId, { amount: 25 }, { idempotencyKey: key });
```

## Custom fetch / non-Node runtimes

Node 18+, modern browsers, Deno, and Bun all work out of the box. For older
Node or Cloudflare Workers, pass your own fetch:

```ts
import { createClient } from '@crossly/sdk';
import { fetch } from 'undici';

const crossly = createClient({ pat: '...', fetch });
```

## Taxonomy preflight

Before crossposting programmatically, discover what each platform needs:

```ts
// One-shot — pick eBay's most likely category from a search phrase,
// then return the normalized field schema for that category.
const preflight = await crossly.taxonomy.preflight('ebay', {
  searchQuery: 'vintage levi 501 denim jacket',
});

// preflight.requiredFields: [{ key, label, master, required, dataType, enumValues? }]
// preflight.inlineAspects:  [{ name, required, dataType, hasEnumValues, enumValues? }]

// Or walk manually
const tops = await crossly.taxonomy.categories('ebay');
const kids = await crossly.taxonomy.children('ebay', tops.categories[0].id);
const aspects = await crossly.taxonomy.aspects('ebay', kids.children[0].id);
```

## Bulk actions

Bulk endpoints accept up to 50k UUIDs and return instantly — the bulk
coordinator worker streams the fan-out in the background, addressable by
the `bulkJobId` in the response:

```ts
const { bulkJobId } = await crossly.listings.bulkRelist({
  listingIds: candidateIds,
  platforms: ['poshmark', 'mercari'],
  filters: { listedMoreThanDays: 30, viewsLessThan: 5 },
}, { idempotencyKey: crypto.randomUUID() });
```

## Workflows + automation runs

```ts
// Build a multi-step chain that fires when a listing sells
await crossly.workflows.create({
  name: 'Post-sale thank you',
  triggerId: 'listing.sold',
  triggerConfig: {},
  steps: [
    { stepType: 'wait', waitMs: 60_000 },
    { stepType: 'action', actionId: 'inbox.send_thank_you', actionConfig: {
      template: 'Hey {{buyerName}}, thanks for the order!',
    }},
    { stepType: 'condition', actionId: 'listing.price_range', actionConfig: {
      minPrice: 100, skipSteps: 1,  // skip the next step if price < $100
    }},
    { stepType: 'action', actionId: 'crm.push_buyer', actionConfig: {
      integrationId: hubspotIntegrationId,
    }},
  ],
});

// Audit fires after the fact
const { runs } = await crossly.automation.listRuns({ limit: 25 });
runs.forEach((r) => console.log(r.status, r.actionType, r.durationMs, 'ms'));
```

## Automation recipes

The `automation` namespace includes the recipe import/export endpoints used
by the [community library](https://github.com/alphajew420/crossly-automations):

```ts
// Pull a recipe straight from the library
const recipe = await fetch(
  'https://raw.githubusercontent.com/alphajew420/crossly-automations/main/recipes/poshmark/share-closet-9am.json',
).then((r) => r.json());

// Validate it against your account's catalog
const { valid, results } = await crossly.automation.validateRecipe(recipe);
if (!valid) throw new Error('Recipe rejected by catalog');

// Install it — active immediately
await crossly.automation.importRecipes(recipe, { activate: true });
```

## License

MIT. Built and maintained by [Crossly](https://crossly.net).
