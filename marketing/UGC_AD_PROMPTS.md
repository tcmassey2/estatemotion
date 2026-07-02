# Vistalia UGC ad prompts — Higgsfield (Supercomputer / Marketing Studio / Seedance 2.0)

## ⚡ Supercomputer paste-ready prompts (higgsfield.ai/supercomputer, Fable 5)

These are written as agent briefs — paste one message per ad into the
Supercomputer chat. Run the kickoff once per session so every ad in the series
keeps the same face.

**Two hard rules baked into every prompt below (learned from renders 1–2):**
1. **Pronunciation** — TTS botches "Vistalia". Troy says it **vih-STAH-lee-ah**
   (like "Italia"). In every SPOKEN line the name is respelled
   `Vih-STAH-lee-ah`. Captions and end card show the real spelling. If a
   render still mangles it, cut the name from dialogue entirely — the end
   card carries the brand.
2. **No phone-screen reveals** — models render blank/glowing screens. No actor
   ever shows a screen to camera. The "watch this" beat is a HARD CUT to
   full-screen real product footage (splice `marketing/ads/raw/clip-*.mp4` in
   post — I can do the splice in ffmpeg), then cut back to the actor.

**Session kickoff (paste first):**
```
I'm making a series of UGC-style video ads for Vistalia (vistalia.ai), my SaaS
that turns real-estate listing photos into cinematic vertical video tours
narrated in the agent's own cloned voice. True facts you may use: ~3 minute
renders, first video free, $39 one-off, plans from $69/mo, 60-second tours.
Never invent results, stats, or customer outcomes.

Two permanent rules for every video in this session:
1. Whenever dialogue includes the brand name, it is written "Vih-STAH-lee-ah"
   (pronounced like "Italia" with a V-st: vih-STAH-lee-ah) — speak it exactly
   like that respelling.
2. No character ever holds a phone screen toward the camera or shows anything
   on a screen. Phones may appear held at arm's length as the selfie camera,
   or face-down — never screen-to-lens.

First, create one photorealistic persona portrait we'll reuse as the
consistent face for this session: a woman in her early 30s, American real
estate agent, navy blazer over a white t-shirt, warm confident smile, natural
makeup, phone front-camera selfie framing, 9:16. Call her JESS. Show me the
portrait before we make any videos.
```

**Optional (send ONLY as its own later message, never inside the kickoff —
asking the agent to read the brand pages up front wedged a session on
2026-07-01):** `My library has vistalia-brand-kit-page-1/2/3,
vistalia-mark-1024-transparent, vistalia-endcard, and two vistalia-style-ref
images. When you need brand colors, imagery style, or the end card, consult
those.`

**Ad 1 — car confession (after kickoff):**
```
Using JESS as the actor, make a 15-second 9:16 UGC video ad: she sits in the
driver's seat of a parked car in daylight, holding her phone at arm's length,
speaking to the front camera with amused disbelief, lip-synced. She says:
"So the videographer wanted eight hundred fifty dollars — and he can't come
until Thursday. Watch this instead. I upload the listing photos… pick a
style… and three minutes later I've got a cinematic video tour. Narrated. In
MY voice. Thirty-nine bucks — first one's free." Handheld sway, natural
lighting, casual UGC energy, no captions, no watermark.
```

**Ad 2 — "nobody believes it's my voice" (rev B — no phone prop):**
```
Using JESS, 15-second 9:16 UGC video: she's on a couch in warm evening lamp
light, selfie framing, points up toward the top corner of the frame on her
first line (as if at a video that just played), then leans in
conspiratorially, lip-synced. She says: "That video? My listing. The voice
narrating it? Also me — and I never recorded a single word. Vih-STAH-lee-ah
cloned my voice once, and now every tour I post sounds like I narrated it in
a studio. First video's free — go hear yours." She never holds anything
toward the camera; no screens visible. Handheld selfie framing, no captions.
```
Post note: open this ad with 2s of a real narrated render (full-screen product
footage with its voiceover) so "that video" refers to something the viewer
actually just saw.

