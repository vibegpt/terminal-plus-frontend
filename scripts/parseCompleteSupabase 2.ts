import * as fs from 'fs';

// The complete Supabase CSV data you provided
const completeSupabaseData = `id,created_at,amenity_slug,description,website_url,logo_url,vibe_tags,booking_required,available_in_tr,price_level,opening_hours,terminal_code,airport_code,name
1,2025-08-02 15:06:51.227649+00,apple-store,,,,{Shop},false,true,,,SIN-T3,SIN,
2,2025-08-02 15:06:51.227649+00,cabin-bar-dfs,,,,{Explore},false,true,,,SIN-T3,SIN,
3,2025-08-02 15:06:51.227649+00,caffe-nero-t3-departures,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,,LHR-T3,LHR,
4,2025-08-02 15:06:51.227649+00,caffe-nero-t3-gate-b36,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,05:00-22:30,LHR-T3,LHR,
5,2025-08-02 15:06:51.227649+00,caffe-nero-t4-gate-16,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,05:30-22:30,LHR-T4,LHR,
6,2025-08-02 15:06:51.227649+00,caffe-nero-t5-arrivals,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,00:00-24:00,LHR-T5,LHR,
7,2025-08-02 15:06:51.227649+00,caffe-nero-t5-check-in,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,05:00-23:30,LHR-T5,LHR,
8,2025-08-02 15:06:51.227649+00,chandelier,,,,{Explore},false,true,,,SIN-T4,SIN,
9,2025-08-02 15:06:51.227649+00,charles-keith,,,,{Shop},false,true,,,SIN-T3,SIN,
10,2025-08-02 15:06:51.227649+00,coach,,,,{Shop},false,true,,,SIN-T3,SIN,
11,2025-08-02 15:06:51.227649+00,electronics-computers-sprint-cass-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
12,2025-08-02 15:06:51.227649+00,electronics-computers-sprint-cass-t2,,,,{Shop},false,true,,,SIN-T3,SIN,
13,2025-08-02 15:06:51.227649+00,eu-yan-sang,,,,{Shop},false,false,,,SIN-T2,SIN,
14,2025-08-02 15:06:51.227649+00,fila-jewel,,,,{Shop},false,false,,,SIN-JEWEL,SIN,
15,2025-08-02 15:06:51.227649+00,fila-t4,,https://www.fila.com.sg/,,{Shop},false,false,,,SIN-T4,SIN,
16,2025-08-02 15:06:51.227649+00,fila-kids-t2,,https://www.fila.com.sg/,,{Shop},false,false,,,SIN-T2,SIN,
17,2025-08-02 15:06:51.227649+00,fragrance-bak-kwa-t3,Shopping amenity in SIN-T3,,,{Shop},false,true,,,SIN-T3,SIN,
18,2025-08-02 15:06:51.227649+00,fragrance-bak-kwa-t1,Shopping amenity in SIN-T1,,,{Shop},false,true,,,SIN-T1,SIN,
19,2025-08-02 15:06:51.227649+00,fragrance-bak-kwa-t2,Shopping amenity in SIN-T2,,,{Shop},false,true,,,SIN-T2,SIN,
20,2025-08-02 15:06:51.227649+00,furla-jewel,,https://www.furla.com/sg/en/,,{Shop},false,false,,,SIN-JEWEL,SIN,
21,2025-08-02 15:06:51.227649+00,furla-t3,,https://www.furla.com/sg/en/,,{Shop},false,true,,,SIN-T3,SIN,
22,2025-08-02 15:06:51.227649+00,garrett-popcorn-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
23,2025-08-02 15:06:51.227649+00,garrett-popcorn-t4,,,,{Shop},false,true,,,SIN-T4,SIN,
24,2025-08-02 15:06:51.227649+00,gassan-watches-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
25,2025-08-02 15:06:51.227649+00,gassan-watches-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
26,2025-08-02 15:06:51.227649+00,giordano-sin-t1,Shopping amenity in SIN-T1,,,{Shop},false,true,,,SIN-T1,SIN,
27,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t1-16,,,,"{Shop,Quick}",false,true,,,SIN-T1,SIN,
28,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t1-69,,,,"{Shop,Quick}",false,true,,,SIN-T1,SIN,
29,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t2-13,,,,"{Shop,Quick}",false,false,,,SIN-T2,SIN,
30,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t2-155,,,,"{Shop,Quick}",false,true,,,SIN-T2,SIN,
31,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t3-basement-24,,,,"{Shop,Quick}",false,false,,,SIN-T3,SIN,
32,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t3-66,,,,"{Shop,Quick}",false,true,,,SIN-T3,SIN,
33,2025-08-02 15:06:51.227649+00,guardian-health-beauty-sin-t3-29,,,,"{Shop,Quick}",false,true,,,SIN-T3,SIN,
34,2025-08-02 15:06:51.227649+00,gucci-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
35,2025-08-02 15:06:51.227649+00,gucci-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
36,2025-08-02 15:06:51.227649+00,gucci-t3,,,,{Shop},false,true,,,SIN-T3,SIN,
37,2025-08-02 15:06:51.227649+00,heritage-zone,,,,{Explore},false,true,,,SIN-T4,SIN,
38,2025-08-02 15:06:51.227649+00,hermes-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
39,2025-08-02 15:06:51.227649+00,hermes-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
40,2025-08-02 15:06:51.227649+00,hermes-t3,,,,{Shop},false,true,,,SIN-T3,SIN,
41,2025-08-02 15:06:51.227649+00,immersive-wall,,,,{Explore},false,true,,,SIN-T4,SIN,
42,2025-08-02 15:06:51.227649+00,irvins-salted-egg-jewel,,https://www.irvinsaltedegg.com/,,{Shop},false,false,,,SIN-JEWEL,SIN,
43,2025-08-02 15:06:51.227649+00,irvins-salted-egg-t1,,https://www.irvinsaltedegg.com/,,{Shop},false,true,,,SIN-T1,SIN,
44,2025-08-02 15:06:51.227649+00,irvins-salted-egg-t4,,https://www.irvinsaltedegg.com/,,{Shop},false,true,,,SIN-T4,SIN,
45,2025-08-02 15:06:51.227649+00,istudio,,,,{Shop},false,true,,,SIN-T3,SIN,
46,2025-08-02 15:06:51.227649+00,kaboom-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
47,2025-08-02 15:06:51.227649+00,kaboom-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
48,2025-08-02 15:06:51.227649+00,kaboom-t3,,,,{Shop},false,true,,,SIN-T3,SIN,
49,2025-08-02 15:06:51.227649+00,kashkha,,,,{Shop},false,true,,,SIN-T4,SIN,
50,2025-08-02 15:06:51.227649+00,kering-eyewear-lagardere,,,,{Shop},false,true,,,SIN-T2,SIN,
51,2025-08-02 15:06:51.227649+00,lacoste,,,,{Shop},false,true,,,SIN-T3,SIN,
52,2025-08-02 15:06:51.227649+00,lego-airport-store,,,,{Shop},false,true,,,SIN-T4,SIN,
53,2025-08-02 15:06:51.227649+00,lindt,,,,{Shop},false,true,,,SIN-T1,SIN,
54,2025-08-02 15:06:51.227649+00,longchamp-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
55,2025-08-02 15:06:51.227649+00,longchamp-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
56,2025-08-02 15:06:51.227649+00,longchamp-t3,,,,{Shop},false,true,,,SIN-T3,SIN,
57,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t1-level-1-10,,,,{Shop},false,true,,1d,SIN-T1,SIN,
58,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t1-level-1-23,,,,{Shop},false,true,,1d,SIN-T1,SIN,
59,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t1-level-2-53,,,,{Shop},false,true,,1d,SIN-T1,SIN,
60,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t1-level-2-68,,,,{Shop},false,true,,06:00 - 00:00,SIN-T1,SIN,
61,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t1-level-2-22,,,,{Shop},false,true,,1d,SIN-T1,SIN,
62,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t1-level-2-46,,,,{Shop},false,true,,1d,SIN-T1,SIN,
63,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t2-level-1-176,,,,{Shop},false,true,,1d,SIN-T2,SIN,
64,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t2-level-1-151,,,,{Shop},false,true,,1d,SIN-T2,SIN,
65,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t2-level-2-401,,,,{Shop},false,true,,1d,SIN-T2,SIN,
66,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t2-level-3-189,,,,{Shop},false,true,,1d,SIN-T2,SIN,
67,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t2-level-2-197,,,,{Shop},false,true,,06:00 - 01:00,SIN-T2,SIN,
68,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t3-level-1-19,,,,{Shop},false,true,,1d,SIN-T3,SIN,
69,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t3-level-1-29,,,,{Shop},false,true,,1d,SIN-T3,SIN,
70,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t3-level-2-65,,,,{Shop},false,true,,06:00 - 01:00,SIN-T3,SIN,
71,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t3-level-2-65,,,,{Shop},false,true,,06:00 - 01:00,SIN-T3,SIN,
72,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t3-level-2-37,,,,{Shop},false,true,,1d,SIN-T3,SIN,
73,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t3-level-3-7,,,,{Shop},false,true,,1d,SIN-T3,SIN,
74,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t4-level-1-12,,,,{Shop},false,true,,1d,SIN-T4,SIN,
75,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t4-level-2-25,,,,{Shop},false,true,,1d,SIN-T4,SIN,
76,2025-08-02 15:06:51.227649+00,lotte-duty-free-wines-spirits-t4-level-2-57,,,,{Shop},false,true,,1d,SIN-T4,SIN,
77,2025-08-02 15:06:51.227649+00,louis-vuitton-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
78,2025-08-02 15:06:51.227649+00,louis-vuitton-t3,,,,{Shop},false,true,,,SIN-T3,SIN,
79,2025-08-02 15:06:51.227649+00,lululemon,,,,{Shop},false,true,,,SIN-T1,SIN,
80,2025-08-02 15:06:51.227649+00,memory-of-lived-space,,,,{Explore},false,false,,,SIN T3,SIN,
81,2025-08-02 15:06:51.227649+00,michael-kors,,,,{Shop},false,true,,,SIN-T3,SIN,
82,2025-08-02 15:06:51.227649+00,montblanc,,,,{Shop},false,true,,,SIN-T3,SIN,
83,2025-08-02 15:06:51.227649+00,mother-and-child,,,,{Explore},false,false,,,SIN-T1,SIN,
84,2025-08-02 15:06:51.227649+00,petalclouds,,,,{Explore},false,true,,,SIN-T4,SIN,
85,2025-08-02 15:06:51.227649+00,plaza-premium-lounge-syd,Relax in a quiet setting with snacks and drinks.,,https://yourbucket.supabase.co/storage/plaza-logo.png,"{Chill,Comfort}",false,true,$$,09:00 - 23:00,SYD-T1,SYD,
86,2025-08-02 15:06:51.227649+00,plaza-premium-lounge-lhr,Relax in a quiet setting with snacks and drinks.,,https://yourbucket.supabase.co/storage/plaza-logo.png,"{Chill,Comfort}",false,true,$$,09:00 - 23:00,LHR-T2,LHR,
87,2025-08-02 15:06:51.227649+00,qantas-business-lounge,Spacious lounge with business amenities and hot meals.,https://qantas.com/lounge-booking,https://yourbucket.supabase.co/storage/qantas-logo.png,"{Work,Chill,Comfort,Refuel}",true,true,$$$,1d,SYD-T1,SYD,
88,2025-08-02 15:06:51.227649+00,rhythm-of-nature,,https://www.jewelchangiairport.com/en/attractions/shiseido-forest-valley.html,,{Explore},false,false,,,SIN-JEWEL,SIN,
89,2025-08-02 15:06:51.227649+00,rituals,,,,{Shop},false,true,,,SIN-T3,SIN,
90,2025-08-02 15:06:51.227649+00,saga-seed,,,,{Explore},false,true,,,SIN-T1,SIN,
91,2025-08-02 15:06:51.227649+00,spirit-of-man,,,,{Explore},false,true,,,SIN-T1,SIN,
92,2025-08-02 15:06:51.227649+00,steel-in-bloom,,,,{Explore},false,true,,,SIN-T4,SIN,
93,2025-08-02 15:06:51.227649+00,sunglass-hut-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
94,2025-08-02 15:06:51.227649+00,sunglass-hut-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
95,2025-08-02 15:06:51.227649+00,sunglass-hut-t3,,,,{Shop},false,true,,,SIN-T4,SIN,
96,2025-08-02 15:06:51.227649+00,swarovski-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
97,2025-08-02 15:06:51.227649+00,swarovski-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
98,2025-08-02 15:06:51.227649+00,taste-singapore,,,,{Shop},false,true,,,SIN-T4,SIN,
99,2025-08-02 15:06:51.227649+00,the-cocoa-trees,,,,{Shop},false,true,,,SIN-T3,SIN,
100,2025-08-02 15:06:51.227649+00,the-digital-gadgets-jewel,,https://www.thedigitalgadgets.com/,,{Shop},false,false,,,SIN-JEWEL,SIN,
101,2025-08-02 15:06:51.227649+00,the-digital-gadgets-t4,,https://www.thedigitalgadgets.com/,,{Shop},false,false,,,SIN-T4,SIN,
102,2025-08-02 15:06:51.227649+00,the-fashion-place,,,,{Shop},false,true,,,SIN-T4,SIN,
103,2025-08-02 15:06:51.227649+00,tiffany-co,,,,{Shop},false,true,,,SIN-T1,SIN,
104,2025-08-02 15:06:51.227649+00,timberland,,,,{Shop},false,true,,,SIN-T3,SIN,
105,2025-08-02 15:06:51.227649+00,times-travel,,,,{Shop},false,true,,,SIN-T1,SIN,
106,2025-08-02 15:06:51.227649+00,tods,,,,{Shop},false,true,,,SIN-T2,SIN,
107,2025-08-02 15:06:51.227649+00,tommy-hilfiger,,,,{Shop},false,true,,,SIN-T2,SIN,
108,2025-08-02 15:06:51.227649+00,tory-burch-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
109,2025-08-02 15:06:51.227649+00,tory-burch-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
110,2025-08-02 15:06:51.227649+00,travelex-money-changer-t1,,,,"{Quick,Shop}",false,false,,,SIN-T1,SIN,
111,2025-08-02 15:06:51.227649+00,travelex-money-changer-t2,,,,"{Quick,Shop}",false,false,,,SIN-T2,SIN,
112,2025-08-02 15:06:51.227649+00,travelex-money-changer-t3,,,,"{Quick,Shop}",false,true,,,SIN-T4,SIN,
113,2025-08-02 15:06:51.227649+00,travelling-family,,,,{Explore},false,true,,,SIN-T4,SIN,
114,2025-08-02 15:06:51.227649+00,tumi,,,,{Shop},false,true,,,SIN-T2,SIN,
115,2025-08-02 15:06:51.227649+00,twg-tea-boutique-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
116,2025-08-02 15:06:51.227649+00,twg-tea-boutique-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
117,2025-08-02 15:06:51.227649+00,twg-tea-boutique-t3,,,,{Shop},false,true,,,SIN-T4,SIN,
118,2025-08-02 15:06:51.227649+00,uniqlo-jewel,,https://www.uniqlo.com/sg/,,{Shop},false,false,,,SIN-JEWEL,SIN,
119,2025-08-02 15:06:51.227649+00,uniqlo-t1,,https://www.uniqlo.com/sg/,,{Shop},false,true,,,SIN-T1,SIN,
120,2025-08-02 15:06:51.227649+00,unity,,,,"{Shop,Quick}",false,true,,,SIN-T2,SIN,
121,2025-08-02 15:06:51.227649+00,uob-gold,,,,{Shop},false,true,,,SIN-T2,SIN,
122,2025-08-02 15:06:51.227649+00,vessel,,,,{Explore},false,true,,,SIN-T3,SIN,
123,2025-08-02 15:06:51.227649+00,victorias-secret-beauty-accessories-t1,,,,{Shop},false,true,,,SIN-T1,SIN,
124,2025-08-02 15:06:51.227649+00,victorias-secret-beauty-accessories-t2,,,,{Shop},false,true,,,SIN-T2,SIN,
125,2025-08-02 15:06:51.227649+00,watches-of-switzerland,,,,{Shop},false,true,,,SIN-T3,SIN,
126,2025-08-02 15:06:51.227649+00,whsmith-t1-level-1-84,,,,{Shop},false,false,,07:00 - 23:00,SIN-T1,SIN,
127,2025-08-02 15:06:51.227649+00,whsmith-t1-level-2-67,,,,{Shop},false,true,,,SIN-T1,SIN,
128,2025-08-02 15:06:51.227649+00,whsmith-t1-level-2-41,,,,{Shop},false,true,,,SIN-T1,SIN,
129,2025-08-02 15:06:51.227649+00,whsmith-t2-level-1-26,,,,{Shop},false,false,,06:00 - 01:00,SIN-T2,SIN,
130,2025-08-02 15:06:51.227649+00,whsmith-t2-level-2-207,,,,{Shop},false,true,,06:00 - 01:00,SIN-T2,SIN,
131,2025-08-02 15:06:51.227649+00,whsmith-t3-level-2-43,,,,{Shop},false,true,,,SIN-T3,SIN,
132,2025-08-02 15:06:51.227649+00,whsmith-t3-level-2-7,,,,{Shop},false,true,,,SIN-T3,SIN,
133,2025-08-02 15:06:51.227649+00,whsmith-t4-level-2-59,,,,{Shop},false,true,,06:00 - 00:00,SIN-T4,SIN,
134,2025-08-02 15:06:51.227649+00,zakkasg,,,,{Shop},false,true,,,SIN-T4,SIN,
135,2025-08-02 15:06:51.227649+00,zegna,,,,{Shop},false,true,,,SIN-T2,SIN,
10000,2025-08-02 18:06:08.299+00,canopy-park-jewel-new,"Indoor park with nets, mazes and slides",,,"{Chill,Explore}",false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Canopy Park
10001,2025-08-02 18:06:08.3+00,foggy-bowls-jewel-new,Mist-filled play areas for children,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Foggy Bowls
10002,2025-08-02 18:06:08.3+00,hedge-maze-jewel-new,Singapore's largest hedge maze,,,"{Explore,Fun}",false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Hedge Maze
10003,2025-08-02 18:06:08.3+00,manulife-sky-nets-jewel-new,Walking and bouncing nets suspended in the air,,,"{Explore,Fun}",false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Manulife Sky Nets
10004,2025-08-02 18:06:08.3+00,mirror-maze-jewel-new,Immersive mirror maze experience,,,"{Explore,Fun}",false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Mirror Maze
10005,2025-08-02 18:06:08.3+00,rain-vortex-jewel-new,The world's tallest indoor waterfall,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Rain Vortex
10006,2025-08-02 18:06:08.3+00,shiseido-forest-valley-jewel-new,Lush indoor forest with walking trails,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Shiseido Forest Valley
10007,2025-08-02 18:06:08.3+00,changi-experience-studio-jewel-new,Interactive digital attraction about Changi Airport,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Changi Experience Studio
10008,2025-08-02 18:06:08.3+00,social-tree-jewel-new,Interactive installation for photo sharing,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""24:00""}",SIN-JEWEL,SIN,Social Tree
10009,2025-08-02 18:06:08.3+00,bengawan-solo-jewel-new,Traditional Singaporean cakes and kueh,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Bengawan Solo
10010,2025-08-02 18:06:08.3+00,tiger-street-lab-jewel-new,Craft beer and local fare,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Tiger Street Lab
10011,2025-08-02 18:06:08.3+00,din-tai-fung-jewel-new,Renowned Taiwanese restaurant famous for xiaolongbao,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Din Tai Fung
10012,2025-08-02 18:06:08.3+00,koi-th-jewel-new,Premium Taiwanese bubble tea,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Koi Thé
10013,2025-08-02 18:06:08.3+00,song-fa-bak-kut-teh-jewel-new,Award-winning pork rib soup,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Song Fa Bak Kut Teh
10014,2025-08-02 18:06:08.3+00,travelex-jewel-new,Global foreign exchange services,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Travelex
10015,2025-08-02 18:06:08.3+00,uob-currency-exchange-jewel-new,Competitive rates for currency exchange,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,UOB Currency Exchange
10016,2025-08-02 18:06:08.3+00,telecommunications-kiosk-jewel-new,SIM cards and mobile services,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Telecommunications Kiosk
10017,2025-08-02 18:06:08.3+00,trs-tax-refund-jewel-new,Tourist refund scheme counter,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,TRS Tax Refund
10018,2025-08-02 18:06:08.3+00,spa-express-jewel-new,Quick massage and spa treatments,,,"{Chill,Comfort}",false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Spa Express
10019,2025-08-02 18:06:08.3+00,kinokuniya-jewel-new,Comprehensive Japanese bookstore,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Kinokuniya
10020,2025-08-02 18:06:08.3+00,zara-jewel-new,Spanish fast fashion retailer,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Zara
10021,2025-08-02 18:06:08.3+00,irvins-salted-egg-jewel-new,Popular salted egg fish skin and chips,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Irvins Salted Egg
10022,2025-08-02 18:06:08.3+00,eu-yan-sang-jewel-new,Traditional Chinese medicine,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Eu Yan Sang
10023,2025-08-02 18:06:08.3+00,muji-jewel-new,Minimalist Japanese home goods,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-JEWEL,SIN,Muji
10147,2025-08-02 18:06:08.3+00,tokyu-hands-t4-new,Japanese lifestyle store,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-T4,SIN,Tokyu Hands`;

