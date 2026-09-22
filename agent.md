# Agent Guidelines

## Project Identity

Record of the Cup is an app for discovering, understanding, recommending, and recording cocktails and wine. It should feel like a reliable drinking companion: useful at the moment of choosing a drink, clear when learning about one, and light enough to use after trying it.

The app combines three core behaviors:

- Search for cocktails, recipes, wines, regions, grapes, ingredients, and flavor profiles.
- Recommend drinks based on mood, taste, available ingredients, food pairing, and user history.
- Record personal tasting notes, ratings, favorites, and drinking experiences.

## Product Priorities

1. Make search fast and forgiving.
2. Make recommendations explainable.
3. Make records quick to create.
4. Keep wine and cocktail information trustworthy and readable.
5. Support beginners without making expert users feel slowed down.

## Current Product Baseline

The current first screen is a mobile-first React home screen.

Current user-facing areas:

- Home
- Search
- Saved
- Notes
- Settings

Current home content:

- Hero area
- Search
- Mood filters
- Recommended drinks
- Category strip
- Recipe preview
- Recent notes
- Bottom navigation

`design.md` owns visual and interaction design rules only. Product behavior, API, database, authentication, privacy, and technical guidance belong here in `agent.md`.

## User Experience Rules

- The first screen should help users act immediately: search, get a recommendation, or continue a recent note.
- Avoid making the app feel like a marketing landing page. Build the actual product experience first.
- Do not bury the search field. Search is a primary action, not a secondary utility.
- Recommendations must include a clear reason, such as matching flavor, available ingredients, food pairing, or past ratings.
- Recording should be possible in under a minute with optional deeper notes.
- Cocktail and wine cards may share a common layout, but their details should respect the difference between recipe data and tasting data.
- Empty, loading, and API failure states must feel calm and useful.
- The app should never shame users for not knowing terminology.

## Content And Safety Rules

- Do not encourage excessive drinking.
- Do not target minors or use playful language that makes alcohol feel child-oriented.
- Do not present alcohol as a health benefit.
- Include responsible drinking language where contextually appropriate, especially near recommendation and record flows.
- Treat ABV, serving size, and ingredient information as factual data that may be incomplete depending on the API.
- When API data is missing or uncertain, label it clearly instead of inventing details.

## Design Boundaries

Detailed visual direction belongs in `design.md`.

When implementing UI, follow `design.md` for:

- Visual tone
- Color direction
- Layout direction
- Typography
- Component appearance
- Responsive visual behavior

Do not move product, API, database, authentication, or technical implementation rules into `design.md`.

## Technical Rules

- Current stack is Vite, React, JavaScript, CSS, and Supabase.
- Keep external API logic behind dedicated service modules.
- Do not let UI components call third-party APIs directly.
- Normalize cocktail and wine data into app-friendly models before rendering.
- Separate public drink data from private user records.
- Cache API responses where appropriate to reduce repeat calls and improve perceived speed.
- Always handle missing fields, rate limits, network failures, and partial API responses.
- Use stable identifiers for saved drinks and user notes.
- Keep recommendation logic explainable and testable.

## Project Files

- `agent.md` is the product, architecture, data, API, and engineering guidance file.
- `design.md` is the visual and interaction design guidance file.
- `web/src/App.jsx` contains the current React app screen.
- `web/src/App.css` contains the current app styling.
- `web/src/index.css` contains global styles and CSS variables.
- `web/src/main.jsx` mounts the React app and loads Supabase setup.
- `web/src/lib/supabaseClient.js` creates the Supabase client from environment variables.
- `web/.env` stores local Supabase environment values and must not be committed.
- `web/.env.example` documents required environment variables.
- `web/dist` is build output and may remain after running `npm run build`.
- `web/node_modules` is installed dependencies and should not be edited manually.

## Supabase And Authentication

Supabase is used for authentication and user-owned data.

The app should use:

- Supabase Auth for login.
- Supabase Postgres for favorites, records, notes, and preference data.
- Row Level Security for every private user table.
- `auth.uid()` based policies so users can only access their own private data.

Recommended login order:

1. Email and password login
2. Google login
3. Apple login later if needed

Never put a Supabase `service_role` key in the frontend or `.env` used by Vite.

Frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Data Model Guidance

Use separate concepts for:

- `Drink`: shared display model for cocktail or wine summaries.
- `Cocktail`: recipe-specific details such as ingredients, measurements, technique, garnish, and glassware.
- `Wine`: wine-specific details such as grape, region, vintage, body, acidity, tannin, sweetness, and pairing.
- `UserRecord`: personal rating, tasting note, tags, date, location, and private comments.
- `PreferenceProfile`: user taste signals derived from saved ratings, favorites, filters, and notes.

## Initial Database Direction

Start by storing only user-owned data. Do not copy every external API drink into the database in the first version. External drink data should be fetched, normalized for display, and saved only when the user favorites it, records it, or writes a note.

Initial Supabase tables:

- `profiles`: one row per authenticated user. Stores nickname, avatar URL, and lightweight preferred drink types.
- `favorites`: private saved drinks. Stores the external source, external drink ID when available, drink type, name, image, and owner.
- `drink_records`: private tasting records. Stores rating, tasted date, short note, flavor tags, occasion, location, price, pairing, and whether the user would drink it again.
- `drink_notes`: private free-form notes. Can be connected to a tasting record or attached directly to an external drink.
- `user_preferences`: private recommendation signals such as preferred drink types, liked flavors, avoided flavors, and preferred strength.

