# OpenFinch Brand Colors

## Palette A: Deep Teal (Primary)

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#0D7377` | teal-600 | Headers, buttons, links |
| Primary Light | `#14A3A8` | teal-500 | Hover states, accents |
| Primary Dark | `#095052` | teal-700 | Footer, dark sections |
| Background | `#F0FDFA` | teal-50 | Page backgrounds |
| Surface | `#CCFBF1` | teal-100 | Card backgrounds |

## Palette B: Slate + Teal (Technical)

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Text Primary | `#0F172A` | slate-900 | Body text |
| Text Secondary | `#475569` | slate-600 | Labels, captions |
| Border | `#CBD5E1` | slate-300 | Dividers, input borders |
| Accent | `#0D9488` | teal-600 | Calls to action |
| Success | `#059669` | emerald-600 | Status: online, healthy |
| Warning | `#D97706` | amber-600 | Status: degraded |
| Error | `#DC2626` | red-600 | Status: offline, error |
| Code BG | `#1E293B` | slate-800 | Code blocks |

## Palette C: Warm Technical (Accessible)

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#0F766E` | teal-700 | Main brand color |
| Secondary | `#2563EB` | blue-600 | Links, actions |
| Accent Warm | `#EA580C` | orange-600 | Highlights, badges |
| Neutral | `#334155` | slate-700 | Text, UI elements |
| Muted | `#94A3B8` | slate-400 | Subtle text |

## Recommended Base Palette

```
Primary:      #0D7377  (teal)
Primary Dark: #095052  (deep teal)
Accent:       #2563EB  (blue)
Background:   #FFFFFF  (white)
Surface:      #F8FAFC  (slate-50)
Text:         #0F172A  (slate-900)
Code:         #1E293B  (slate-800)
Success:      #059669  (green)
Warning:      #D97706  (amber)
Error:        #DC2626  (red)
```

## Gradient Options

For hero sections and social cards:

```
Teal to Blue:   linear-gradient(135deg, #0D7377, #2563EB)
Teal to Slate:  linear-gradient(135deg, #0D7377, #1E293B)
Teal to Teal:   linear-gradient(135deg, #0D7377, #14A3A8)
```

## Accessibility Notes

- All color combinations must pass WCAG AA contrast ratio (4.5:1 for normal text)
- Never rely solely on color to convey information — use icons and labels
- The teal + slate palette has been verified for colorblind accessibility
- Test all UI with this palette: https://davidmathlogic.com/colorblind

## Usage Rules

1. Use Primary Teal for the OpenFinch wordmark and primary CTAs
2. Use Blue for interactive elements (links, buttons)
3. Use Slate for UI structure (borders, backgrounds, text)
4. Use Green/Amber/Red exclusively for status indicators
5. Never use more than 3 colors in a single component