function parseCSV(csvData: string): Set<string> {
  const lines = csvData.split('\n');
  const existingSlugs = new Set<string>();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV with quoted fields
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    if (columns.length >= 14) {
      const slug = columns[2]; // amenity_slug column
      existingSlugs.add(slug);
    }
  }
  
  return existingSlugs;
}

function loadModularAmenities(): any[] {
  const terminals = ['sin_jewel', 'sin_t1', 'sin_t2', 'sin_t3', 'sin_t4'];
  const allAmenities: any[] = [];
  
  for (const terminal of terminals) {
    try {
      const content = fs.readFileSync(`../src/data/${terminal}.json`, 'utf-8');
      const amenities = JSON.parse(content);
      
      for (const amenity of amenities) {
        const enhancedAmenity = {
          ...amenity,
          terminal: terminal.toUpperCase().replace('_', '-'),
          airport: 'SIN'
        };
        allAmenities.push(enhancedAmenity);
      }
    } catch (error) {
      console.log(`⚠️ Could not read ${terminal}.json`);
    }
  }
  
  return allAmenities;
}

function generateSlug(name: string, terminal: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  const terminalSuffix = terminal.toLowerCase().replace('-', '');
  return `${baseSlug}-${terminalSuffix}`;
}

function main() {
  console.log('🔍 Parsing complete Supabase data...');
  const existingSlugs = parseCSV(completeSupabaseData);
  console.log(`Found ${existingSlugs.size} amenities in complete Supabase data`);
  
  console.log('📁 Loading modular JSON amenities...');
  const modularAmenities = loadModularAmenities();
  console.log(`Found ${modularAmenities.length} amenities in modular JSON files`);
  
  // Filter out amenities that already exist in Supabase
  const missingAmenities = modularAmenities.filter(amenity => {
    const slug = generateSlug(amenity.name, amenity.terminal);
    return !existingSlugs.has(slug);
  });
  
  console.log(`\n📊 Analysis:`);
  console.log(`- Total modular amenities: ${modularAmenities.length}`);
  console.log(`- Existing in Supabase: ${existingSlugs.size}`);
  console.log(`- Missing from Supabase: ${missingAmenities.length}`);
  
  if (missingAmenities.length === 0) {
    console.log('\n✅ All modular amenities are already in Supabase!');
    return;
  }
  
  // Show breakdown by terminal
  const terminalCounts: { [key: string]: number } = {};
  for (const amenity of missingAmenities) {
    const terminal = amenity.terminal;
    terminalCounts[terminal] = (terminalCounts[terminal] || 0) + 1;
  }
  
  console.log('\n📋 Missing amenities by terminal:');
  for (const [terminal, count] of Object.entries(terminalCounts).sort()) {
    console.log(`- ${terminal}: ${count} amenities`);
  }
  
  console.log(`\n💡 You have ${missingAmenities.length} amenities missing from Supabase!`);
}

main(); 