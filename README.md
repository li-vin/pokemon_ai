# pokemon_ai
This is the code for the CS4100 Final Project.

To run the code, run `npm install` from the base directory.

To run the agent, run `npx tsx simulation.tsx` from the base directory.

When errors occur, logs with the format `#.txt` will be created in an existing `/logs` folder in this directory.

If you'd like to change which agent the program uses, simply change `p1` and `p2` on lines 48-50 in `simulation.tsx`. By default, it runs the approximate Q-learning agent against the random-AI player.

This project uses `@pkmn/sim` for the battle simulator `@smogon/calc` for damage calculation.