# Flag Icons — Setup

**Library:** [lipis/flag-icons](https://github.com/lipis/flag-icons)
**License:** MIT — free to use in any project, commercial or personal
**Version:** 7.5.0

---

## Install

```bash
npm install flag-icons
```

After install, SVG files live at:
```
node_modules/flag-icons/flags/4x3/{code}.svg   ← 4:3 aspect ratio (standard)
node_modules/flag-icons/flags/1x1/{code}.svg   ← square crop
```

## Copy SVGs to this folder

Run this from your project root to copy the flags used in Perfect Storm:

```bash
FLAGS="ch tw de sa us cn ir ru ua in gb fr jp kr il pk"
for code in $FLAGS; do
  cp node_modules/flag-icons/flags/4x3/$code.svg Graphics/Flags/$code.svg
done
```

## Usage in React (CDN — no install needed)

Add to your HTML `<head>` or import in your CSS:

```html
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css" />
```

Then in JSX:

```jsx
<span className="fi fi-us" />          {/* United States */}
<span className="fi fi-tw" />          {/* Taiwan */}
<span className="fi fi-de" />          {/* Germany */}
<span className="fi fi-cn" />          {/* China */}
```

Add `fis` class for a square crop: `<span className="fi fi-us fis" />`

## Codes used in Perfect Storm (Nation View)

| Code | Country |
|------|---------|
| `ch` | Switzerland |
| `tw` | Taiwan |
| `de` | Germany |
| `sa` | Saudi Arabia |
| `us` | United States |
| `cn` | China |
| `ir` | Iran |
| `ru` | Russia |
| `ua` | Ukraine |
| `in` | India |
| `gb` | United Kingdom |
| `fr` | France |
| `jp` | Japan |
| `kr` | South Korea |
| `il` | Israel |
