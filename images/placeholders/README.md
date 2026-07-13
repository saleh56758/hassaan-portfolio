This folder is intentionally empty.

Every placeholder on this site (project screenshots, mobile views, the
hero portrait, the about photo) is rendered live as an inline SVG/CSS
mockup — browser chrome, a phone shell, or a portrait frame — directly
inside index.html. This keeps every layout, aspect ratio, and spacing
decision final today, with nothing to swap later except the markup for
a real <img>.

When you have real screenshots or photography:

1. Drop the file here (e.g. looksplus-desktop.webp).
2. In index.html, find the matching `.frame-browser` / `.frame-phone` /
   `.frame-portrait` block and replace its inner markup with an
   `<img src="images/placeholders/your-file.webp" alt="..." loading="lazy" />`,
   keeping the alt text that's already written for it.

Current naming convention:

- Desktop screenshots: `project-name.webp`
- Mobile screenshots: `project-name-mobile.webp`

Mobile images can be added later. The page falls back to the desktop screenshot
until the matching `*-mobile.webp` file exists.
