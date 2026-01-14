# Costume Entry Template

Use this template when adding new costumes to `data/costumes.v1.json`.

---

## JSON Template

```json
{
  "id": "cos_[name]_[source]",
  "name": "[Character Name]",
  "displayTitle": "[Character Name] ([Source Title])",
  "universe": "movie|tv|music|sports|internet",
  "sourceTitle": "[Movie/Show/Album/Team/Platform]",
  "era": "70s_80s|90s|2000s|current|any",
  "vibes": {
    "funny": 0,
    "sexy": 0,
    "stylish": 0,
    "clever": 0,
    "lowEffortHighPayoff": 0
  },
  "nicheScore": 4,
  "genderPresentation": "masc|femme|androgynous|flexible",
  "constraints": {
    "effort": "one_item|few_fast|some_work|suffer_for_bit",
    "budget": "lt_30|30_75|75_150|dont_care",
    "comfort": "high|medium|low",
    "barFriendly": true,
    "pocketsLikely": false
  },
  "requirements": {
    "anchorItem": "[The one item that makes the costume]",
    "items": [
      "[Item 1]",
      "[Item 2]",
      "[Item 3]"
    ],
    "makeupLevel": "none|light|heavy",
    "wigRequired": false,
    "facePaintRequired": false,
    "propsLevel": "none|optional|required"
  },
  "safety": {
    "cultureSpecific": false,
    "religiousAttire": false,
    "politicalFigure": false,
    "controversial": false,
    "skinToneChangeImplied": false
  },
  "similarity": {
    "archetypeTags": ["tag1", "tag2"],
    "vibeTags": ["tag1", "tag2"]
  },
  "images": {
    "primary": {
      "kind": "tmdb",
      "tmdbId": 12345,
      "imagePath": "/xxxxx.jpg",
      "imageType": "poster"
    }
  },
  "notes": "[Editorial tip for the LLM]"
}
```

---

## Field Reference

### ID Format
- Pattern: `cos_[shortname]_[source]`
- Examples: `cos_morpheus_matrix`, `cos_beyonce_coachella`, `cos_lebron_lakers`
- Keep lowercase, use underscores

### Universe Options
| Value | Use For |
|-------|---------|
| `movie` | Film characters |
| `tv` | TV show characters |
| `music` | Musicians, artists, iconic performances |
| `sports` | Athletes, commentators, mascots |
| `internet` | Memes, influencers, viral moments |

### Era Options
| Value | Years | Examples |
|-------|-------|----------|
| `70s_80s` | 1970-1989 | Disco, early hip-hop, power suits |
| `90s` | 1990-1999 | Grunge, Friends, The Matrix |
| `2000s` | 2000-2014 | Y2K, early social media era |
| `current` | 2015-present | Recent releases, trending |
| `any` | Timeless | Characters that span eras |

### Vibe Scores (0-3)
| Score | Meaning |
|-------|---------|
| 0 | Not applicable |
| 1 | Slight presence |
| 2 | Moderate presence |
| 3 | Dominant trait |

### Niche Score (1-7)
| Score | Recognition Level |
|-------|-------------------|
| 1 | Everyone gets it (Mario, Darth Vader) |
| 2-3 | Most people recognize it |
| 4 | Some people get it |
| 5-6 | Niche but dedicated fans |
| 7 | Deep cut, true fans only |

### Effort Levels
| Value | Description |
|-------|-------------|
| `one_item` | Buy/find one key piece |
| `few_fast` | 2-3 pieces, quick assembly |
| `some_work` | Requires coordination, maybe DIY |
| `suffer_for_bit` | Complex, uncomfortable, or elaborate |

### Budget Tiers
| Value | Range |
|-------|-------|
| `lt_30` | Under $30 |
| `30_75` | $30-$75 |
| `75_150` | $75-$150 |
| `dont_care` | $150+ or variable |

### Common Archetype Tags
```
suit, dress, uniform, casual, formal, athletic, vintage, 
leather, denim, neon, pastel, monochrome, all-black,
sunglasses, hat, wig, mask, cape, gloves, boots,
minimalist, maximalist, preppy, goth, punk, disco,
business, military, sports, dance, rock, pop
```

### Common Vibe Tags
```
iconic, recognizable, classic, trending, nostalgic,
funny, sexy, stylish, clever, comfortable, dramatic,
easy, complex, commitment, subtle, bold, camp
```

---

## Image Sources

### TMDB (Movies/TV)
1. Find the movie/show on [themoviedb.org](https://www.themoviedb.org)
2. Get the TMDB ID from the URL (e.g., `/movie/603` → ID is 603)
3. Find a good poster/backdrop image
4. Get the image path from the image URL (e.g., `/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg`)

```json
"images": {
  "primary": {
    "kind": "tmdb",
    "tmdbId": 603,
    "imagePath": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "imageType": "poster"
  }
}
```

### Wikimedia (Public Figures)
1. Find image on [commons.wikimedia.org](https://commons.wikimedia.org)
2. Get the file title (e.g., `File:Beyonce_Knowles.jpg`)
3. Optionally include the page URL

```json
"images": {
  "primary": {
    "kind": "wikimedia",
    "fileTitle": "File:Beyonce_Knowles.jpg",
    "pageUrl": "https://commons.wikimedia.org/wiki/File:Beyonce_Knowles.jpg"
  }
}
```

### Manual (Other Sources)
Use only for licensed/owned images:

```json
"images": {
  "primary": {
    "kind": "manual",
    "url": "https://example.com/image.jpg",
    "attribution": "Photo by Photographer Name"
  }
}
```

---

## Safety Flags

**Always set these correctly to prevent offensive suggestions:**

| Flag | Set TRUE When |
|------|--------------|
| `cultureSpecific` | Costume tied to specific culture/ethnicity |
| `religiousAttire` | Religious symbols, garments, roles |
| `politicalFigure` | Politicians, political activists |
| `controversial` | Could be offensive or problematic |
| `skinToneChangeImplied` | Should almost NEVER be true |

---

## Validation

After adding entries, run:

```bash
npm run validate-dataset
```

Check for:
- ✅ No schema errors
- ✅ No duplicate IDs
- ✅ Good coverage across categories

