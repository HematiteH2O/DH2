import { Pokemon, EffectState } from '../../../sim/pokemon';
import { Teams } from '../../../sim/teams';

export const Scripts: {[k: string]: ModdedBattleScriptsData} = {
	teambuilderConfig: {
		excludeStandardTiers: true,
		// sorting the teambuilder by slate / prompt
		customTiers: ['Pokémon of the Day!', 'Evo!', '(Prevo)'],
		customDoublesTiers: ['Pokémon of the Day!', 'Evo!', '(Prevo)'],
	},

	// GENERATING FAKEMON
	
	init() {
		let customList = [];
		let dexNo = -1;
		for (const id in this.dataCache.Pokedex) {
			const notm = ['terablast', 'hiddenpower']; // certain moves don't count TMs
			const gen9only = [
				'plankteenie', 'mareaniedrifter', 'toxapexglacial', 'nemesyst', 'numeldormant', 'dormedary', 'dormaderupt',
				'uraxys', 'cytoxys', 'adexys', 'guaxys', 'riboxysu', 'riboxysc', 'riboxysa', 'riboxysg',
			]; // certain Fakemon are based on Gen IX movepools specifically

			// movepool corrections
			if (this.dataCache.Learnsets[id]) {
				for (const moveid of notm) {
					if (this.dataCache.Learnsets[id].learnset && this.dataCache.Learnsets[id].learnset[moveid]) {
						// check if it learns the move naturally
						this.modData('Learnsets', id).learnset[moveid] = this.dataCache.Learnsets[id].learnset[moveid].filter(
							(method) => (method.includes('L') || method.includes('E'))
						);
					}
				}
			}

			// Fakemon creation
			const newMon = this.dataCache.Pokedex[id];
			if (!newMon || !newMon.copyData) continue; // weeding out Pokémon that aren't new
			const copyData = this.dataCache.Pokedex[this.toID(newMon.copyData)];

			if (!newMon.types && copyData.types) newMon.types = copyData.types;
			if (!newMon.baseStats && copyData.baseStats) newMon.baseStats = copyData.baseStats;
			if (!newMon.abilities && copyData.abilities) newMon.abilities = copyData.abilities;
			// if (!newMon.num && copyData.num) newMon.num = copyData.num * -1; // inverting the original's dex number
			if (!newMon.genderRatio && copyData.genderRatio) newMon.genderRatio = copyData.genderRatio;
			if (!newMon.heightm && copyData.heightm) newMon.heightm = copyData.heightm;
			if (!newMon.weightkg && copyData.weightkg) newMon.weightkg = copyData.weightkg;
			if (!newMon.color && copyData.color) newMon.color = copyData.color;
			if (!newMon.eggGroups && copyData.eggGroups) newMon.eggGroups = copyData.eggGroups;
			
			// actually, handling dex numbers that way creates issues with species clause! let's fix that:
			if (newMon.baseSpecies) {
				newMon.num = this.dataCache.Pokedex[this.toID(newMon.baseSpecies)].num;
			} else {
				newMon.num = dexNo;
				dexNo--;
			}

			if (!newMon.evos) customList.push(id); // only fully-evolved Pokémon of the Day!

			let copyMoves = newMon.copyData;
			if (newMon.copyMoves) copyMoves = newMon.copyMoves;
			if (copyMoves) {
				if (!this.dataCache.Learnsets[id]) this.dataCache.Learnsets[id] = {learnset: {}}; // create a blank learnset entry so we don't need a learnsets file
				const learnset = this.dataCache.Learnsets[this.toID(copyMoves)].learnset;
				for (const moveid in learnset) {
					this.modData('Learnsets', id).learnset[moveid] = learnset[moveid].filter(
						(method) => !(method.includes('S') || (notm.includes(moveid) && (method.includes('M') || method.includes('T') || method.includes('V'))) || (gen9only.includes(id) && !(method.startsWith('9'))))
					);
				}
				if (newMon.movepoolAdditions) {
					for (const move of newMon.movepoolAdditions) {
						this.modData('Learnsets', this.toID(id)).learnset[this.toID(move)] = ["9M"];
					}
				}
				if (newMon.movepoolDeletions) {
					for (const move of newMon.movepoolDeletions) {
						delete this.modData('Learnsets', this.toID(id)).learnset[this.toID(move)];
					}
				}
			}
		}
		
		// OKAY HEADS-UP:
		// the below is for *my personal convenience* for randbats set generation - it should be *commented out* in any patch that actually gets loaded to DH
		// I'm keeping it around so I can run it the same way every time I add a new slate
		// don't forget to comment it out!!!
		for (const id in this.dataCache.Pokedex) {
			if (!this.dataCache.Pokedex[id] || !(
				(this.modData('FormatsData', id) && this.modData('FormatsData', id).tier && this.modData('FormatsData', id).tier === "Evo!") // only the "Evo!" tier matters - nothing is PotD yet and prevos shouldn't be included
				|| ['porygon2', 'accelgor'].includes(id) // exceptions so far: Porygon2 and Accelgor
			)) continue;
			
			// banlist
			let singlesbanned = false;
			let vgcbanned = false;
			if ([
				'toxapex', 'noivernvariant', 'chandelure', 'corviknight', 'darmanitan', 'darmanitangalar', 'excadrill', 'hawlucha', 'garchomp', 'velocinobi',
				'dragonite', 'tapukoko', 'tapulele', 'tapubulu', 'tapufini', 'zacian', 'zaciancrowned', 'zamazenta', 'zamazentacrowned', 'deoxys',
				'deoxysattack', 'deoxysdefense', 'deoxysspeed',
			].includes(id)) singlesbanned = true;
			if ([
				'dragonite', 'tapukoko', 'tapulele', 'tapubulu', 'tapufini', 'zacian', 'zaciancrowned', 'zamazenta', 'zamazentacrowned', 'deoxys',
				'deoxysattack', 'deoxysdefense', 'deoxysspeed',
			].includes(id)) vgcbanned = true;
			if (singlesbanned && vgcbanned) continue;
			
			const monDex = this.dataCache.Pokedex[id];
			const monLearnset = this.dataCache.Learnsets[id].learnset;
			// if (!poke || !poke.num || !poke.abilities || !poke.types || !poke.baseStats)
			let randomizerInfo = `<br>`;
			// icon
			if ([
				'mycecroak', 'whiscazu', 'dewgongvariant', 'carnelion', 'noivernvariant', 'voltangent', 'dusglow',
				'aleon', 'overchill', 'overchillzen', 'mantinevariant', 'parascelium', 'malamaralola', 'excadrillhisui', 'dedellite', 'coilrig',
				'velocinobi', 'stunfiskvariant',
			].includes(id)) {
				randomizerInfo += `=IMAGE("https://raw.githubusercontent.com/scoopapa/DH2/refs/heads/main/data/mods/evolutionproject/sprites/icons/` + id + `.png",3)~`;
			} else if (monDex.copyData) {
				randomizerInfo += `=IMAGE("https://raw.githubusercontent.com/scoopapa/DH2/refs/heads/main/data/mods/gen9evolutionproject/sprites/icons/` + id + `.png",3)~`;
			} else {
				randomizerInfo += `=IMAGE("https://www.smogon.com/forums//media/minisprites/` + id + `.png",3)~`;
			}
			// name and type
			randomizerInfo+= `${monDex.num}~${monDex.name}~${monDex.types[0]}~${monDex.types[1] ? monDex.types[1] : " "}~`;
			// Abilities
			let abilities = monDex.abilities[0];
			if (monDex.abilities[1]) abilities += ` / ${monDex.abilities[1]}`;
			if (monDex.abilities['H']) abilities += ` // ${monDex.abilities['H']}`;
			if (monDex.abilities['S']) abilities += ` // (${monDex.abilities['S']})`;
			randomizerInfo+= `${abilities}~`;
			// stats
			randomizerInfo+= `${monDex.baseStats.hp}~${monDex.baseStats.atk}~${monDex.baseStats.def}~${monDex.baseStats.spa}~${monDex.baseStats.spd}~${monDex.baseStats.spe}~`;


			
			// // // general goals
			
			// list custom elements
			// list STABs

			
			
			// // // singles goals
			
			// setup: sweeper
			// setup: breaker
			// wallbreaker without setup reliance (ex. Band/Specs)
			// priority
			
			// Spikes/Stealth Rock
			// hazard control
			// pivoting
			
			// Knock Off
			// "doesn't mind Knock Off"
			// contact punisher
			
			// Toxic Spikes absorber (grounded Poison-type)
			// Ground immunity
			// Electric immunity

			// other noteworthy features

/*
		- responses to specific setup sweepers and bulky attackers identified so far

		- consider Choice Scarf users
			- consider Speed tiers in the context of setup users
			- 120+ offense or 110+ BP STABs
			- cool to have pivoting/momentum, hazards, Knock, Trick
			- wide SE coverage

		- hazards and hazard control, including moves like Magic Coat
		- stallbreaking tools
		- cleric moves
		- recovery moves
*/
			
			
			// // // VGC goals

			// priority
			// Fake Out
			// anti-priority

			// spread
			// anti-spread

			// damage mitigation
			// anti-Intimidate

			// Speed control
			// anti-Speed control

			// field effects / other themes
			// other noteworthy features
			
/*
	- priority attacks (for Prankster users, include status moves that call attacks)
	- spread
	- Speed control (Tailwind, Trick Room, paralysis, Speed-lowering moves, After You)
	- field effect interactions (include hazards)
		- include payoffs and not just setup (ex. Solar Beam, Weather Ball)?
	- damage mitigation options (screens, Protect variants, Fake Out, redirection, offense-lowering moves, Mud Sport and Water Sport, sleep-inducing moves, Yawn)

	- other interesting effects (group together)
		- move-binding effects
		- fixed damage (ex. Destiny Bond, Endeavor, Counter)
		- Defense- and Sp. Def-lowering moves
		- support moves (Ally Switch, Heal Pulse, Helping Hand)
		- pivoting
		- viable boosting moves
		- other specific strategies (ex. Skill Swap, Entrainment, Soak, Rototiller, et cetera)
*/


			
			monDex.randomizerInfo = randomizerInfo;
		}
		// end commented-out section

		let random1 = Math.floor(Math.random() * customList.length);
		let random2 = Math.floor(Math.random() * (customList.length - 1));
		let random3 = Math.floor(Math.random() * (customList.length - 2));
		if (random2 >= random1) random2 += 1;
		if (random3 >= random1) random3 += 1;
		if (random3 >= random2) random3 += 1;
		this.modData('FormatsData', customList[random1]).tier = "Pokémon of the Day!";
		this.modData('FormatsData', customList[random2]).tier = "Pokémon of the Day!";
		this.modData('FormatsData', customList[random3]).tier = "Pokémon of the Day!";
	},
	
	win(side?: SideID | '' | Side | null) { // modded to cue end-of-battle messages
		if (this.ended) return false;
		if (side && typeof side === 'string') {
			side = this.getSide(side);
		} else if (!side || !this.sides.includes(side)) {
			side = null;
		}
		this.winner = side ? side.name : '';

		this.add('');
		if (side?.allySide) {
			this.add('win', side.name + ' & ' + side.allySide.name);
		} else if (side) {
			this.add('win', side.name);
		} else {
			this.add('tie');
		}
		this.ended = true;
		this.requestState = '';
		for (const s of this.sides) {
			if (s) s.activeRequest = null;
		}
		this.runEvent('BattleFinished', side); // only modded line
		return true;
	},
	
	side: {
		removeSlotCondition(target: Pokemon | number, status: string | Effect) {
			if (target instanceof Pokemon) target = target.position;
			status = this.battle.dex.conditions.get(status) as Effect;
			
			if (!this.slotConditions[target]) target = 0; // modded for Prance and Pierce
			if (!this.slotConditions[target]) return false; // modded for Prance and Pierce
			
			if (!this.slotConditions[target][status.id]) return false;
			this.battle.singleEvent('End', status, this.slotConditions[target][status.id], this.active[target]);
			delete this.slotConditions[target][status.id];
			return true;
		}
	},
	actions: {
		// modded for Prance and Pierce
		switchIn(pokemon: Pokemon, pos: number, sourceEffect: Effect | null = null, isDrag?: boolean) {
			if (!pokemon || pokemon.isActive) {
				this.battle.hint("A switch failed because the Pokémon trying to switch in is already in.");
				return false;
			}
	
			const side = pokemon.side;
			if (pos >= side.active.length) {
				throw new Error(`Invalid switch position ${pos} / ${side.active.length}`);
			}
			const oldActive = side.active[pos];
			const unfaintedActive = oldActive?.hp ? oldActive : null;
			if (unfaintedActive) {
				pokemon.side.lastSwitchedOut = oldActive;
				oldActive.beingCalledBack = true;
				let switchCopyFlag: 'copyvolatile' | 'shedtail' | boolean = false;
				if (sourceEffect && typeof (sourceEffect as Move).selfSwitch === 'string') {
					switchCopyFlag = (sourceEffect as Move).selfSwitch!;
				}
				if (!oldActive.skipBeforeSwitchOutEventFlag && !isDrag) {
					this.battle.runEvent('BeforeSwitchOut', oldActive);
					if (this.battle.gen >= 5) {
						this.battle.eachEvent('Update');
					}
				}
				oldActive.skipBeforeSwitchOutEventFlag = false;
				if (!this.battle.runEvent('SwitchOut', oldActive)) {
					// Warning: DO NOT interrupt a switch-out if you just want to trap a pokemon.
					// To trap a pokemon and prevent it from switching out, (e.g. Mean Look, Magnet Pull)
					// use the 'trapped' flag instead.
	
					// Note: Nothing in the real games can interrupt a switch-out (except Pursuit KOing,
					// which is handled elsewhere); this is just for custom formats.
					return false;
				}
				if (!oldActive.hp) {
					// a pokemon fainted from Pursuit before it could switch
					return 'pursuitfaint';
				}
	
				// will definitely switch out at this point
	
				oldActive.illusion = null;
				this.battle.singleEvent('End', oldActive.getAbility(), oldActive.abilityState, oldActive);
	
				// if a pokemon is forced out by Whirlwind/etc or Eject Button/Pack, it can't use its chosen move
				this.battle.queue.cancelAction(oldActive);
	
				let newMove = null;
				if (this.battle.gen === 4 && sourceEffect) {
					newMove = oldActive.lastMove;
				}
				if (switchCopyFlag) {
					pokemon.copyVolatileFrom(oldActive, switchCopyFlag);
				}
				if (newMove) pokemon.lastMove = newMove;
				oldActive.clearVolatile();
			}
			if (oldActive) {
				oldActive.isActive = false;
				oldActive.isStarted = false;
				oldActive.usedItemThisTurn = false;
				oldActive.statsRaisedThisTurn = false;
				oldActive.statsLoweredThisTurn = false;
				oldActive.position = pokemon.position;
				pokemon.position = pos;
				side.pokemon[pokemon.position] = pokemon;
				side.pokemon[oldActive.position] = oldActive;
			}
			pokemon.isActive = true;
			side.active[pos] = pokemon;
			pokemon.activeTurns = 0;
			pokemon.activeMoveActions = 0;
			for (const moveSlot of pokemon.moveSlots) {
				moveSlot.used = false;
			}
			this.battle.runEvent('BeforeSwitchIn', pokemon);
			if (sourceEffect) {
				this.battle.add(isDrag ? 'drag' : 'switch', pokemon, pokemon.getDetails, '[from] ' + sourceEffect);
			} else {
				this.battle.add(isDrag ? 'drag' : 'switch', pokemon, pokemon.getDetails);
			}
			pokemon.abilityOrder = this.battle.abilityOrder++;
			if (isDrag && this.battle.gen === 2) pokemon.draggedIn = this.battle.turn;
			pokemon.previouslySwitchedIn++;
	
			if ((isDrag && this.battle.gen >= 5) || (sourceEffect && sourceEffect === "Prance and Pierce")) { // this line modded for Prance and Pierce
				// runSwitch happens immediately so that Mold Breaker can make hazards bypass Clear Body and Levitate
				this.battle.singleEvent('PreStart', pokemon.getAbility(), pokemon.abilityState, pokemon);
				this.runSwitch(pokemon);
			} else {
				this.battle.queue.insertChoice({choice: 'runUnnerve', pokemon});
				this.battle.queue.insertChoice({choice: 'runSwitch', pokemon});
			}
	
			return true;
		},
		
		// modded for move miss tally (for fun)
		hitStepAccuracy(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
			const hitResults = [];
			for (const [i, target] of targets.entries()) {
				this.battle.activeTarget = target;
				// calculate true accuracy
				let accuracy = move.accuracy;
				if (move.ohko) { // bypasses accuracy modifiers
					if (!target.isSemiInvulnerable()) {
						accuracy = 30;
						if (move.ohko === 'Ice' && this.battle.gen >= 7 && !pokemon.hasType('Ice')) {
							accuracy = 20;
						}
						if (!target.volatiles['dynamax'] && pokemon.level >= target.level &&
							(move.ohko === true || !target.hasType(move.ohko))) {
							accuracy += (pokemon.level - target.level);
						} else {
							this.battle.add('-immune', target, '[ohko]');
							hitResults[i] = false;
							continue;
						}
					}
				} else {
					accuracy = this.battle.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
					if (accuracy !== true) {
						let boost = 0;
						if (!move.ignoreAccuracy) {
							const boosts = this.battle.runEvent('ModifyBoost', pokemon, null, null, {...pokemon.boosts});
							boost = this.battle.clampIntRange(boosts['accuracy'], -6, 6);
						}
						if (!move.ignoreEvasion) {
							const boosts = this.battle.runEvent('ModifyBoost', target, null, null, {...target.boosts});
							boost = this.battle.clampIntRange(boost - boosts['evasion'], -6, 6);
						}
						if (boost > 0) {
							accuracy = this.battle.trunc(accuracy * (3 + boost) / 3);
						} else if (boost < 0) {
							accuracy = this.battle.trunc(accuracy * 3 / (3 - boost));
						}
					}
				}
				if (move.alwaysHit || (move.id === 'toxic' && this.battle.gen >= 8 && pokemon.hasType('Poison')) ||
						(move.target === 'self' && move.category === 'Status' && !target.isSemiInvulnerable())) {
					accuracy = true; // bypasses ohko accuracy modifiers
				} else {
					accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
				}
				if (accuracy !== true && !this.battle.randomChance(accuracy, 100)) {
					if (move.smartTarget) {
						move.smartTarget = false;
					} else {
						if (!move.spreadHit) this.battle.attrLastMove('[miss]');
						this.battle.add('-miss', pokemon, target);
					}
					// modded section start
					if (pokemon.m.movesMissed) {
						pokemon.m.movesMissed++;
					} else pokemon.m.movesMissed = 1;
					// modded section end
					if (!move.ohko && pokemon.hasItem('blunderpolicy') && pokemon.useItem()) {
						this.battle.boost({spe: 2}, pokemon);
					}
					hitResults[i] = false;
					continue;
				}
				hitResults[i] = true;
			}
			return hitResults;
		}
	},


	
	// CUSTOM RANDOM TEAM GENERATOR
	
	getTeam(options) {
		let team = options.team;
		if (typeof team === 'string') team = Teams.unpack(team);
		if (team && team.length === 6) return team;
		
		if (!team) team = [];
		let randSets = [];
		
		let setLevel = 100;
		let format = "VGC";
		if (this.ruleTable.adjustLevel) setLevel = this.ruleTable.adjustLevel;
		if (this.activePerHalf && this.activePerHalf === 1) format = "singles";
		
		let shiny = false;
		if (!team.length && this.randomChance(1, 100)) shiny = true; // the whole team will be Shiny

		if (format === "singles") {
			// first step: assign an up-front list of roles for the team
			
			// second step: iterate over existing team members
			// // - identify which roles they already cover
			// // - identify "requested support" (top-priority: something like Grassy Surge is mandatory if a Pokémon has a Grassy Seed)
			// // - identify "accepted support" (gives bonus points when deciding between candidates for another role, but it's not its own step - something like any terrain for Aleon)

			// step 2.5: if there are no team members at all, introduce a random Evo sub as a starting point
			
			// third step: a "for" loop until there are as many team members as empty slots - randomize and push Pokémon one at a time to "randSets" (not to "team!")
			// // - each added Pokémon should log its own "roles" and "requested/accepted support" - in case it gets replaced later, it shouldn't be mixed in with the team!
			// // - each category should be a binary yes/no for whether the Pokémon can do the listed job effectively
			// // - then, score the available Pokémon based on satisfying "accepted support," other roles that haven't been filled yet, and type balance before picking a winner
			// // - #1 priority: any "requested support" that isn't covered
			// // // - score based on defensive synergy with the specific Pokémon requesting the support
			// // - #2 priority: roles that aren't present
			// // - #3 priority: answers (defensive *or* offensive) to threats that aren't covered
			// // - #4 priority: type balance
			// this only keeps going until you run out of space for team members

			// fourth step: a "for" loop over each of the already-chosen random team members; a second pass in the order they were chosen
			// // - check which roles and offered support *only* they fill (no other team members do)
			// // - check if any other Pokémon not on the team happen to fill all of those roles and offered support
			// // - if any alternates exist, score the new pool of Pokémon and pick a winner:
			// // // - #1 priority: the alternate Pokémon also provides any requested support or role that isn't present
			// // // - #2 priority: the alternate Pokémon also requests support that's already on the team
			// // // - #3 priority: if offering support, which has the best defensive synergy with the Pokémon requesting support?
			// // // - #4 priority: which has the best defensive synergy with the team as a whole?
			// // - pick randomly from the remaining pool!

			// fifth step: start filling in set details (moves, items, Abilities)
			// // - #1 pass: (teamwide, by role) checking off the already-assigned roles
			// // - #2 pass: (by individual) choosing STAB(s), which may have conditions attached, and then any leftover details (Tera Types, items, EVs, Abilities) if not established

			// sixth step: nickname check???
			// // - if all 6 sets are random, check the list of teamwide naming schemes; if there are any where all 6 Pokémon have an entry, there's a chance to pull from them!
			// // - check the list of small group naming schemes; if there are any groups that the random sets completely encompass, go for it!
			// // - otherwise, if the Pokémon has a set of random names defined in pokedex.ts, sample one of them
			// // - and if not, no nickname
			
			// finally, push every remaining set to the actual team!
		}
		
		// VGC is a placeholder for now
		// the process should be mostly the same as above, but the roles that count will obviously be different; I want to figure out one teambuilder first
		// remember: VGC also has item clause!

		if (!team || !team.length || team.length < 2) { // so it doesn't crash when it's not done aksdjfh
			let set = {
					name: 'Default Rootsnoot',
					species: 'Rootsnoot',
					item: 'Rocky Helmet',
					ability: 'Grassy Surge',
					moves: [ 'Volt Switch' ],
					nature: '',
					evs: { hp: 4, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
					happiness: 255,
					hpType: '',
					pokeball: '',
					gigantamax: false,
					dynamaxLevel: 10,
					teraType: 'Rock',
			}
			set.hasBeenRandomized = true;
			team.push(set);
			if (team.length < 2) team.push(set);
		}
		// first step: assign roles
		// second step:
		return team;
	},
};