**Ad 3 — coffee race (new persona, same session):**
```
Create a second persona: MARCUS, man mid 40s, veteran American realtor, dark
polo, salt-and-pepper stubble. Then a 15-second 9:16 UGC video: he's making
pour-over coffee in a bright kitchen, phone propped on the counter filming
him, talking to camera while pouring, then a small satisfied nod to the lens,
lip-synced. He says: "Uploaded my listing photos when I started this pour.
Picked a style. That's the whole workflow. …And done — narrated, music on the
beat, ready for Reels. The coffee took longer. First one's free." He never
picks up or shows the phone; no screens visible. Natural morning light, UGC
energy, no captions.
```
Post note: cut to 2s of real product footage on "…And done", back to him for
the last line.

For the remaining five concepts (skeptic convert, just-listed walk-and-talk,
team lead, luxury objection, the quiet one), lift the scripts + scene notes
from the ads section below and wrap them in the same brief format: persona +
scene + "lip-synced, she/he says: …" + 9:16, 12–15s, handheld UGC, no
captions — and always append the two session rules (Vih-STAH-lee-ah respelling
in dialogue, no screens to camera).

---


> UGC = AI-presenter creative. Standing rule intact: never Troy's face or voice —
> these are AI actor personas portraying agents. Two production routes:
> **A. Marketing Studio, UGC preset** — one-click, 12–15s, pick avatar + hook +
> setting, feed the script as the prompt. **B. Seedance 2.0** — more control:
> generate a persona reference still once, reuse it across every clip
> (`image_references`), dialogue in the prompt, `generate_audio: true`, 9:16,
> 720p/1080p, 8–15s. Route B is better for character consistency across a series.

## Personas (generate one reference still each, reuse everywhere)

**JESS** — woman early 30s, residential listing agent. Warm, fast-talking,
slightly conspiratorial "let me put you on" energy. Blazer over white tee,
natural makeup, small earrings.
Reference-still prompt: `Photorealistic portrait of a woman in her early 30s,
American real estate agent, navy blazer over white t-shirt, warm confident
smile, natural makeup, sitting in a parked car, soft daylight through the
windshield, shot on a phone front camera, casual selfie framing, 9:16, no text`

**MARCUS** — man mid 40s, 15-year veteran agent. Dry, skeptical-convert tone.
Polo, salt-and-pepper stubble, home office with listing flyers.
Reference-still prompt: `Photorealistic portrait of a man in his mid 40s,
experienced American realtor, dark polo shirt, salt and pepper stubble, sitting
at a home office desk with property flyers, warm lamp light, phone front camera
selfie framing, 9:16, no text`

**DIANE** — woman early 50s, team lead/broker. Polished, authoritative,
"I don't waste my agents' time" energy. Blouse + glasses, modern brokerage office.
Reference-still prompt: `Photorealistic portrait of a woman in her early 50s,
polished American real estate broker, silk blouse and reading glasses, standing
in a bright modern brokerage office, natural window light, phone front camera
selfie framing, 9:16, no text`

## Craft rules (apply to every Seedance prompt)

Append to each: `Handheld phone front-camera selfie framing at arm's length,
vertical 9:16, natural imperfect lighting, subtle handheld sway, direct eye
contact with lens, casual conversational delivery with natural micro-pauses,
authentic UGC energy, no studio polish, no captions, no watermark, no phone
screens or displays ever face the camera`

Plus the two render-tested rules: brand name in SPOKEN lines is always written
`Vih-STAH-lee-ah` (Troy's pronunciation, like "Italia" — TTS botches the real
spelling), and any "watch this / showing the video" beat is a post-production
hard cut to real product footage (marketing/ads/raw), never an on-screen
phone reveal.

