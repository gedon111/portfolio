# Proposal pages

One page per business, at `https://gedon111.github.io/portfolio/proposals/<slug>/`.
Pages are `noindex`, so they don't show up on Google, but anyone with the link can open them.
The data files in `data/` are public on GitHub too, so don't put anything private in them.

## Make one

1. Copy `data/example.json` to `data/<slug>.json` (for example `data/the-fern.json`).
2. Edit it: business name, what you noticed, the sample page link, plans and prices, terms.
   - Mark the plan you want to sell with `"recommended": true`.
   - `prepared` is the date (YYYY-MM-DD); the page shows "valid until" `validDays` later (default 30).
   - `sample.image` (optional) is a path like `images/proposals/the-fern.jpg`, used as the link-preview image.
   - Leave out any section you don't need (`noticed`, `notIncluded`, `terms`, `faq`).
3. Build it:

       node proposals/build.mjs the-fern

4. Commit and push, then send `https://gedon111.github.io/portfolio/proposals/the-fern/`.

`node proposals/build.mjs` with no name rebuilds every proposal (do this after changing contact details or the layout).

## Contact details

They live in one place: the `CONTACT` object at the top of `build.mjs`. Add your Messenger link there (`https://m.me/<username>`) and rebuild.

## Anti-slop rules these pages follow

- One primary action ("Text OK"), one accent colour (on the recommended plan).
- Specific findings about *their* business first, then the offer.
- A "Not included" list and written terms, so there are no surprises.
- Tabular numbers for prices; no filler badges, icon cards or decorative italics.
