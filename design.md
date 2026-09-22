# Design Direction

## Design Purpose

`design.md` is the visual and interaction design source of truth for Record of the Cup. It should only describe how the app looks, feels, and behaves visually.

## Current Visual Baseline

The current visual baseline uses a single app-style home screen, not a phone mockup preview.

The visible home screen is structured as:

1. Large visual hero area
2. Search input
3. Mood and recommendation filters
4. Recommended drink cards
5. Drink category strip
6. Recipe preview card
7. Recent note summary cards
8. Fixed bottom navigation

The top brand label is not shown in the home screen. Settings belongs in the bottom navigation, next to Notes.

## Visual Tone

The app should feel:

- Atmospheric
- Warm
- Personal
- Slightly dramatic
- Refined but approachable
- Useful and readable

The visual language should borrow from cocktail bars, wine menus, tasting notebooks, and softly lit table scenes.

The app should look richer than a minimal productivity app. It can use layered surfaces, drink-inspired color, soft shadows, and visual glass cues, but it should still be easy to scan.

## Color Direction

Use a warm light base with stronger drink-inspired accents.

Recommended palette:

- Warm cream background
- Soft paper card surfaces
- Burgundy or wine red for wine accents
- Deep teal for cocktail accents
- Charcoal for primary text and active navigation
- Muted gold only as a small highlight
- Fresh lime green only as a small garnish or flavor accent

Avoid:

- Orange as a dominant color
- Purple-heavy UI
- Very dark full-screen backgrounds
- One-note beige-only screens
- Gold-on-black luxury styling
- Neon nightclub styling

## Layout Direction

The app should feel mobile-first even when running in a browser.

Use:

- Full-width app sections
- A strong first-screen hero
- A floating or elevated search field near the hero/content boundary
- Horizontal chip rows for filters
- Horizontally scrollable category tiles when space is limited
- Fixed bottom navigation
- Generous vertical rhythm between major sections

Avoid:

- Multiple phone preview frames in the actual app
- Desktop dashboard layouts as the main visual direction
- Static marketing hero pages
- Large empty placeholder panels
- Nested cards

## Hero Area

The hero area should create the first emotional impression of the app.

It should include:

- Large Korean headline
- Short supporting copy
- Drink-inspired visual cue such as glass shapes, wine/cocktail color, garnish accent, or later real drink imagery

It should not include:

- A visible marketing brand header
- Too many controls
- Long explanatory text
- Dark background that makes the whole app feel heavy

## Typography

Typography should have strong hierarchy:

- Hero text can be large and emotional.
- Section titles should be clear and compact.
- Card titles should be bold and readable.
- Supporting text should stay calm and explanatory.
- Button and tab labels should be short.

Do not scale font size directly with viewport width. Use responsive layout constraints instead.

Do not use negative letter spacing.

## Navigation Design

Use five bottom tabs:

- Home
- Search
- Saved
- Notes
- Settings

Bottom navigation should feel like a real app control, not a website menu. It stays fixed at the bottom and uses icons with short labels.

The active tab should be clearly visible through background, text color, and icon color. Do not rely on color alone when a shape or filled state can help.

## Search And Filters Design

Search is a primary visual element.

The search field should:

- Sit near the top of the content
- Be large enough to tap comfortably
- Use a search icon
- Include a filter icon button
- Look elevated from the background

Filter chips should:

- Be horizontal
- Be short and easy to tap
- Have one clear active state
- Avoid long labels that wrap awkwardly

## Drink Card Design

Drink cards should feel tactile and app-like.

Each drink card should show:

- Drink type
- Drink name
- Short flavor or context note
- Useful metadata
- Save/favorite icon action
- Visual drink cue or image

Cards can use:

- Soft shadows
- Rounded corners
- Subtle gradients
- Wine/cocktail accent colors
- Image or illustration areas

Cards should not become oversized promotional banners. The user should be able to scan multiple drinks quickly.

## Category Design

Categories should act as quick entry points.

Current category direction:

- Cocktail
- Wine
- Whiskey as a future or coming-soon category

Category tiles should use distinct accent colors, compact labels, and short supporting counts/status text.

## Recipe Preview Design

Recipe preview cards should feel like a useful hint, not a full detail page.

They should include:

- Small label
- Drink name
- Very short recipe summary
- Clear call-to-action button

## Notes Design

Recent notes should feel like private tasting journal snippets.

Use compact rows or cards with:

- Note icon
- Short note text
- Calm neutral color
- Clear separation between items

Do not make notes feel like public reviews or social feed posts.

## Icon Rules

Use icons for repeated actions:

- Home
- Search
- Saved/favorite
- Notes
- Settings
- Filter

Icon buttons should have accessible labels in code and visually clear hit areas.

## Responsive Rules

The design must work on:

- Mobile browser widths
- Desktop browser preview
- Future mobile app layout

Rules:

- Text must not overflow buttons or cards.
- Long drink names should wrap cleanly.
- Bottom navigation labels must remain readable.
- Rich hero visuals must not cover the headline or search area.
- Cards should reflow without becoming cramped.

## Future Visual Enhancements

Future design iterations can add:

- Real drink images when available
- Better empty states
- Login screen visual direction
- Detail page layouts
- Record creation flow design
- Theme settings for light, dark, and system modes

Keep future additions aligned with the same emotional bar/notebook tone.
