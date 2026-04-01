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
		const notm = ['terablast', 'hiddenpower']; // certain moves don't count TMs
		const gen9only = [
			'plankteenie', 'mareaniedrifter', 'toxapexglacial', 'nemesyst', 'numeldormant', 'dormedary', 'dormaderupt',
			'uraxys', 'cytoxys', 'adexys', 'guaxys', 'riboxysu', 'riboxysc', 'riboxysa', 'riboxysg',
		]; // certain Fakemon are based on Gen IX movepools specifically
		
		for (const id in this.dataCache.Pokedex) {
			if (
				!(this.dataCache.Pokedex[id] && this.dataCache.Pokedex[id].copyData) &&
				!(this.modData('FormatsData', id) && this.modData('FormatsData', id).tier && ['Evo!', '(Prevo)'].includes(this.modData('FormatsData', id).tier))
			) continue; // skip canon Pokémon that aren't in the dex - but allow Fakemon for both

			if (this.dataCache.Learnsets[id]) {
				// movepool corrections
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
			if (newMon && newMon.copyData) { // weeding out Pokémon that aren't new
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
			
			// randbats initialization
			if (
				this.modData('FormatsData', id) &&
				(this.modData('FormatsData', id).tier && this.modData('FormatsData', id).tier === "Evo!") // only fully evolved Evo guys
				|| ['porygon2', 'accelgor'].includes(id) // ... and some pre-evolutions
			) {
				
				// basic structure
				newMon.randbats = {
					types: [],
					abilities: [],
					singles: {
						requestedSupport: {},
						offeredSupport: {},
						acceptedSupport: {},
					},
					vgc: {
						requestedSupport: {},
						offeredSupport: {},
						acceptedSupport: {},
					},
					resistances: {},
				};
				
				// banlists
				if ([
					'toxapex', 'noivernvariant', 'chandelure', 'corviknight', 'darmanitan', 'darmanitangalar', 'excadrill', 'hawlucha', 'garchomp', 'velocinobi',
					'dragonite', 'tapukoko', 'tapulele', 'tapubulu', 'tapufini', 'zacian', 'zaciancrowned', 'zamazenta', 'zamazentacrowned', 'deoxys',
					'deoxysattack', 'deoxysdefense', 'deoxysspeed',
				].includes(id)) newMon.randbats.singles.banned = true;
				if ([
					'dragonite', 'tapukoko', 'tapulele', 'tapubulu', 'tapufini', 'zacian', 'zaciancrowned', 'zamazenta', 'zamazentacrowned', 'deoxys',
					'deoxysattack', 'deoxysdefense', 'deoxysspeed',
				].includes(id)) newMon.randbats.vgc.banned = true;
				if (newMon.randbats.singles.banned && newMon.randbats.vgc.banned) continue;

				// basic information
				newMon.randbats.types.push(newMon.types[0]);
				if (newMon.types[1]) newMon.randbats.types.push(newMon.types[1]);
				newMon.randbats.abilities.push(newMon.abilities[0]);
				if (newMon.abilities[1]) newMon.randbats.abilities.push(newMon.abilities[1]);
				if (newMon.abilities['H']) newMon.randbats.abilities.push(newMon.abilities['H']);
				if (newMon.abilities['S']) newMon.randbats.abilities.push(newMon.abilities['S']);

				// then I can start iterating over the movepool
				const learnset = this.dataCache.Learnsets[id].learnset;
				if (!learnset) {
					console.log(`No learnset found for ${id}!`);
					continue;
				}
				for (const moveid in learnset) {
					if (!this.modData('Learnsets', id).learnset[moveid].length) continue;
					switch (moveid) {
						case 'knockoff':
							if (
								newMon.randbats.singles.offeredSupport.knockoff &&
								newMon.randbats.singles.offeredSupport.knockoff.moves
							) newMon.randbats.singles.offeredSupport.knockoff.moves.push('Knock Off');
							else {
								newMon.randbats.singles.offeredSupport.knockoff = {
									moves: ['Knock Off'],
								}
							}
							break;
					}
				}
			}
		}
		
/*
		// OKAY HEADS-UP:
		// the below is for *my personal convenience* for randbats set generation - it should be *commented out* in any patch that actually gets loaded to DH
		// I'm keeping it around so I can run it the same way every time I add a new slate
		// don't forget to comment it out!!!
		for (const id in this.dataCache.Pokedex) {
			continue; // just skipping this whole thing for now it's not useful yet
			if (!this.dataCache.Pokedex[id] || !(
				(this.modData('FormatsData', id) && this.modData('FormatsData', id).tier && this.modData('FormatsData', id).tier === "Evo!") // only the "Evo!" tier matters - nothing is PotD yet and prevos shouldn't be included
				|| ['porygon2', 'accelgor'].includes(id) // exceptions so far: Porygon2 and Accelgor
			)) continue;
			
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


			
			monDex.randomizerInfo = randomizerInfo;
		}
*/

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
					if (target.m.movesDodged) {
						target.m.movesDodged++;
					} else target.m.movesDodged = 1;
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
	
	// modded for Revival Blessing to count in this.field.pseudoWeather.datamod.funStats
	runAction(action: Action) {
		const pokemonOriginalHP = action.pokemon?.hp;
		let residualPokemon: (readonly [Pokemon, number])[] = [];
		// returns whether or not we ended in a callback
		switch (action.choice) {
		case 'start': {
			for (const side of this.sides) {
				if (side.pokemonLeft) side.pokemonLeft = side.pokemon.length;
			}

			this.add('start');

			// Change Zacian/Zamazenta into their Crowned formes
			for (const pokemon of this.getAllPokemon()) {
				let rawSpecies: Species | null = null;
				if (pokemon.species.id === 'zacian' && pokemon.item === 'rustedsword') {
					rawSpecies = this.dex.species.get('Zacian-Crowned');
				} else if (pokemon.species.id === 'zamazenta' && pokemon.item === 'rustedshield') {
					rawSpecies = this.dex.species.get('Zamazenta-Crowned');
				}
				if (!rawSpecies) continue;
				const species = pokemon.setSpecies(rawSpecies);
				if (!species) continue;
				pokemon.baseSpecies = rawSpecies;
				pokemon.details = species.name + (pokemon.level === 100 ? '' : ', L' + pokemon.level) +
					(pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
				pokemon.setAbility(species.abilities['0'], null, true);
				pokemon.baseAbility = pokemon.ability;

				const behemothMove: {[k: string]: string} = {
					'Zacian-Crowned': 'behemothblade', 'Zamazenta-Crowned': 'behemothbash',
				};
				const ironHead = pokemon.baseMoves.indexOf('ironhead');
				if (ironHead >= 0) {
					const move = this.dex.moves.get(behemothMove[rawSpecies.name]);
					pokemon.baseMoveSlots[ironHead] = {
						move: move.name,
						id: move.id,
						pp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						maxpp: (move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5,
						target: move.target,
						disabled: false,
						disabledSource: '',
						used: false,
					};
					pokemon.moveSlots = pokemon.baseMoveSlots.slice();
				}
			}

			if (this.format.onBattleStart) this.format.onBattleStart.call(this);
			for (const rule of this.ruleTable.keys()) {
				if ('+*-!'.includes(rule.charAt(0))) continue;
				const subFormat = this.dex.formats.get(rule);
				if (subFormat.onBattleStart) subFormat.onBattleStart.call(this);
			}

			for (const side of this.sides) {
				for (let i = 0; i < side.active.length; i++) {
					if (!side.pokemonLeft) {
						// forfeited before starting
						side.active[i] = side.pokemon[i];
						side.active[i].fainted = true;
						side.active[i].hp = 0;
					} else {
						this.actions.switchIn(side.pokemon[i], i);
					}
				}
			}
			for (const pokemon of this.getAllPokemon()) {
				this.singleEvent('Start', this.dex.conditions.getByID(pokemon.species.id), pokemon.speciesState, pokemon);
			}
			this.midTurn = true;
			break;
		}

		case 'move':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.actions.runMove(action.move, action.pokemon, action.targetLoc, action.sourceEffect,
				action.zmove, undefined, action.maxMove, action.originalTarget);
			break;
		case 'megaEvo':
			this.actions.runMegaEvo(action.pokemon);
			break;
		case 'megaEvoX':
			this.actions.runMegaEvoX?.(action.pokemon);
			break;
		case 'megaEvoY':
			this.actions.runMegaEvoY?.(action.pokemon);
			break;
		case 'runDynamax':
			action.pokemon.addVolatile('dynamax');
			action.pokemon.side.dynamaxUsed = true;
			if (action.pokemon.side.allySide) action.pokemon.side.allySide.dynamaxUsed = true;
			break;
		case 'terastallize':
			this.actions.terastallize(action.pokemon);
			break;
		case 'beforeTurnMove':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.debug('before turn callback: ' + action.move.id);
			const target = this.getTarget(action.pokemon, action.move, action.targetLoc);
			if (!target) return false;
			if (!action.move.beforeTurnCallback) throw new Error(`beforeTurnMove has no beforeTurnCallback`);
			action.move.beforeTurnCallback.call(this, action.pokemon, target);
			break;
		case 'priorityChargeMove':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.debug('priority charge callback: ' + action.move.id);
			if (!action.move.priorityChargeCallback) throw new Error(`priorityChargeMove has no priorityChargeCallback`);
			action.move.priorityChargeCallback.call(this, action.pokemon);
			break;

		case 'event':
			this.runEvent(action.event!, action.pokemon);
			break;
		case 'team':
			if (action.index === 0) {
				action.pokemon.side.pokemon = [];
			}
			action.pokemon.side.pokemon.push(action.pokemon);
			action.pokemon.position = action.index;
			// we return here because the update event would crash since there are no active pokemon yet
			return;

		case 'pass':
			return;
		case 'instaswitch':
		case 'switch':
			if (action.choice === 'switch' && action.pokemon.status) {
				this.singleEvent('CheckShow', this.dex.abilities.getByID('naturalcure' as ID), null, action.pokemon);
			}
			if (this.actions.switchIn(action.target, action.pokemon.position, action.sourceEffect) === 'pursuitfaint') {
				// a pokemon fainted from Pursuit before it could switch
				if (this.gen <= 4) {
					// in gen 2-4, the switch still happens
					this.hint("Previously chosen switches continue in Gen 2-4 after a Pursuit target faints.");
					action.priority = -101;
					this.queue.unshift(action);
					break;
				} else {
					// in gen 5+, the switch is cancelled
					this.hint("A Pokemon can't switch between when it runs out of HP and when it faints");
					break;
				}
			}
			break;
		case 'revivalblessing':
			action.pokemon.side.pokemonLeft++;
			if (action.target.position < action.pokemon.side.active.length) {
				this.queue.addChoice({
					choice: 'instaswitch',
					pokemon: action.target,
					target: action.target,
				});
			}
			action.target.fainted = false;
			action.target.faintQueued = false;
			action.target.subFainted = false;
			action.target.status = '';
			action.target.hp = 1; // Needed so hp functions works
			action.target.sethp(action.target.maxhp / 2);
			this.add('-heal', action.target, action.target.getHealth, '[from] move: Revival Blessing');
			action.pokemon.side.removeSlotCondition(action.pokemon, 'revivalblessing');
			// ONLY MODDED PART
			this.runEvent('RevivalBlessingData', action.pokemon, action.target);
			// END MODDED PART
			break;
		case 'runUnnerve':
			this.singleEvent('PreStart', action.pokemon.getAbility(), action.pokemon.abilityState, action.pokemon);
			break;
		case 'runSwitch':
			this.actions.runSwitch(action.pokemon);
			break;
		case 'runPrimal':
			if (!action.pokemon.transformed) {
				this.singleEvent('Primal', action.pokemon.getItem(), action.pokemon.itemState, action.pokemon);
			}
			break;
		case 'shift':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.swapPosition(action.pokemon, 1);
			break;

		case 'beforeTurn':
			this.eachEvent('BeforeTurn');
			break;
		case 'residual':
			this.add('');
			this.clearActiveMove(true);
			this.updateSpeed();
			residualPokemon = this.getAllActive().map(pokemon => [pokemon, pokemon.getUndynamaxedHP()] as const);
			this.residualEvent('Residual');
			this.add('upkeep');
			break;
		}

		// phazing (Roar, etc)
		for (const side of this.sides) {
			for (const pokemon of side.active) {
				if (pokemon.forceSwitchFlag) {
					if (pokemon.hp) this.actions.dragIn(pokemon.side, pokemon.position);
					pokemon.forceSwitchFlag = false;
				}
			}
		}

		this.clearActiveMove();

		// fainting

		this.faintMessages();
		if (this.ended) return true;

		// switching (fainted pokemon, U-turn, Baton Pass, etc)

		if (!this.queue.peek() || (this.gen <= 3 && ['move', 'residual'].includes(this.queue.peek()!.choice))) {
			// in gen 3 or earlier, switching in fainted pokemon is done after
			// every move, rather than only at the end of the turn.
			this.checkFainted();
		} else if (['megaEvo', 'megaEvoX', 'megaEvoY'].includes(action.choice) && this.gen === 7) {
			this.eachEvent('Update');
			// In Gen 7, the action order is recalculated for a Pokémon that mega evolves.
			for (const [i, queuedAction] of this.queue.list.entries()) {
				if (queuedAction.pokemon === action.pokemon && queuedAction.choice === 'move') {
					this.queue.list.splice(i, 1);
					queuedAction.mega = 'done';
					this.queue.insertChoice(queuedAction, true);
					break;
				}
			}
			return false;
		} else if (this.queue.peek()?.choice === 'instaswitch') {
			return false;
		}

		if (this.gen >= 5) {
			this.eachEvent('Update');
			for (const [pokemon, originalHP] of residualPokemon) {
				const maxhp = pokemon.getUndynamaxedHP(pokemon.maxhp);
				if (pokemon.hp && pokemon.getUndynamaxedHP() <= maxhp / 2 && originalHP > maxhp / 2) {
					this.runEvent('EmergencyExit', pokemon);
				}
			}
		}

		if (action.choice === 'runSwitch') {
			const pokemon = action.pokemon;
			if (pokemon.hp && pokemon.hp <= pokemon.maxhp / 2 && pokemonOriginalHP! > pokemon.maxhp / 2) {
				this.runEvent('EmergencyExit', pokemon);
			}
		}

		const switches = this.sides.map(
			side => side.active.some(pokemon => pokemon && !!pokemon.switchFlag)
		);

		for (let i = 0; i < this.sides.length; i++) {
			let reviveSwitch = false; // Used to ignore the fake switch for Revival Blessing
			if (switches[i] && !this.canSwitch(this.sides[i])) {
				for (const pokemon of this.sides[i].active) {
					if (this.sides[i].slotConditions[pokemon.position]['revivalblessing']) {
						reviveSwitch = true;
						continue;
					}
					pokemon.switchFlag = false;
				}
				if (!reviveSwitch) switches[i] = false;
			} else if (switches[i]) {
				for (const pokemon of this.sides[i].active) {
					if (pokemon.hp && pokemon.switchFlag && pokemon.switchFlag !== 'revivalblessing' &&
							!pokemon.skipBeforeSwitchOutEventFlag) {
						this.runEvent('BeforeSwitchOut', pokemon);
						pokemon.skipBeforeSwitchOutEventFlag = true;
						this.faintMessages(); // Pokemon may have fainted in BeforeSwitchOut
						if (this.ended) return true;
						if (pokemon.fainted) {
							switches[i] = this.sides[i].active.some(sidePokemon => sidePokemon && !!sidePokemon.switchFlag);
						}
					}
				}
			}
		}

		for (const playerSwitch of switches) {
			if (playerSwitch) {
				this.makeRequest('switch');
				return true;
			}
		}

		if (this.gen < 5) this.eachEvent('Update');

		if (this.gen >= 8 && (this.queue.peek()?.choice === 'move' || this.queue.peek()?.choice === 'runDynamax')) {
			// In gen 8, speed is updated dynamically so update the queue's speed properties and sort it.
			this.updateSpeed();
			for (const queueAction of this.queue.list) {
				if (queueAction.pokemon) this.getActionSpeed(queueAction);
			}
			this.queue.sort();
		}

		return false;
	},
	

	
	// CUSTOM RANDOM TEAM GENERATOR
	
	getTeam(options) {
		let team = options.team;
		if (typeof team === 'string') team = Teams.unpack(team);
		if (team && team.length === 6) return team;
		
		let originalTeamSpecies = [];
		let selectedRandSpecies = [];

		if (team) {
			for (const pokemon of team) if (pokemon && pokemon.species && this.dex.species.get(pokemon.species) && this.dex.species.get(pokemon.species).id) originalTeamSpecies.push(this.dex.species.get(pokemon.species).id);
		} else team = [];
		console.log(originalTeamSpecies);
		
		let setLevel = 100;
		let format = "VGC";
		if (this.ruleTable.adjustLevel) setLevel = this.ruleTable.adjustLevel;
		if (this.activePerHalf && this.activePerHalf === 1) format = "singles";
		
		let shiny = false;
		if (!team.length && this.randomChance(1, 100)) shiny = true; // the whole team will be Shiny 1% of the time

		let targetRoles = [];
		if (format === "singles") targetRoles = ['knockoff', 'choiceband', 'hazardcontrol']; // filler test
		if (format === "vgc") targetRoles = ['knockoff', 'priority', 'spread']; // filler test

		// check for monotype
		let monotype = null;
		let types = [
			'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
			'Steel', 'Fairy', 'Normal',
		];
		let eligibleMonotypes = [];
		if (originalTeamSpecies.length) {
			for (const type in types) {
				let eligible = true;
				for (const id of originalTeamSpecies) if (this.dex.species.get(id).randbats.types.includes(type)) eligible = false;
				if (eligible) eligibleMonotypes.push(type);
			}
		}
		if (originalTeamSpecies.length > 1) {
			// if there's more than 1 Pokémon, and the team is monotype so far, stick with it
			if (eligibleMonotypes.length) monotype = this.sample(eligibleMonotypes);
		} else {
			// if there are 1 or 0 Pokémon, you can decide at random whether or not to be monotype
			if (this.randomChance(1,2)) { // should be more like (1,10) in the final draft but I'm just testing for now
				if (!eligibleMonotypes.length) eligibleMonotypes = types;
				monotype = this.sample(eligibleMonotypes);
			}
		}
		console.log(monotype);
		
		let eligiblePokemon = [];
		for (const id in this.dex.data.Pokedex) {
			if (
				this.dex.data.Pokedex[id].randbats &&
				!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) &&
				(!monotype || this.dex.data.Pokedex[id].randbats.types.includes(monotype)) &&
				!originalTeamSpecies.includes(id)
			) eligiblePokemon.push(id);
		}
		if (!eligiblePokemon.length) return;
		
		let currentStep = [];
		for (const id of eligiblePokemon) {
			for (const role of targetRoles) {
				if (!currentStep.includes(id) && this.dex.data.Pokedex[id].randbats[format].offeredSupport[role]) currentStep.push(id);
			}
		}
		if (!currentStep.length) currentStep = eligiblePokemon;
		console.log(currentStep);
		console.log(this.dex.data.Pokedex[this.sample(currentStep)].randbats);
			
			// first step: assign an up-front list of roles for the team
			
			// second step: iterate over existing team members
			// // - identify which roles they already cover
			// // - identify "requested support" (top-priority: something like Grassy Surge is mandatory if a Pokémon has a Grassy Seed)
			// // - identify "accepted support" (gives bonus points when deciding between candidates for another role, but it's not its own step - something like any terrain for Aleon)

			// step 2.5: if there are no team members at all, introduce a random Evo sub as a starting point
			
			// third step: a "for" loop until there are as many team members as empty slots - randomize and push Pokémon one at a time to "selectedRandSpecies" (not to "team!")
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