Honesty guardrails: scripts state true product mechanics only (~3 min render,
photos→narrated tour, own-voice clone, first free, $39 one-off, plans $69/mo,
60s tours). Subjective enthusiasm is fine; **no fabricated measurable results**
(no "I got X leads / sold in Y days"). These are actor portrayals — don't
present them as real customer testimonials in ad copy.

---

## ⚡ Set 2 — all JESS, paste-ready for Supercomputer

Fresh angles, none overlap set 1. If this is a new session, paste the kickoff
first so JESS + the two rules exist; each prompt below also restates the rules
inline as insurance. Only ad 2.3 speaks the brand name — everywhere else the
end card carries it (less TTS risk).

**2.1 — "Don't tell the other agents" (competitive secret):**
```
Using JESS, 15-second 9:16 UGC video: she's in the front seat of her parked
car, late afternoon light, leans toward the front camera like she's sharing a
secret, one glance out the window as if checking nobody's around, lip-synced.
She says: "Okay, don't tell the other agents in my market. Every listing I
post now goes up as a cinematic video tour — narrated, music, the whole thing
— the same day it hits the MLS. Takes three minutes and the first one's free.
Honestly, keep this one to yourself." Handheld selfie framing, natural
imperfect lighting, no captions, no watermark. Rules: no screens ever face
the camera; if the brand name appears in dialogue it is spoken as
"Vih-STAH-lee-ah".
```

**2.2 — 9pm panic → relief (relatable stress):**
```
Using JESS, 15-second 9:16 UGC video: night scene at a home desk lit by a
warm lamp, hair slightly undone, she talks to the front camera with tired
relief and a small laugh, lip-synced. She says: "It's nine p.m. The listing
goes live tomorrow and I just remembered — no video. Old me would be editing
until two a.m. Instead I uploaded the photos, picked a style, and it's
already done. Narrated and everything. I'm going to bed." Handheld selfie
framing, cozy night lighting, no captions, no watermark. Rules: no screens
ever face the camera; brand name, if spoken, is "Vih-STAH-lee-ah".
```

**2.3 — "Who's your videographer?" (status angle — speaks the brand):**
```
Using JESS, 15-second 9:16 UGC video: she walks slowly through a bright
staged hallway toward the camera holding it at arm's length, confident and
amused, lip-synced. She says: "The question I get most from sellers now:
'who's your videographer?' Nobody. It's Vih-STAH-lee-ah. It turns my listing
photos into a narrated cinematic tour in about three minutes — in my own
voice. They never believe me. First video's free if you want that reaction."
Handheld walk-and-talk selfie framing, natural light, no captions, no
watermark. Rules: speak the brand exactly as written "Vih-STAH-lee-ah"; no
screens ever face the camera.
```

**2.4 — Green flag / red flag (format-native):**
```
Using JESS, 15-second 9:16 UGC video: she stands in a bright kitchen, selfie
framing, deadpan on the red flag then bright on the green flag, one small
head tilt each way, lip-synced. She says: "Red flag: an eight-hundred-
thousand-dollar listing… with a slideshow. Green flag: a cinematic video
tour, narrated in the agent's own voice, posted day one. Same photos. Three
minutes. First one's free — be the green flag." Handheld selfie framing,
natural light, no captions, no watermark. Rules: no screens ever face the
camera; brand name, if spoken, is "Vih-STAH-lee-ah".
```

**2.5 — "I'm not techy" objection:**
```
Using JESS, 15-second 9:16 UGC video: she sits on her front porch steps in
morning light, warm and reassuring to the front camera, counts three things
on her fingers, lip-synced. She says: "To every agent who says 'I'm not
techy' — if you can attach photos to an email, you can do this. Upload the
photos. Pick a style. Hit render. That's the whole job — three minutes later
you've got a narrated cinematic tour. Your first one's free, so you can't
even mess it up." Handheld selfie framing, soft morning light, no captions,
no watermark. Rules: no screens ever face the camera; brand name, if spoken,
is "Vih-STAH-lee-ah".
```

