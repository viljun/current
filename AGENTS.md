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
- For objects that stand or rest on the ground, first understand the object’s three-dimensional support geometry and identify its complete perspective-shaped ground-contact silhouette. This is usually the lower envelope of the object across its width, including sloping side-bottom and front-bottom edges—not a horizontal strip along the bottom of the image canvas. Keep unrelated upper and side edges clean, but give the full support silhouette extra alpha feathering so it settles naturally into grass, sand, or soil instead of appearing to float. Use grounded construction details such as uneven feet, embedded dirt, and worn lower edges, but do not bake in terrain-specific grass, sand, or a visible shadow.
- Calculate bottom feathering in final rendered pixels, not source-image pixels. Scale the source alpha ramp so it remains visibly effective after browser downsampling: roughly 1.5–2.5 rendered pixels for small or delicate objects and about 3–5 pixels for large, heavy grounded objects such as chests. Subpixel source settings such as `0.5` on a large generated image are effectively no antialiasing at map size.
- Build directional grounding masks from the actual support silhouette, for example by finding and feathering the bottommost occupied pixel independently in each image column. Never substitute a fixed canvas-row gradient unless the object truly has a horizontal support edge across the entire image.
- For trees and other objects with wide overhanging silhouettes, restrict the grounding mask to columns whose opaque shape actually reaches the ground line. Feather the trunk and exposed root base only; do not blur the lower edges of foliage, branches, handles, or other parts suspended above the terrain.
- Validate grounded assets by compositing them at the exact in-game dimensions onto representative grass, sand, and soil textures. A large transparent preview is insufficient. Inspect the entire lower envelope from side to side and reject any asset whose front-bottom or side-bottom support edge still ends in a hard opaque cut.
- Do not apply arbitrary two-dimensional sprite rotation to standing objects when it would tilt their ground plane. Build directional variation into the photographed or rendered three-dimensional viewpoint instead, and keep the final contact edge level with the map.
- Keep small-map readability in mind: a clear silhouette and a few strong details are better than bright highlights or fine visual clutter.
- Design and validate map assets at their actual display size, typically about 40–50 pixels, against both green vegetation and brown soil. Do not judge visibility only from the large source image or a transparent-background preview.
- Give readability a modest safety margin: an item must be immediately identifiable, not merely visible at the limit. It should survive natural variation in map color, screen brightness, and per-item rotation without becoming lost.
- Prefer compact, substantial silhouettes over tall, sparse stems, hair-thin branches, scattered details, or large empty gaps. For flowering plants, use a broad, clearly visible flower crown; for roots and similar materials, retain several thick primary forms.
- Separate an item from terrain through realistic differences in value, temperature, and material color. For example, use aged ivory flowers against foliage or dry ochre roots against soil. Do not solve contrast with neon saturation, magical glow, artificial outlines, or shiny highlights.
- Avoid making collectible map assets excessively translucent. After extraction, set their in-game size and opacity high enough to remain readable, while keeping secondary resources slightly quieter than important or health-related items.
