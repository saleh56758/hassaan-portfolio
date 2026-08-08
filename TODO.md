# Mobile Dropdown Menu Refinement — TODO

- [x] Inspect existing mobile menu implementation (index.html, js/main.js, css/styles.css)
- [x] Approve plan with user

## Implementation
- [x] Restructure the `.mobile-menu` block in `index.html` (mobile only)
- [x] Add scoped mobile-menu CSS refinements in `css/styles.css` (desktop untouched)
- [x] Verify no JS changes needed (existing selectors `.menu-btn`, `.mobile-menu a`, `.theme-toggle` all still apply)

## Verification
- [x] Desktop navigation unchanged (nav-links / nav-actions / .btn-primary-sm untouched)
- [x] All existing links still work (hrefs identical: #work, #about, #experience, #work, #contact)
- [x] Dark mode still works (.theme-toggle kept, JS behaviour unchanged)
- [x] Mobile menu opens/closes correctly (.menu-btn toggle + a-click close unchanged)
- [x] No other sections changed
- [x] CTA text reads exactly "View My Work →"
