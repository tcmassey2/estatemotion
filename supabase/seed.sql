insert into public.templates (
  id,
  name,
  description,
  font_style,
  text_placement,
  motion_speed,
  transition_style,
  intro_layout,
  outro_layout,
  cta_wording,
  accent_color
) values
('modern-luxury', 'Modern Luxury', 'Slow cinematic movement, crisp titles, black and ivory cards.', 'Elegant Sans', 'bottom', 'slow', 'soft fade', 'Full-bleed hero with thin gold rule', 'Portrait left, logo right, centered CTA', 'Schedule your private showing', '#C7A76C'),
('desert-luxury', 'Scottsdale/Phoenix Desert Luxury', 'Warm neutral accents, neighborhood language, premium resort pacing.', 'Editorial Sans', 'split', 'medium', 'gold wipe', 'Curb appeal opener with city badge', 'Agent end card with desert-toned CTA', 'Tour this Arizona listing', '#B88746'),
('first-time-buyer', 'First-Time Buyer Friendly', 'Clear value props, approachable pacing, feature-first overlays.', 'Friendly Sans', 'top', 'medium', 'clean slide', 'Price-led hook with three quick reasons', 'Friendly agent card with next-step CTA', 'Want the details?', '#2D7D78'),
('open-house', 'Open House Promo', 'Event-forward story format with date-ready CTA blocks.', 'Bold Sans', 'center', 'fast', 'whip pan', 'Open house announcement with map-style label', 'Large CTA, contact, brokerage compliance', 'Visit the open house', '#111111'),
('just-listed-fast-cut', 'Just Listed Fast Cut', 'Punchy social-native cuts for Reels, TikTok, Shorts, and Stories.', 'Condensed Sans', 'bottom', 'fast', 'cut rhythm', 'Three-shot burst before title card', 'Fast end card with headshot and handle', 'DM for a showing', '#E3BB73')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  font_style = excluded.font_style,
  text_placement = excluded.text_placement,
  motion_speed = excluded.motion_speed,
  transition_style = excluded.transition_style,
  intro_layout = excluded.intro_layout,
  outro_layout = excluded.outro_layout,
  cta_wording = excluded.cta_wording,
  accent_color = excluded.accent_color;
