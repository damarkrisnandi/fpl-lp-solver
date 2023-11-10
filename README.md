# FPL Optimizer based on Expected Points

## default
```
node index
```
result
```

====== FPL gameweek 12 Optimization =====
--- trfopt ---
┌──────────────┬────────────┐
│   (index)    │   Values   │
├──────────────┼────────────┤
│   feasible   │   false    │
│    result    │     -0     │
│   bounded    │    true    │
│     Cash     │     1      │
│     Saka     │     -1     │
│ Douglas Luiz │ 0.98630137 │
│   Watkins    │     1      │
│   Lamptey    │     1      │
│   Andersen   │     1      │
│  Johnstone   │     1      │
│     Leno     │     1      │
│  J.Alvarez   │     1      │
│   Haaland    │     1      │
│   Anderson   │     1      │
│     Burn     │     1      │
│   Maddison   │     1      │
│    Mbeumo    │     1      │
│    White     │     1      │
│ B.Fernandes  │     1      │
│    Salah     │ 1.01369863 │
└──────────────┴────────────┘
--- pickopt ---
┌──────────────┬─────────────┐
│   (index)    │   Values    │
├──────────────┼─────────────┤
│   feasible   │    true     │
│    result    │ 68.13204106 │
│   bounded    │    true     │
│  isIntegral  │    true     │
│     Saka     │      1      │
│     Burn     │      1      │
│    Mbeumo    │      1      │
│ Douglas Luiz │      1      │
│   Watkins    │      1      │
│    Salah*    │      1      │
│ B.Fernandes  │      1      │
│  Johnstone   │      1      │
│    White     │      1      │
│    Salah     │      1      │
│   Haaland    │      1      │
│     Cash     │      1      │
└──────────────┴─────────────┘
Solution unfeasible!


node index --money=100 --playerId=471950 --replace=1
(default command)
customize this script to get the different result!


================
``` 

## custom
```
node index --money=102.7 --playerId=471950 --replace=3
```

result
```

====== FPL gameweek 12 Optimization =====
--- trfopt ---
┌──────────────┬─────────────┐
│   (index)    │   Values    │
├──────────────┼─────────────┤
│   feasible   │    true     │
│    result    │ 66.82532919 │
│   bounded    │    true     │
│  isIntegral  │    true     │
│     Cash     │      1      │
│   Mitchell   │      1      │
│ Douglas Luiz │      1      │
│   Watkins    │      1      │
│     Saka     │      1      │
│    Guéhi     │      1      │
│     Leno     │      1      │
│   Haaland    │      1      │
│  J.Alvarez   │      1      │
│   Anderson   │      1      │
│     Burn     │      1      │
│   Maddison   │      1      │
│ Pedro Porro  │      1      │
│    Areola    │      1      │
│    Salah     │      1      │
└──────────────┴─────────────┘
--- pickopt ---
┌──────────────┬─────────────┐
│   (index)    │   Values    │
├──────────────┼─────────────┤
│   feasible   │    true     │
│    result    │ 63.37188548 │
│   bounded    │    true     │
│  isIntegral  │    true     │
│     Saka     │      1      │
│ Douglas Luiz │      1      │
│   Watkins    │      1      │
│    Guéhi     │      1      │
│    Salah*    │      1      │
│   Maddison   │      1      │
│ Pedro Porro  │      1      │
│     Leno     │      1      │
│     Cash     │      1      │
│    Salah     │      1      │
│   Haaland    │      1      │
│   Mitchell   │      1      │
└──────────────┴─────────────┘


team value: 102.4
in-bank: 0.3


---------------------
ENAQLO FC
Damar Ramdan
---------------------
RECOMMENDED TRANSFERS
---------------------
TRF_IN ⮂  TRF_OUT
---------------------
Mitchell ⮂  Lamptey
Douglas Luiz ⮂  Hee Chan
Guéhi ⮂  Andersen
---------------------


node index --money=102.7 --playerId=471950 --replace=3
customize this script to get the different result!


================

```