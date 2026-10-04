# Example: enhanced prompt

Before-and-after example showing how to turn a short user request into a structured prompt for `stitch generate screen`.

## User input

> "Make a landing page for my fitness app called 'Pulse'. It should have a place for features and a hero section."

## Enhanced prompt

Leave colors, font names, and theme tokens out of new screen prompts when the project has a design system. Focus the prompt on layout, section order, and copy.

```markdown
High-energy, modern landing page for 'Pulse', a fitness tracking application. The layout should feel focused, motivating, and athletic.

PLATFORM: Web, Desktop-first

PAGE STRUCTURE:
1. Header: Minimal sticky navigation bar with the Pulse logo on the left and a "Start Training" primary call-to-action button on the right.
2. Hero Section: Full-width fitness photography background. Headline: "Elevate Every Beat." Subtext: "Track, analyze, and hit your fitness goals with Pulse." Primary call-to-action button: "Get Started".
3. Feature Grid: Three-column responsive card grid:
   - Real-time Tracking: Live stats from your wearable.
   - Adaptive Coaching: Personalized workout plans based on recent sessions.
   - Community Challenges: Weekly leaderboards and group milestones.
4. Social Proof Section: Horizontal logo strip reading "Trusted by 500,000+ athletes" with partner badges.
5. Footer: Three link columns for Training, Pricing, and Support, plus social icons and legal copy.
```

## CLI invocation

Run `stitch generate screen --project <project-id> --title "Pulse Landing Page" --device DESKTOP --prompt "<enhanced-prompt>" --json`.
