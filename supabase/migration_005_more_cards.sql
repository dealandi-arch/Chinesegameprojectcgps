-- Wok Quest: migration 005 -- more real cards, to support 60-card decks.
-- Run after migration_003_card_roles_and_energy.sql (needs the role/
-- energy_amount columns). Purely additive -- does not touch or duplicate
-- the 9 cards already seeded in migration_003.
--
-- This brings the pool to 12 Attacker / 8 Support / 4 Energy = 24 unique
-- cards. src/lib/battle/engine.ts builds each 60-card deck by taking up
-- to 4 copies of each unique Attacker/Support card and filling the rest
-- with Energy cards (unlimited copies, like Basic Energy in real TCGs).
--
-- Requires at least one existing ADMIN account (same as migration_003's
-- seed section) for the created_by/updated_by subquery to resolve.
-- image_urls is left empty for the same reason as before -- no
-- image-generation tool is available in this session.

insert into public.cards (title, body, role, card_type, hp, energy_amount, abilities, created_by, updated_by)
values
  ($t$Char Siu Bao$t$,
   $t$Char siu bao is a steamed bun filled with barbecued pork, considered one of the "four heavenly kings" of Cantonese dim sum alongside har gow, siu mai, and egg tart. The fluffy white bun often splits slightly at the top when steamed, revealing the glossy filling beneath.$t$,
   'ATTACKER', 'Dim Sum', 55, 1,
   '[{"name":"Fluffy Bun Bash","description":"A soft but surprising blow.","damage":16,"energyCost":1},{"name":"BBQ Pork Eruption","description":"Bursts open to reveal its glossy pork filling.","damage":36,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Fun Guo$t$,
   $t$Fun guo is a Chiu Chow-style dumpling with a chewy wheat-starch wrapper filled with peanuts, dried shrimp, pork, and mushroom, folded into a distinctive pleated crescent. It's a staple in Hong Kong dim sum houses shaped by Chiu Chow (Teochew) cuisine.$t$,
   'ATTACKER', 'Dim Sum', 48, 1,
   '[{"name":"Crescent Fold","description":"Strikes with its pleated crescent edge.","damage":14,"energyCost":1},{"name":"Peanut Crunch","damage":32,"energyCost":2,"description":"A hearty crunch of peanut and dried shrimp."}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Cheong Fun$t$,
   $t$Cheong fun is a silky rice noodle roll, steamed thin and wrapped around fillings like shrimp or beef, then finished with soy sauce. Believed to have originated near Guangzhou's Litchi Bay, it remains a breakfast and dim sum staple across Hong Kong and Guangdong.$t$,
   'ATTACKER', 'Dim Sum', 42, 1,
   '[{"name":"Silky Roll","description":"Slips in with a smooth, silky strike.","damage":12,"energyCost":1},{"name":"Soy Drizzle Slam","description":"Drenches the foe in savory soy sauce.","damage":30,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Law Bak Go$t$,
   $t$Law bak go (turnip cake) is a savory cake of shredded daikon radish, rice flour, and dried shrimp or Chinese sausage, steamed then pan-fried to a golden crust. It's a Cantonese dim sum and Lunar New Year staple, prized for its crisp exterior and soft interior.$t$,
   'ATTACKER', 'Dim Sum', 52, 1,
   '[{"name":"Golden Crust Strike","description":"Cracks forward with a pan-seared crust.","damage":17,"energyCost":1},{"name":"Pan-Fried Pound","description":"Pounds down with radish-cake weight.","damage":37,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Wu Gok$t$,
   $t$Wu gok is a deep-fried dumpling with a lattice-textured mashed taro shell wrapped around a savory pork and mushroom filling. Its flaky, web-like crust is a hallmark of Cantonese dim sum kitchens and a technically demanding dish to make well.$t$,
   'ATTACKER', 'Dim Sum', 58, 1,
   '[{"name":"Lattice Crunch","description":"Its web-like taro shell crunches on impact.","damage":18,"energyCost":1},{"name":"Taro Shell Slam","description":"Slams down with its full fried shell.","damage":38,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Cantonese Zongzi$t$,
   $t$Cantonese-style zongzi are large glutinous rice dumplings wrapped in bamboo or lotus leaves, packed with pork belly, salted egg yolk, mung beans, and mushrooms, then steamed for hours. Traditionally eaten during the Dragon Boat Festival, Guangdong's version is notably larger and richer than other regional styles.$t$,
   'ATTACKER', 'Dim Sum', 65, 1,
   '[{"name":"Bamboo Wrap Bind","description":"Binds the foe in woven bamboo leaf.","damage":20,"energyCost":1},{"name":"Salted Yolk Burst","description":"Bursts with rich salted egg yolk.","damage":42,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Egg Tart$t$,
   $t$The Hong Kong egg tart blends a British custard-tart influence with Cantonese pastry technique -- a flaky or shortcrust shell around smooth egg custard. It rose to citywide popularity through Hong Kong's cha chaan tengs and bakeries over the 20th century.$t$,
   'ATTACKER', 'Dim Sum', 40, 1,
   '[{"name":"Flaky Crust Jab","description":"A light jab of buttery pastry.","damage":11,"energyCost":1},{"name":"Custard Wave","description":"Washes over the foe in warm egg custard.","damage":27,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Zin Deui$t$,
   $t$Zin deui is a deep-fried glutinous rice ball coated in sesame seeds, puffing up hollow inside as it fries, often filled with lotus paste. It's a traditional Lunar New Year treat in Guangdong, its round shape symbolizing prosperity and reunion.$t$,
   'ATTACKER', 'Dim Sum', 47, 1,
   '[{"name":"Sesame Coat Strike","description":"Peppers the foe with toasted sesame.","damage":15,"energyCost":1},{"name":"Puffed Rice Burst","description":"Bursts its hollow puffed shell outward.","damage":33,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Cantonese Spring Roll$t$,
   $t$The Cantonese spring roll is a thin-wrapped, deep-fried roll of shredded vegetables, mushrooms, and sometimes pork or shrimp, traditionally eaten around Lunar New Year to symbolize wealth, its golden color resembling gold bars. It remains a dim sum trolley staple across Hong Kong.$t$,
   'ATTACKER', 'Dim Sum', 44, 1,
   '[{"name":"Golden Wrap Snap","description":"Snaps forward with a crackling golden wrap.","damage":13,"energyCost":1},{"name":"Deep-Fried Crackle","description":"Crackles with deep-fried force.","damage":29,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Tang Draw$t$,
   $t$Mala tang, literally "numbing-spicy hot," is a build-your-own soup of skewered vegetables, meats, and noodles cooked in a mala broth. Originally Sichuanese street food, it has become a common quick-meal chain format across Hong Kong shopping districts.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Tang Draw","description":"Draw 2 extra cards.","effectType":"DRAW","magnitude":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Xiang Guo Refill$t$,
   $t$Mala xiang guo ("numbing-spicy fragrant pot") is a dry stir-fry where diners pick their own ingredients to be wok-tossed in mala seasoning. It exploded in popularity across Hong Kong in the 2010s as a customizable, affordably-priced spicy meal.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Xiang Guo Refill","description":"Heal 25 HP on your active card.","effectType":"HEAL","magnitude":25}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Crayfish Drizzle$t$,
   $t$Mala crayfish tosses whole crayfish in a fiery mala sauce, a dish that originated in Hubei and Sichuan and has become a popular seasonal delicacy at Hong Kong seafood restaurants and night markets.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Crayfish Drizzle","description":"Immediately attach 1 bonus energy.","effectType":"ADD_ENERGY","magnitude":1}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Skewer Boost$t$,
   $t$Mala skewers -- grilled meat and vegetables dusted in numbing chili spice -- trace back to Northern Chinese Muslim barbecue traditions later fused with Sichuan mala seasoning. Skewer stalls serving them are now a familiar sight in Hong Kong's late-night food scene.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Skewer Boost","description":"Your next attack this turn deals +15 damage.","effectType":"BOOST_DAMAGE","magnitude":15}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Oyster Sauce$t$,
   $t$Oyster sauce was invented by accident in 1888 by Lee Kum Sheung in Nam Shui, Guangdong, when a pot of simmering oysters was left too long and reduced into a rich, savory sauce. It went on to become one of the defining condiments of Cantonese cooking worldwide.$t$,
   'ENERGY', 'Sauce', 1, 1,
   '[]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Hoisin Sauce$t$,
   $t$Despite its name meaning "seafood" in Cantonese, hoisin sauce contains no seafood at all -- it's a sweet, salty blend of fermented soybean paste, garlic, and spices that originated in Guangdong and is now a staple glaze across Cantonese barbecue and stir-fry dishes.$t$,
   'ENERGY', 'Sauce', 1, 1,
   '[]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1));