Shared drink reference fields:

- `drink_type`: `cocktail`, `wine`, or `whiskey`. Whiskey is allowed in the schema so it can be added later without another early migration.
- `source`: where the drink came from, such as `cocktaildb`, a future wine API, or `manual`.
- `external_id`: the API's stable ID when one exists.
- `drink_name` and `image_url`: enough display data to keep saved lists useful even if the API response changes.

Recommended ownership policy:

```sql
user_id = auth.uid()
```

For `profiles`, the owner check is:

```sql
id = auth.uid()
```

All private user tables must have RLS enabled before app features write real data.

## API Direction

The first cocktail API candidate is TheCocktailDB.

The app should connect cocktail and wine APIs through internal adapter modules. The UI should consume normalized app data, not raw API responses.

Recommended API flow:

1. User searches or selects a recommendation filter.
2. App calls an internal search or recommendation service.
3. Service calls cocktail and wine API adapters.
4. Raw responses are normalized.
5. UI renders shared drink summaries.
6. User saves favorites or records notes.

Whiskey can be added later as a category when a useful API or dataset is available.

## Data Operations Direction

For the portfolio version, the app is planned as a personal-use service that will still be deployed publicly. Operational choices should stay simple, but the data flow should look intentional and production-minded.

Recommended operating flow:

1. External cocktail and wine APIs provide original drink data.
2. Internal adapter modules fetch and normalize API responses.
3. Supabase stores app-owned data that the user has saved, recorded, or edited.
4. React screens primarily read normalized data and user-owned records from Supabase.
5. Search, recommendation, favorites, and notes use the app's normalized data shape instead of raw API payloads.

Do not bulk-copy every external API item into Supabase at the start. Store external drink data when it becomes meaningful to the app, such as when the user favorites a drink, creates a tasting record, writes a note, or when a curated recommendation needs stable display data.

The app should treat sources as follows:

- External APIs are source data providers.
- Supabase is the app's working data store.
- React is the client experience layer and should avoid depending on raw third-party API response shapes.

This keeps the deployed portfolio app stable even if an external API is slow, temporarily unavailable, rate-limited, or changes response fields. It also makes the app feel like it manages its own data rather than only displaying another service's API response.

When an external API requires a private API key, do not call it directly from the Vite frontend. Route that request through a server-side layer such as a Supabase Edge Function before saving or returning normalized data.

## Recommendation Principles

Recommendations should explain themselves.

Examples:

- Matches your preference for citrus and herbal cocktails.
- Pairs well with grilled fish.
- Similar to wines you saved.
- Good for a light drink tonight.

Start with simple rules before adding advanced scoring.

## Records And Notes

Records should be private by default.

The record flow should start simple:

- Drink
- Rating
- Date
- Short note

Optional fields can come later:

- Flavor tags
- Occasion
- Location
- Price
- Pairing
- Photo
- Would drink again

Notes should feel like a personal tasting journal, not public reviews.

## Accessibility And Internationalization

- Interface text should be clear in Korean first, with structure that can support English later.
- Do not rely on color alone to communicate taste, category, status, or rating.
- Support keyboard navigation for search, filters, dialogs, and forms.
- Maintain readable contrast for text on rich backgrounds.
- Use plain language for wine and cocktail terms, with optional explanations for specialized vocabulary.

## Error And Empty States

The app should handle:

- No search results
- Slow API responses
- API rate limits
- Missing images
- Missing measurements
- Missing wine vintage or producer data
- Failed save or record actions

Error messages should tell the user what happened and what they can do next.

Examples:

- 검색 결과가 없어요. 재료나 품종 이름을 조금 더 넓게 입력해보세요.
- 와인 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
- 일부 제조법 정보가 API에 없어서 표시하지 않았어요.

## Privacy

Personal records, notes, favorites, and preference signals are private user data.

Separate clearly:

- Public drink information from APIs
- Private favorites
- Private tasting notes
- Preference signals generated from user activity

Do not expose personal records publicly unless sharing is intentionally added in a future version.

## Testing And Quality

- Test API adapters with mocked responses, including missing data and error cases.
- Test recommendation behavior with predictable input scenarios.
- Test user record creation, editing, deletion, and persistence.
- Verify responsive layouts on mobile and desktop.
- Check that long drink names, region names, ingredient names, and notes do not break layouts.

## Scope Discipline

For the first version, prioritize:

- Search
- Recommendation
- Drink detail pages
- Favorites
- Personal tasting notes
- Login and private user data

Defer:

- Social feeds
- Public user reviews
- Commerce or purchase links
- Inventory and cellar management
- Advanced sommelier workflows

## Kakao Login

Kakao login should be implemented through Supabase Auth OAuth, not by exchanging Kakao tokens directly in the frontend.

Required external setup:

- Kakao Developers app exists.
- Kakao Login is enabled.
- Kakao REST API key is used as the Supabase Kakao Client ID.
- Kakao Login Client Secret is used as the Supabase Kakao Client Secret.
- Supabase callback URL is registered in Kakao Redirect URI settings.
- Supabase Authentication provider for Kakao is enabled.

Client behavior:

- Use `supabase.auth.signInWithOAuth({ provider: 'kakao' })`.
- Redirect back to the current app origin after OAuth.
- Keep email/password login available as a fallback.
- Do not store Kakao REST API keys or Client Secrets in the Vite frontend.