**2.6 — Voiceover math (mostly b-roll — most reliable render):**
```
Using JESS for one short on-camera bookend only: 3 seconds of her at her
desk saying to the front camera, lip-synced: "Let me do the math on listing
videos for you." Then generate the REMAINDER as voiceover in the same
female voice over cinematic real-estate b-roll (interiors, exteriors at
dusk, no people, no screens, no text): "A videographer runs about eight
hundred fifty dollars a listing. Twenty listings a year — that's seventeen
grand. Or: thirty-nine dollars a video, plans from sixty-nine a month, first
one free. Same cinematic look, narrated in your own voice, three minutes a
listing. That's the ad." 9:16, 15 seconds total, warm confident VO pacing,
no captions, no watermark. Rule: brand name, if spoken, is "Vih-STAH-lee-ah".
```
Post note for 2.6: if the b-roll comes out weak, replace it with our own
marketing/ads/raw clips and keep only the generated VO + bookend.

---

## The 8 ads (set 1)

### 1. CAR CONFESSION — cost angle (Jess)
Hook (0–2s): "The videographer quoted me $850 and next Thursday."
Script: "So the videographer wanted eight hundred and fifty dollars — and he
can't come until Thursday. Watch this instead. I upload the listing photos…
pick a style… and about three minutes later I've got a cinematic video tour.
Narrated. In MY voice. Thirty-nine bucks — and the first one's free. Honestly?
This isn't fair to videographers."
Seedance prompt: `JESS reference. Woman sits in the driver's seat of a parked
car holding her phone up, speaking to the front camera with amused disbelief,
occasionally glancing at her phone screen then back to lens. She says:
"<script>". Daylight, parked in a suburban neighborhood.` + craft rules
On-screen text: "$850 → $39" at the price beat.

### 2. NOBODY BELIEVES IT'S MY VOICE — moat angle (Jess)
Hook: "Nobody believes me that this is my voice."
Script: "That video? My listing. The voice narrating it? Also me — and I never
recorded a single word. Vih-STAH-lee-ah cloned my voice once, and now every tour
I post sounds like I narrated it in a studio. My sellers' jaws hit the floor.
Your first video's free — go hear yours."
Seedance prompt: `JESS reference. Woman on a couch, selfie framing, points up
at the top corner of frame on her first line, then leans in conspiratorially.
No phone prop, no screens. She says: "<script>". Cozy living room, evening
lamp light.` + craft rules
Post: open with 2s of a real narrated render before her first line.
On-screen text: "her actual cloned voice ↑"

### 3. COFFEE RACE — speed angle (Marcus)
Hook: "Coffee versus listing video. Go."
Script: "Uploaded my listing photos the second I started this pour. Picked
'Cinematic Luxury.' That's it — that's the whole workflow. …And done. Narrated,
music on the beat, vertical, ready for Reels. The coffee took longer. First
one's free."
Seedance prompt: `MARCUS reference. Man in a kitchen making pour-over coffee,
phone propped against the counter filming him, he talks to camera while
pouring, then picks up the phone and shows a satisfied nod. He says:
"<script>". Morning window light.` + craft rules
On-screen text: "~3 minutes" timer style.

### 4. SKEPTIC CONVERT — quality angle (Marcus)
Hook: "I thought AI listing videos would look cheap. I was wrong."
Script: "Fifteen years in this business — I've seen every janky slideshow app.
This is not that. Real camera motion. Cuts that land on the music. And it
narrates the listing in your own voice. I tested it on my worst listing photos
and it still came out looking like a film. First video's free. Test it on yours."
Seedance prompt: `MARCUS reference. Man at his home office desk, leans back
skeptically then forward with conviction, talking straight into the front
camera. He says: "<script>". Warm desk lamp, listing flyers in background.`
+ craft rules

