# Project guidance

## Game artwork

Before generating or editing a game image, follow these rules:

- Always create a new, descriptively named image file. Never overwrite or replace an existing image asset. Update the consuming code to reference the new file and leave earlier variants intact.
- Images must look ultra-realistic and physically plausible, as if photographed from a real handmade object or rendered from a high-end photorealistic 3D scan. Do not use cartoon, illustrated, painterly, toy-like, mobile-game, or stylized icon aesthetics.
- Use an aged, weathered medieval look with historically believable construction, materials, wear, scale, and proportions.
- Prefer matte or tarnished surfaces. Avoid polished, glossy, or excessively shiny finishes unless specifically requested.
- Use natural medieval earth colors: worn wood, leather, iron, dull bronze, muted cloth, dirt, and stone. Avoid artificial saturation, neon colors, and modern-looking palettes.
- Make objects feel like genuine three-dimensional objects with realistic perspective and depth. Prefer a readable three-quarter view over a flat, front-facing icon when appropriate.
- Keep lighting natural, soft, and restrained so the object blends into the map instead of visually popping out. Avoid dramatic studio lighting, glowing rims, exaggerated contrast, and game-icon highlights.
- For transparent map assets, do not bake in scenery, a floor, reflections, cast shadows, or contact shadows.
- Preserve clean, softly antialiased edges. Use a soft alpha matte and slight edge feathering when needed to prevent the object from looking pasted onto the background.
- Keep small-map readability in mind: a clear silhouette and a few strong details are better than bright highlights or fine visual clutter.
- Design and validate map assets at their actual display size, typically about 40–50 pixels, against both green vegetation and brown soil. Do not judge visibility only from the large source image or a transparent-background preview.
- Give readability a modest safety margin: an item must be immediately identifiable, not merely visible at the limit. It should survive natural variation in map color, screen brightness, and per-item rotation without becoming lost.
- Prefer compact, substantial silhouettes over tall, sparse stems, hair-thin branches, scattered details, or large empty gaps. For flowering plants, use a broad, clearly visible flower crown; for roots and similar materials, retain several thick primary forms.
- Separate an item from terrain through realistic differences in value, temperature, and material color. For example, use aged ivory flowers against foliage or dry ochre roots against soil. Do not solve contrast with neon saturation, magical glow, artificial outlines, or shiny highlights.
- Avoid making collectible map assets excessively translucent. After extraction, set their in-game size and opacity high enough to remain readable, while keeping secondary resources slightly quieter than important or health-related items.
