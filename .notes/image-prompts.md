# Image prompts for child mode

Generated images replace the OpenMoji placeholders where they fit. Every file goes in `.notes/assets.md` with its source and licence before it is used.

## Style block (add to every prompt)
> Flat 2D vector illustration for a calm children's learning app for autistic children. Soft pastel palette, smooth rounded shapes, consistent 3px dark-navy (#1b2a38) outline, simple flat shading (one darker tone, no gradients, no glow, no texture), friendly and gentle, low clutter, no text, no letters, no logos, no watermark.

## Game thumbnails (16:10, 1600×1000 PNG)
Keep the top-left corner empty (the game tag sits there) and the main subject centred.
1. **Feed the shark (Action words):** underwater scene, a friendly round grey shark with a gentle smile swimming left to right, three small colourful fish ahead of it, sea floor with green seaweed, coral and a pink shell, light-blue water fading to deeper blue, a few bubbles.
2. **Balloon pop (Feelings):** soft pink sky with white clouds, three floating balloons in red, yellow and blue, each with a simple face (happy, sad, surprised), confetti specks.
3. **Word bubbles (Describing words):** turquoise lagoon, a smiling pink octopus holding large clear bubbles, a lemon, a snowflake and a feather floating inside the bubbles.
4. **Memory cards (Opposites):** indigo night sky with a crescent moon and stars, four playing cards fanned out, two face up showing a sun and a moon.
5. **Word squish (Short words):** sunny beach with a palm tree and a turtle, two rounded word blocks being pressed together by a friendly clamp into one block.
6. **Weigh it up (Bigger and smaller):** green meadow, a balance scale with an elephant on one pan and a mouse on the other, a tree and the sun.
7. **Put it there (Where is it?):** spring garden, a cardboard box in the middle with a curious cat peeking from behind it, butterflies and flowers.
8. **Word train (A or the):** countryside with pine trees, a small red steam engine pulling two wagons on a track, a hill and a cloud.
9. **Yes or no (Ask me):** lavender playroom with a rainbow on the wall, a teddy bear, a big green thumbs-up and a small red thumbs-down sign.
10. **Detective (Why?):** cosy library with bookshelves, a friendly child detective in a brown cap holding a magnifying glass, a lamp.
11. **Who can't? (Can and can't):** jungle meadow, a lion and a snake side by side looking at a little river, a monkey in a tree.
12. **Story (Colours around us):** open picture book on a table with a rainbow coming out of it, a red apple, a green frog and a yellow banana.

## Sprites (transparent PNG, 1024×1024, single object centred, no ground shadow)
- **Shark game:** shark (mouth closed), shark (mouth open), fish ×3 (blue, yellow striped, orange puffer), seaweed, coral, shell, bubble cluster.
- **Balloon game:** balloon ×3 colours, balloon popping burst, cloud.
- **Bubbles game:** octopus, single clear bubble.
- **Memory game:** card back (indigo with a small star), blank card front frame.
- **Squish game:** clamp (open), clamp (closed).
- **Scale game:** balance scale level, tipped left, tipped right.
- **Place game:** cardboard box, chair, dog house, tree; cat, dog, mouse, duck, ball, bird, rabbit (each sitting, facing the viewer).
- **Train game:** steam engine, wagon (empty, open top so a word card can sit in it).
- **Yes/no game:** thumbs up, thumbs down.
- **Detective game:** detective child, magnifying glass.
- **Rewards:** gold star, trophy, medal ribbon, confetti piece set.
- **Avatars (round, head and shoulders):** lion, rabbit, panda, fox, koala, penguin, owl, frog, bear, unicorn.
- **Game badges (round medal with the game's sprite inside, its theme colour as the medal face):** one for each of the 12 games.

## Status (2026-11-04)
In use as game scenes: shark, balloons, bubbles, compare, place, train, yesno, pick.

Regenerate before use:
- **Memory cards:** the result showed tarot cards with "Sun" and "Moon" written on them. Ask for plain rounded cards with no writing and no tarot look.
- **Word squish:** the result had the words "SUN SHINE" on the blocks. Ask for blank coloured blocks.
- **Story:** the result was photo-realistic. Repeat the style block word for word.
- **Detective (Why?):** not generated yet.

Not used: the sprite sheets, avatars, rewards and badges. They would sit beside OpenMoji icons on the same row (avatar next to the stats, trophy next to the stars) and clash in style. The sheet's shark also has an open, toothy mouth, which is wrong for this audience. They are kept until a full sprite set can replace OpenMoji in one go.