### 5. JUST LISTED, POSTING IN 5 — momentum angle (Jess)
Hook: "Just listed this one. Watch what I post in the next five minutes."
Script: "I'm not calling a videographer, and I am NOT opening an editing app.
The shoot photos go in, I pick a style, and by the time I'm back in my car
there's a narrated cinematic Reel ready to post. Same-day momentum on every
listing. That's the whole game."
Seedance prompt: `JESS reference. Woman walks along the sidewalk in front of a
nice suburban house holding her phone at arm's length, energetic walk-and-talk
to the front camera, glances back at the house once. She says: "<script>".
Golden hour.` + craft rules
On-screen text: "posted before she left the driveway"

### 6. TEAM LEAD — Studio plan angle (Diane)
Hook: "My whole team switched, and our feed looks like a production house."
Script: "I run nine agents. We used to argue about who edits video — now
nobody edits video. Listing photos go in, narrated cinematic tours come out,
and every agent's feed looks like we keep a film crew on retainer. The Studio
plan covers ten videos a month. Do the math on one videographer invoice."
Seedance prompt: `DIANE reference. Woman stands in a bright modern brokerage
office holding her phone up, speaking with calm authority to the front camera,
agents working at desks softly blurred behind her. She says: "<script>".`
+ craft rules
On-screen text: "10 videos / $149"

### 7. LUXURY OBJECTION — premium angle (Diane)
Hook: "Your luxury sellers want cinema. Give it to them tonight."
Script: "Big listings deserve big video — but the production shoot books out a
week. So post the cinematic AI tour tonight. Keep the momentum, keep the seller
thrilled, and let the drone footage arrive later. Sixty-second tours, narrated
in your voice, live the same day it lists."
Seedance prompt: `DIANE reference. Woman in the doorway of an upscale staged
living room at dusk, warm interior lights behind her, speaks to her phone's
front camera with measured confidence. She says: "<script>".` + craft rules

### 8. THE QUIET ONE — anti-hype angle (Marcus)
Hook: "I'm not going to hype this. I'll just show you."
Script: "Photos in. …Video out. It wrote the tour, timed the cuts to the
music, and read it in my voice. Three minutes, thirty-nine dollars, first
one's free. That's the ad. Go make one."
Seedance prompt: `MARCUS reference. Man sits in his parked truck, deadpan
delivery to the front camera, hands on the wheel, one small glance off-camera
on "Photos in", tiny shrug at the end. No phone prop, no screens. He says:
"<script>". Overcast daylight.` + craft rules
Post: hard cut to 2s of real product footage between "Photos in." and "…Video
out." — that cut IS the ad.
On-screen text: "photos → this" over the product footage.

---

## Production notes

- **Route A (Marketing Studio):** `show_marketing_studio(action='list',
  type='hook')` and `type='setting'` → pick hook/setting per concept → UGC
  preset → pass script as prompt + `avatar_ids`. 12–15s cap — scripts 1, 3, 8
  fit as-is; trim others or use Route B.
- **Route B (Seedance 2.0):** persona still via `soul_2` or `nano_banana_pro`
  → clip with `image_references` + dialogue prompt, `generate_audio: true`,
  duration 12–15, 9:16. One persona still per character, reused = consistent
  face across the whole series.
- Post: add Vistalia end-card (marketing/ads/endcard.png) + captions in
  ffmpeg/CapCut. Captions lift UGC CTR — burn them in before Ads Manager.
- Rotate: 3 personas × angles above = launch matrix; kill under 0.8% CTR per
  META_ADS_LAUNCH.md rules. UGC + the cinematic hero ad in the same ad set
  gives Meta a style contrast to optimize across.
- Meta disclosure: photorealistic AI people in ads — keep "AI-generated
  spokesperson" in your compliance back pocket; don't market clips as real
  customer testimonials.
