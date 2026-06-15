import { Pokemon, EffectState } from '../../../sim/pokemon';
import { Teams } from '../../../sim/teams';
import { Utils } from '../../../lib/utils';

export const Scripts: {[k: string]: ModdedBattleScriptsData} = {
	teambuilderConfig: {
		excludeStandardTiers: true,
		// sorting the teambuilder by slate / prompt
		customTiers: ['Pokémon of the Day!', 'Evo!', '(Prevo)'],
		customDoublesTiers: ['Pokémon of the Day!', 'Evo!', '(Prevo)'],
	},

	// GENERATING FAKEMON
	
	init() {
		console.log(`Evo start`);
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
			) continue; // skip canon Pokémon that aren't in the dex - but allow Fakemon even if they aren't, since it matters for some form changes

			const newMon = this.dataCache.Pokedex[id];
			if (this.dataCache.Learnsets[id]) {
				// movepool corrections
				if (newMon.prevo) {
					let prevoid = this.toID(newMon.prevo);
					if (this.dataCache.Learnsets[prevoid] && this.dataCache.Learnsets[prevoid].learnset) for (const moveid in this.dataCache.Learnsets[prevoid].learnset) if (!this.dataCache.Learnsets[id].learnset[moveid]) this.dataCache.Learnsets[id].learnset[moveid] = this.dataCache.Learnsets[prevoid].learnset[moveid].filter((method) => (!method.includes('S')));
					if (this.dataCache.Pokedex[prevoid].prevo) {
						let prevoid2 = this.toID(this.dataCache.Pokedex[prevoid].prevo);
						if (this.dataCache.Learnsets[prevoid2] && this.dataCache.Learnsets[prevoid2].learnset) for (const moveid in this.dataCache.Learnsets[prevoid2].learnset) if (!this.dataCache.Learnsets[id].learnset[moveid]) this.dataCache.Learnsets[id].learnset[moveid] = this.dataCache.Learnsets[prevoid2].learnset[moveid].filter((method) => (!method.includes('S')));
					}
				}
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
			if (newMon && newMon.copyData) { // weeding out Pokémon that aren't new
				const copyData = this.dataCache.Pokedex[this.toID(newMon.copyData)];
	
				if (!newMon.types && copyData.types) newMon.types = copyData.types;
				if (!newMon.baseStats && copyData.baseStats) newMon.baseStats = copyData.baseStats;
				if (!newMon.abilities && copyData.abilities) newMon.abilities = copyData.abilities;
				// if (!newMon.num && copyData.num) newMon.num = copyData.num * -1; // inverting the original's dex number
				if (!newMon.gender && copyData.gender) newMon.gender = copyData.gender;
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
		}

		let random1 = Math.floor(Math.random() * customList.length);
		let random2 = Math.floor(Math.random() * (customList.length - 1));
		let random3 = Math.floor(Math.random() * (customList.length - 2));
		if (random2 >= random1) random2 += 1;
		if (random3 >= random1) random3 += 1;
		if (random3 >= random2) random3 += 1;
		this.modData('FormatsData', customList[random1]).tier = "Pokémon of the Day!";
		this.modData('FormatsData', customList[random2]).tier = "Pokémon of the Day!";
		this.modData('FormatsData', customList[random3]).tier = "Pokémon of the Day!";
		console.log(`Evo end`);
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

		// Okay, if we're here, we're doing random battles; that means we have to do some setup, but ideally only once!
		// This used to be in init(), but that meant it was getting called for each player every battle *anyway*
		// Even though it's weird to be doing a bunch of dex initialization in getTeam(), this setup is effectively minimizing how often it gets called

		for (const id in this.dex.data.Pokedex) {
			if (!(this.dex.data.Pokedex[id].randbatsInitialized)) {
				const newMon = this.dex.data.Pokedex[id];
				
				// for safety later, the bare-minimum randbats initialization should happen for every Pokémon, in case the player brings something unexpected
				newMon.randbats = {
					name: newMon.name, // for console.logging convenience
					types: [],
					abilities: [],
					viableStabs: [],
					offeredSupport: {},
					singles: {
						requestedSupport: {},
						acceptedSupport: {},
					},
					vgc: {
						requestedSupport: {},
						acceptedSupport: {},
					},
					weaknesses: {},
					resistances: {},
					immunities: {},
				};
				newMon.randbatsInitialized = true;
	
				// the real randbats setup only needs to take place Pokémon you can bring to an Evo game
				if (
					this.dex.data.FormatsData[id] && this.dex.data.FormatsData[id].tier &&
					(this.dex.data.FormatsData[id].tier === "Evo!" || this.dex.data.FormatsData[id].tier === "(Prevo)")
				) {
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
					
					if (this.dex.data.FormatsData[id].tier === "Evo!" || ['porygon2', 'accelgor'].includes(id)) newMon.randbats.stage = 'Evo';
					else if (newMon.evos && newMon.evos.length && !newMon.prevo && !['mareanie'].includes(id)) newMon.randbats.stage = 'LC';
	
					// basic information
					newMon.randbats.types.push(newMon.types[0]);
					if (newMon.types[1]) newMon.randbats.types.push(newMon.types[1]);
					newMon.randbats.abilities.push(newMon.abilities[0]);
					if (newMon.abilities[1]) newMon.randbats.abilities.push(newMon.abilities[1]);
					if (newMon.abilities['H']) newMon.randbats.abilities.push(newMon.abilities['H']);
					if (newMon.abilities['S']) newMon.randbats.abilities.push(newMon.abilities['S']);
					if (newMon.battleOnly) {
						if (newMon.requiredAbility) {
							newMon.randbats.abilities.push(newMon.requiredAbility);
						} else {
							let baseMon = this.dex.species.get(newMon.battleOnly);
							newMon.randbats.abilities.push(baseMon.abilities[0]);
							if (baseMon.abilities[1]) newMon.randbats.abilities.push(baseMon.abilities[1]);
							if (baseMon.abilities['H']) newMon.randbats.abilities.push(baseMon.abilities['H']);
							if (baseMon.abilities['S']) newMon.randbats.abilities.push(baseMon.abilities['S']);
						}
					}
	
					// type matchups
					let weaknesses = [];
					let resistances = [];
					let immunities = [];
					let types = [
						'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
						'Steel', 'Fairy', 'Normal',
					];
					for (const type1 of newMon.randbats.types) {
						// fill in weaknesses and resistances by type first
						for (const type of types) {
							if (this.dex.data.TypeChart[type1.toLowerCase()].damageTaken[type] === 1 && !weaknesses.includes(type)) { // weakness
								weaknesses.push(type);
							} else if (this.dex.data.TypeChart[type1.toLowerCase()].damageTaken[type] === 2 && !resistances.includes(type)) { // resistance
								resistances.push(type);
							} else if (this.dex.data.TypeChart[type1.toLowerCase()].damageTaken[type] === 3 && !immunities.includes(type)) { // immunity
								immunities.push(type);
							}
						}
					}
					// then let them cancel out
					for (const type of weaknesses) {
						if (!resistances.includes(type) && !immunities.includes(type)) newMon.randbats.weaknesses[type] = "true";
					}
					for (const type of resistances) {
						if (!weaknesses.includes(type) || immunities.includes(type)) newMon.randbats.resistances[type] = "true";
						// immunities are just better resistances, so they might as well still count
					}
					for (const type of immunities) {
						newMon.randbats.immunities[type] = "true";
						newMon.randbats.resistances[type] = "true";
					}
					// finally, account for Abilities
					for (const ability of newMon.randbats.abilities) {
						
						// weaknesses
						if (['Dry Skin', 'Fluffy'].includes(ability)) {
							// *technically* Dry Skin isn't a full weakness, but I want to count it as such here
							if (!newMon.randbats.weaknesses['Fire']) {
								newMon.randbats.weaknesses['Fire'] = {Ability: [ability]};
							} else if (newMon.randbats.weaknesses['Fire'].Ability) newMon.randbats.weaknesses['Fire'].Ability.push(ability);
						}
						
						// resistances
						if (['Drizzle', 'Heatproof', 'Thick Fat', 'Water Bubble'].includes(ability)) {
							if (!newMon.randbats.resistances['Fire']) {
								newMon.randbats.resistances['Fire'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Fire'].Ability) newMon.randbats.resistances['Fire'].Ability.push(ability);
						}
						if (['Drought', 'Orichalcum Pulse', 'Storm Chaser'].includes(ability)) {
							if (!newMon.randbats.resistances['Water']) {
								newMon.randbats.resistances['Water'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Water'].Ability) newMon.randbats.resistances['Water'].Ability.push(ability);
						}
						if (['Storm Chaser'].includes(ability)) {
							if (!newMon.randbats.resistances['Electric']) {
								newMon.randbats.resistances['Electric'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Electric'].Ability) newMon.randbats.resistances['Electric'].Ability.push(ability);
							if (!newMon.randbats.resistances['Flying']) {
								newMon.randbats.resistances['Flying'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Flying'].Ability) newMon.randbats.resistances['Flying'].Ability.push(ability);
						}
						if (['Thick Fat'].includes(ability)) {
							if (!newMon.randbats.resistances['Ice']) {
								newMon.randbats.resistances['Ice'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Ice'].Ability) newMon.randbats.resistances['Ice'].Ability.push(ability);
						}
						if (['Martial Master'].includes(ability)) {
							if (!newMon.randbats.resistances['Fighting']) {
								newMon.randbats.resistances['Fighting'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Fighting'].Ability) newMon.randbats.resistances['Fighting'].Ability.push(ability);
						}
						if (['Rust Control'].includes(ability)) {
							if (!newMon.randbats.resistances['Poison']) {
								newMon.randbats.resistances['Poison'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Poison'].Ability) newMon.randbats.resistances['Poison'].Ability.push(ability);
							if (!newMon.randbats.resistances['Ground']) {
								newMon.randbats.resistances['Ground'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Ground'].Ability) newMon.randbats.resistances['Ground'].Ability.push(ability);
						}
						if (['Pollen Basket'].includes(ability)) {
							if (!newMon.randbats.resistances['Bug']) {
								newMon.randbats.resistances['Bug'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Bug'].Ability) newMon.randbats.resistances['Bug'].Ability.push(ability);
						}
						if (['High Climber'].includes(ability)) {
							if (!newMon.randbats.resistances['Rock']) {
								newMon.randbats.resistances['Rock'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Rock'].Ability) newMon.randbats.resistances['Rock'].Ability.push(ability);
						}
						if (['Purifying Salt', 'Spiritual'].includes(ability)) {
							if (!newMon.randbats.resistances['Ghost']) {
								newMon.randbats.resistances['Ghost'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Ghost'].Ability) newMon.randbats.resistances['Ghost'].Ability.push(ability);
						}
						if (['Misty Surge'].includes(ability) && !newMon.randbats.types.includes('Flying')) {
							if (!newMon.randbats.resistances['Dragon']) {
								newMon.randbats.resistances['Dragon'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Dragon'].Ability) newMon.randbats.resistances['Dragon'].Ability.push(ability);
						}
						if (['Cheap Tricks'].includes(ability)) {
							if (!newMon.randbats.resistances['Dark']) {
								newMon.randbats.resistances['Dark'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Dark'].Ability) newMon.randbats.resistances['Dark'].Ability.push(ability);
						}
						if (['Directing Traffic'].includes(ability)) {
							if (!newMon.randbats.resistances['Normal']) {
								newMon.randbats.resistances['Normal'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Normal'].Ability) newMon.randbats.resistances['Normal'].Ability.push(ability);
						}
						if (['Patch Note'].includes(ability)) {
							for (const type of types) {
								if (this.dex.data.TypeChart[type.toLowerCase()].damageTaken[newMon.types[0]] === 1) {
									if (!newMon.randbats.resistances[type]) {
										newMon.randbats.resistances[type] = {Ability: [ability]};
									} else if (newMon.randbats.resistances[type].Ability) newMon.randbats.resistances[type].Ability.push(ability);
								}
							}
						}
						
						// immunities
						if (['Flash Fire', 'Primordial Sea', 'Well-Baked Body'].includes(ability)) {
							if (!newMon.randbats.resistances['Fire']) {
								newMon.randbats.resistances['Fire'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Fire'].Ability) newMon.randbats.resistances['Fire'].Ability.push(ability);
							if (!newMon.randbats.immunities['Fire']) {
								newMon.randbats.immunities['Fire'] = {Ability: [ability]};
							} else if (newMon.randbats.immunities['Fire'].Ability) newMon.randbats.immunities['Fire'].Ability.push(ability);
						}
						if (['Desolate Land', 'Dry Skin', 'Storm Drain', 'Water Absorb'].includes(ability)) {
							if (!newMon.randbats.resistances['Water']) {
								newMon.randbats.resistances['Water'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Water'].Ability) newMon.randbats.resistances['Water'].Ability.push(ability);
							if (!newMon.randbats.immunities['Water']) {
								newMon.randbats.immunities['Water'] = {Ability: [ability]};
							} else if (newMon.randbats.immunities['Water'].Ability) newMon.randbats.immunities['Water'].Ability.push(ability);
						}
						if (['Lightning Rod', 'Motor Drive', 'Volt Absorb'].includes(ability)) {
							if (!newMon.randbats.resistances['Electric']) {
								newMon.randbats.resistances['Electric'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Electric'].Ability) newMon.randbats.resistances['Electric'].Ability.push(ability);
							if (!newMon.randbats.immunities['Electric']) {
								newMon.randbats.immunities['Electric'] = {Ability: [ability]};
							} else if (newMon.randbats.immunities['Electric'].Ability) newMon.randbats.immunities['Electric'].Ability.push(ability);
						}
						if (['Sap Sipper'].includes(ability)) {
							if (!newMon.randbats.resistances['Grass']) {
								newMon.randbats.resistances['Grass'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Grass'].Ability) newMon.randbats.resistances['Grass'].Ability.push(ability);
							if (!newMon.randbats.immunities['Grass']) {
								newMon.randbats.immunities['Grass'] = {Ability: [ability]};
							} else if (newMon.randbats.immunities['Grass'].Ability) newMon.randbats.immunities['Grass'].Ability.push(ability);
						}
						if (['Centrifuge', 'Earth Eater', 'Levitate'].includes(ability)) {
							if (!newMon.randbats.resistances['Ground']) {
								newMon.randbats.resistances['Ground'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Ground'].Ability) newMon.randbats.resistances['Ground'].Ability.push(ability);
							if (!newMon.randbats.immunities['Ground']) {
								newMon.randbats.immunities['Ground'] = {Ability: [ability]};
							} else if (newMon.randbats.immunities['Ground'].Ability) newMon.randbats.immunities['Ground'].Ability.push(ability);
						}
						if (['Divinated Protection'].includes(ability)) {
							if (!newMon.randbats.resistances['Ghost']) {
								newMon.randbats.resistances['Ghost'] = {Ability: [ability]};
							} else if (newMon.randbats.resistances['Ghost'].Ability) newMon.randbats.resistances['Ghost'].Ability.push(ability);
							if (!newMon.randbats.immunities['Ghost']) {
								newMon.randbats.immunities['Ghost'] = {Ability: [ability]};
							} else if (newMon.randbats.immunities['Ghost'].Ability) newMon.randbats.immunities['Ghost'].Ability.push(ability);
						}
						if (['Wonder Guard'].includes(ability)) { // nothing has it but just for completion
							for (const type of types) {
								if (!newMon.randbats.weaknesses[type] || newMon.randbats.resistances[type] || newMon.randbats.immunities[type]) {
									if (!newMon.randbats.resistances[type]) {
										newMon.randbats.resistances[type] = {Ability: [ability]};
									} else if (newMon.randbats.resistances[type].Ability) newMon.randbats.resistances[type].Ability.push(ability);
									if (!newMon.randbats.immunities[type]) {
										newMon.randbats.immunities[type] = {Ability: [ability]};
									} else if (newMon.randbats.immunities[type].Ability) newMon.randbats.immunities[type].Ability.push(ability);
								}
							}
						}
						
					}
					
					// ex. newMon.randbats.offeredSupport.groundimmune
					for (const immunity in newMon.randbats.immunities) {
						if (newMon.randbats.immunities[immunity].Ability && newMon.randbats.immunities[immunity].Ability.length) {
							newMon.randbats.offeredSupport[`${(immunity).toLowerCase()}immune`] = [];
							for (const ability of newMon.randbats.immunities[immunity].Ability) {
								// push fragments
								let fragment = {
									ability: ability,
									singles: {
										requestedSupport: [],
										acceptedSupport: [],
									},
									vgc: {
										requestedSupport: [],
										acceptedSupport: [],
									},
									fragmentPriority: 4,
								};
								newMon.randbats.offeredSupport[`${(immunity).toLowerCase()}immune`].push(fragment);
							}
						} else newMon.randbats.offeredSupport[`${(immunity).toLowerCase()}immune`] = newMon.randbats.immunities[immunity];
					}
	
					for (const resistance in newMon.randbats.resistances) { // if I don't end up needing this, I'll just delete it
						if (newMon.randbats.weaknesses[resistance]) continue;
						if (newMon.randbats.resistances[resistance].Ability && newMon.randbats.resistances[resistance].Ability.length) {
							newMon.randbats.offeredSupport[`${(resistance).toLowerCase()}resist`] = [];
							for (const ability of newMon.randbats.resistances[resistance].Ability) {
								// push fragments
								let fragment = {
									ability: ability,
									singles: {
										requestedSupport: [],
										acceptedSupport: [],
									},
									vgc: {
										requestedSupport: [],
										acceptedSupport: [],
									},
									fragmentPriority: 4,
								};
								newMon.randbats.offeredSupport[`${(resistance).toLowerCase()}resist`].push(fragment);
							}
						} else newMon.randbats.offeredSupport[`${(resistance).toLowerCase()}resist`] = newMon.randbats.resistances[resistance];
					}

					if (newMon.randbats.types.includes('Ice')) {
						if (!newMon.randbats.singles.acceptedSupport.snow) newMon.randbats.singles.acceptedSupport.snow = [];
						newMon.randbats.singles.acceptedSupport.snow.push('true');
						if (!newMon.randbats.vgc.acceptedSupport.snow) newMon.randbats.vgc.acceptedSupport.snow = [];
						newMon.randbats.vgc.acceptedSupport.snow.push('true');
					}
					if (newMon.randbats.types.includes('Rock')) {
						if (!newMon.randbats.singles.acceptedSupport.sand) newMon.randbats.singles.acceptedSupport.sand = [];
						newMon.randbats.singles.acceptedSupport.sand.push('true');
						if (!newMon.randbats.vgc.acceptedSupport.sand) newMon.randbats.vgc.acceptedSupport.sand = [];
						newMon.randbats.vgc.acceptedSupport.sand.push('true');
					}
					if (newMon.types[0] === 'Grass' || (newMon.types[1] && newMon.types[1] === 'Grass')) newMon.randbats.offeredSupport.powderimmune = "true"; // Tera doesn't count
	
					// then I can start iterating over the movepool!
					// but first...
					if (!newMon.randbats.stage || (newMon.randbats.singles.banned && newMon.randbats.vgc.banned)) continue;
					// ... don't bother with any more randbats data if it's not eligible to be chosen anyway!
					
					let learnset = this.dex.data.Learnsets[id].learnset;
					if (newMon.baseSpecies && newMon.baseSpecies === 'Rotom') learnset = this.dex.data.Learnsets.rotom.learnset;
					// going to handle their form-specific moves separately; this is fine for here!
					if (!learnset) continue;
	
					// we need to initialize this for certain kinds of Speed-reliant support in VGC
					let viableVgcSupport = false;
					let vgcSupportSubfragments = [];
					if (newMon.baseStats.spe > 102) { // unboosted Speed cutoff: Garchomp
						vgcSupportSubfragments.push({
							default: true,
						});
						viableVgcSupport = true;
					} else if (newMon.baseStats.spe > 72) { // +1 Speed cutoff: Aleon
						if (newMon.randbats.abilities.includes('Speed Boost')) {
							vgcSupportSubfragments.push({
								ability: 'Speed Boost',
							});
							viableVgcSupport = true;
						}
						if (newMon.randbats.abilities.includes('Noble Potential')) {
							vgcSupportSubfragments.push({
								ability: 'Noble Potential',
							});
							viableVgcSupport = true;
						}
						if (newMon.randbats.abilities.includes('Quark Drive')) {
							vgcSupportSubfragments.push({
								ability: 'Quark Drive',
								requestedSupport: ['electricterrain'],
								avoid: ['boosterenergy'],
							});
							vgcSupportSubfragments.push({
								ability: 'Quark Drive',
								item: 'Booster Energy',
								tags: ['boosterenergy'],
							});
						}
						if (newMon.randbats.abilities.includes('Protosynthesis')) {
							vgcSupportSubfragments.push({
								ability: 'Protosynthesis',
								requestedSupport: ['sun'],
								avoid: ['boosterenergy'],
							});
							vgcSupportSubfragments.push({
								ability: 'Protosynthesis',
								item: 'Booster Energy',
								tags: ['boosterenergy'],
							});
							viableVgcSupport = true;
						}
					} else if (newMon.baseStats.spe > 41) { // +2 Speed cutoff: Aleon
						if (newMon.randbats.abilities.includes('Chlorophyll')) {
							vgcSupportSubfragments.push({
								ability: 'Chlorophyll',
								requestedSupport: ['sun'],
							});
							viableVgcSupport = true;
						}
						else if (newMon.randbats.abilities.includes('Swift Swim')) {
							vgcSupportSubfragments.push({
								ability: 'Swift Swim',
								requestedSupport: ['rain'],
							});
							viableVgcSupport = true;
						}
						else if (newMon.randbats.abilities.includes('Sand Rush')) {
							vgcSupportSubfragments.push({
								ability: 'Sand Rush',
								requestedSupport: ['sand'],
							});
							viableVgcSupport = true;
						}
						else if (newMon.randbats.abilities.includes('Slush Rush')) {
							vgcSupportSubfragments.push({
								ability: 'Slush Rush',
								requestedSupport: ['snow'],
							});
							viableVgcSupport = true;
						}
						else if (newMon.randbats.abilities.includes('Unburden')) {
							vgcSupportSubfragments.push({
								ability: 'Unburden',
								item: 'Grassy Seed',
								requestedSupport: ['grassyterrain'],
							});
							vgcSupportSubfragments.push({
								ability: 'Unburden',
								item: 'Electric Seed',
								requestedSupport: ['electricterrain'],
							});
							vgcSupportSubfragments.push({
								ability: 'Unburden',
								item: 'Misty Seed',
								requestedSupport: ['mistyterrain'],
							});
							vgcSupportSubfragments.push({
								ability: 'Unburden',
								item: 'Psychic Seed',
								requestedSupport: ['psychicterrain'],
							});
							viableVgcSupport = true;
						}
					}
					if (newMon.baseStats.spe < 66 && learnset.trickroom && learnset.trickroom.length) {
						vgcSupportSubfragments.push({
							moves: ['Trick Room'],
							tags: ['minspeed'],
						});
						viableVgcSupport = true;
					}
					const pickyVgcSupport = {};
					
					for (const moveid in learnset) {
						if (!learnset[moveid].length) continue;
						// *rudimentary* LC set legality:
						if (newMon.randbats.stage === 'LC' && newMon.gender && ['M', 'N'].includes(newMon.gender) && !['golett', 'bronzor'].includes(id)) {
							// A handful of Pokémon need to worry about levels in LC
							// For Bronzor, this affects Extrasensory, Feint Attack, Heal Block and Psywave; for Golett, it affects Dynamic Punch, Hammer Arm, Magnitude and Shadow Punch...
							// ... but they learned all of those moves in Gen VII, so they get them anyway by Heart Scale! I checked and these are legal sets
							// That means that as of now, this is actually only for the four Riboxys babies
							// but I'll try to keep it future-proof just in case!
							let lcLearnset = learnset[moveid].filter(
								(method) => (!method.includes('L'))
							);
							if (!lcLearnset.length) { // if you can learn it a way other than level-up, it's already fine
								let lcLevelLearned = false;
								// parseInt(source.substr(2)) < parseInt(levelLearned)
								for (const source of learnset[moveid]) if (parseInt(source.substr(2)) < 5) lcLevelLearned = true;
								if (!lcLevelLearned) continue; // if you can only learn it by level, and only by a level after 5, continue
							}
						}
						
						let move = this.dex.data.Moves[moveid];
						let basePower = move.basePower;
	
						// some moves like Grass Knot have misleading base powers to begin with, so
						// TODO: list and override them here
						// at a glance, ctrl + F basePowerCallback is a good way to do this
						switch (moveid) {
							case 'Grass Knot':
								basePower = 60; // some of these are gonna be arbitrary :'D
								break;
							case 'Nature Power':
								basePower = 80;
								moveCategory = 'Special';
								break;
						}
						// I notice the Acrobatics fragment is gonna take some special attention, but one thing at a time
	
						let fragments = [];
						let baseFragment = {
						};
						fragments.push(baseFragment);
	
						// some moves need copies in case of multiple Abilities
						const noModifyType = [
							'hiddenpower', 'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'struggle', 'technoblast', 'terrainpulse', 'weatherball',
						];
						for (const ability of newMon.randbats.abilities) {
							let modifier = 1; // for Orichalcum Pulse and Hadron Engine later
							switch (ability) {
								case 'Adaptability':
									if (newMon.randbats.types.includes(move.type) && !['terrainpulse', 'weatherball'].includes(moveid)) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 4/3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Aerilate':
									if (move.type === 'Normal' && basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Aerilate']; // impossible to have an Aerilate-boosted Flying move and an actual Normal-type move on the same set
										let modFragment = {
											ability: ability,
											tags: ['Aerilate'],
											moveType: 'Flying',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Awakening':
									if (move.type === 'Fighting' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Calcify':
									if (move.type === 'Rock' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Canopy':
									if (move.type === 'Grass' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Desolate Land':
								case 'Drought':
								case 'Mega Sol':
								case 'Orichalcum Pulse':
									if (ability === 'Orichalcum Pulse' && move.category === 'Physical') modifier = 4/3;
									if (move.type === 'Fire' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5 * modifier,
										};
										fragments.push(modFragment);
									} else if (moveid === 'weatherball') {
										let modFragment = {
											ability: ability,
											moveType: 'Fire',
											moveBasePower: 150,
										};
										fragments.push(modFragment);
									} else if (modifier > 1) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * modifier,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Dragonize':
									if (move.type === 'Normal' && basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Dragonize'];
										let modFragment = {
											ability: ability,
											tags: ['Dragonize'],
											moveType: 'Dragon',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case `Dragon's Maw`:
									if (move.type === 'Dragon' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Drizzle':
								case 'Primordial Sea':
								case 'Storm Chaser':
									if (move.type === 'Water' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									if (['hurricane', 'thunder', 'bleakwindstorm', 'wildboltstorm', 'sandsearstorm'].includes(moveid)) {
										// today I learned Springtide Storm is not affected by rain
										let modFragment = {
											ability: ability,
											moveAccuracy: 100,
										};
										fragments.push(modFragment);
									}
									if (moveid === 'weatherball') {
										let modFragment = {
											ability: ability,
											moveType: 'Water',
											moveBasePower: 150,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Electric Surge':
								case 'Hadron Engine':
									if (ability === 'Hadron Engine' && move.category === 'Special') modifier = 4/3;
									if (!newMon.randbats.types.includes('Flying')) {
										if (move.type === 'Electric' && basePower) {
											let modFragment = {
												ability: ability,
												moveBasePower: basePower * 1.3 * modifier,
											};
											if (moveid === 'Rising Voltage') modFragment.moveBasePower *= 2;
											fragments.push(modFragment);
										} else if (moveid === 'terrainpulse') {
											let modFragment = {
												ability: ability,
												moveType: 'Electric',
												moveBasePower: 100 * 1.3 * modifier,
											};
											fragments.push(modFragment);
										} else if (moveid === 'naturepower') {
											let modFragment = {
												ability: ability,
												moveType: 'Electric',
												moveBasePower: 90 * 1.3 * modifier,
											};
											fragments.push(modFragment);
										} else if (modifier > 1) {
											let modFragment = {
												ability: ability,
												moveBasePower: basePower * modifier,
											};
											fragments.push(modFragment);
										}
									}
									break;
								case 'Flower Gift':
									if (move.category === 'Physical') {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
											singles: {
												acceptedSupport: [],
												requestedSupport: ['sun'],
											},
											vgc: {
												acceptedSupport: [],
												requestedSupport: ['sun'],
											},
										};
										fragments.push(modFragment);
									}
									break;
								case 'Frozen Focus':
									if (move.category === 'Special') {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
											singles: {
												acceptedSupport: [],
												requestedSupport: ['snow'],
											},
											vgc: {
												acceptedSupport: [],
												requestedSupport: ['snow'],
											},
										};
										fragments.push(modFragment);
									}
									break;
								case 'Gale Wings':
									if (move.type === 'Flying') {
										let modFragment = {
											ability: ability,
											movePriority: move.priority + 1,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Galvanize':
									if (move.type === 'Normal' && basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Galvanize'];
										let modFragment = {
											ability: ability,
											tags: ['Galvanize'],
											moveType: 'Electric',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Grassy Surge':
								case 'Seed Sower':
									if (!newMon.randbats.types.includes('Flying')) {
										if (move.type === 'Grass' && basePower) {
											let modFragment = {
												ability: ability,
												moveBasePower: basePower * 1.3,
											};
											if (moveid === 'Grassy Glide') modFragment.priority = 1;
											fragments.push(modFragment);
										}
										if (moveid === 'terrainpulse') {
											let modFragment = {
												ability: ability,
												moveType: 'Grass',
												moveBasePower: 130,
											};
											fragments.push(modFragment);
										}
										if (moveid === 'naturepower') {
											let modFragment = {
												ability: ability,
												moveType: 'Grass',
												moveBasePower: 90 * 1.3,
											};
											fragments.push(modFragment);
										}
									}
									break;
								case 'Huge Power':
								case 'Pure Power':
									if (move.category === 'Physical') {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Hustle':
									if (move.category === 'Physical') {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 2,
											moveAccuracy: basePower * 0.8,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Iron Fist':
									if (move.flags['punch'] && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Mega Launcher':
									if (move.flags['pulse'] && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Mega-Neural':
								case 'Psychic Surge':
									if (!newMon.randbats.types.includes('Flying')) {
										if (move.type === 'Psychic' && basePower) {
											let modFragment = {
												ability: ability,
												moveBasePower: basePower * 1.3,
											};
											if (moveid === 'Expanding Force') modFragment.moveBasePower *= 1.5;
											fragments.push(modFragment);
										}
										if (moveid === 'terrainpulse') {
											let modFragment = {
												ability: ability,
												moveType: 'Psychic',
												moveBasePower: 130,
											};
											fragments.push(modFragment);
										}
										if (moveid === 'naturepower') {
											let modFragment = {
												ability: ability,
												moveType: 'Psychic',
												moveBasePower: 90 * 1.3,
											};
											fragments.push(modFragment);
										}
									}
									break;
								case 'Merciless':
									if (move.category !== 'Status' && !move.willCrit) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
											singles: {
												acceptedSupport: [],
												requestedSupport: ['poison'],
											},
											vgc: {
												acceptedSupport: [],
												requestedSupport: ['poison'],
											},
										};
										fragments.push(modFragment);
									}
									break;
								case 'Misty Surge':
									if (!newMon.randbats.types.includes('Flying')) {
										if (moveid === 'terrainpulse') {
											let modFragment = {
												ability: ability,
												moveType: 'Fairy',
												moveBasePower: 100,
											};
											fragments.push(modFragment);
										}
										if (moveid === 'naturepower') {
											let modFragment = {
												ability: ability,
												moveType: 'Fairy',
												moveBasePower: 95,
											};
											fragments.push(modFragment);
										}
									}
									break;
								case 'Normalize':
									if (basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Normalize'];
										let modFragment = {
											ability: ability,
											tags: ['Normalize'],
											moveType: 'Normal',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Permafrost':
									if (basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Permafrost'];
										let modFragment = {
											ability: ability,
											tags: ['Permafrost'],
											moveType: 'Ice',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Pixilate':
									if (move.type === 'Normal' && basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Pixilate'];
										let modFragment = {
											ability: ability,
											tags: ['Pixilate'],
											moveType: 'Fairy',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Prankster':
									if (move.category === 'Status') {
										let modFragment = {
											ability: ability,
											movePriority: move.priority + 1,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Punk Rock':
									if (move.flags['sound'] && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Reckless':
									if (move.recoil && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Refrigerate':
									if (move.type === 'Normal' && basePower && !noModifyType.includes(moveid)) {
										baseFragment.avoid = ['Refrigerate'];
										let modFragment = {
											ability: ability,
											tags: ['Refrigerate'],
											moveType: 'Ice',
											moveBasePower: basePower * 1.2,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Rocky Payload':
									if (move.type === 'Rock' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Sand Stream':
								case 'Sand Spit':
									if (moveid === 'weatherball') {
										let modFragment = {
											ability: ability,
											moveType: 'Rock',
											moveBasePower: 100,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Sand Force':
									if (['Rock', 'Ground', 'Steel'].includes(move.type) && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.2,
											singles: {
												requestedSupport: ['sand'],
											},
											vgc: {
												requestedSupport: ['sand'],
											},
										};
										fragments.push(modFragment);
									}
									break;
								case 'Sharpness':
									if (move.flags['slicing'] && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Sheer Force': // gonna have to make an exception for this in some utility categories
									if ((move.secondaries || move.hasSheerForce) && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Snow Warning':
									if (moveid === 'weatherball') {
										let modFragment = {
											ability: ability,
											moveType: 'Ice',
											moveBasePower: 100,
										};
										fragments.push(modFragment);
									}
									if (moveid === 'blizzard') {
										let modFragment = {
											ability: ability,
											moveAccuracy: 100,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Solar Power':
									if (move.category === 'Special') {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
											singles: {
												acceptedSupport: [],
												requestedSupport: ['sun'],
											},
											vgc: {
												acceptedSupport: [],
												requestedSupport: ['sun'],
											},
										};
										fragments.push(modFragment);
									}
									break;
								case 'Steelworker':
								case 'Steely Spirit':
									if (move.type === 'Steel' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Strong Jaw':
									if (move.flags['bite'] && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Technician':
									if (basePower && basePower <= 60) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.5,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Tough Claws':
									if (move.flags['contact'] && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Transistor':
									if (move.type === 'Electric' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 1.3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Triage':
									if (move.flags['heal']) {
										let modFragment = {
											ability: ability,
											movePriority: move.priority + 3,
										};
										fragments.push(modFragment);
									}
									break;
								case 'Water Bubble':
									if (move.type === 'Water' && basePower) {
										let modFragment = {
											ability: ability,
											moveBasePower: basePower * 2,
										};
										fragments.push(modFragment);
									}
									break;
							}
						}
						
						// fill in default information
						let alternateFragments = [];
						for (const fragment of fragments) {
							if (!fragment.baseMove) fragment.baseMove = move.name;
							if (!fragment.moves) fragment.moves = [move.name];
							
							if (!fragment.singles) fragment.singles = {};
							if (!fragment.singles.requestedSupport) fragment.singles.requestedSupport = [];
							if (!fragment.singles.acceptedSupport) fragment.singles.acceptedSupport = [];
							if (!fragment.vgc) fragment.vgc = {};
							if (!fragment.vgc.requestedSupport) fragment.vgc.requestedSupport = [];
							if (!fragment.vgc.acceptedSupport) fragment.vgc.acceptedSupport = [];
							
							if (!fragment.moveType) fragment.moveType = move.type;
							if (!fragment.moveBasePower) fragment.moveBasePower = basePower;
							if (!fragment.moveCategory) fragment.moveCategory = move.category;
							if (!fragment.movePriority) fragment.movePriority = move.priority;
							if (!fragment.moveAccuracy) fragment.moveAccuracy = move.accuracy;
	
							if (!fragment.fragmentPriority) fragment.fragmentPriority = 4;
							
							// support requirements before any context
							if (moveid === 'risingvoltage' && !['Electric Surge', 'Hadron Engine'].includes(fragment.ability)) {
								fragment.moveBasePower *= 2;
								fragment.singles.requestedSupport.push('electricterrain');
								fragment.vgc.requestedSupport.push('electricterrain');
								// can still work with Ground immunity
							}
							if (moveid === 'expandingforce' && !['Mega-Neural', 'Psychic Surge'].includes(fragment.ability)) {
								fragment.moveBasePower *= 1.5;
								fragment.singles.requestedSupport.push('psychicterrain');
								fragment.vgc.requestedSupport.push('psychicterrain');
								if (!fragment.avoid) fragment.avoid = [];
								fragment.avoid.push('groundimmune');
							}
							if (moveid === 'grassyglide'  && !['Grassy Surge', 'Seed Sower'].includes(fragment.ability)) {
								fragment.movePriority += 1;
								fragment.singles.requestedSupport.push('grassyterrain');
								fragment.vgc.requestedSupport.push('grassyterrain');
								if (!fragment.avoid) fragment.avoid = [];
								fragment.avoid.push('groundimmune');
							}
							// Misty Explosion doesn't actually want Misty Terrain support
							if (['solarbeam', 'solarblade', 'growth'].includes(moveid) && !(fragment.ability && ['Desolate Land', 'Drought', 'Mega Sol', 'Orichalcum Pulse'].includes(fragment.ability))) {
								fragment.singles.requestedSupport.push('sun');
								fragment.vgc.requestedSupport.push('sun');
							}
							if (['synthesis', 'moonlight', 'morningsun'].includes(moveid) && !(fragment.ability && ['Desolate Land', 'Drought', 'Mega Sol', 'Orichalcum Pulse'].includes(fragment.ability))) {
								fragment.singles.acceptedSupport.push('sun');
								fragment.vgc.acceptedSupport.push('sun');
							}
							if (['electroshot'].includes(moveid) && !(fragment.ability && ['Drizzle', 'Primordial Sea', 'Storm Chaser'].includes(fragment.ability))) {
								fragment.singles.requestedSupport.push('rain');
								fragment.vgc.requestedSupport.push('rain');
							}
							if (['shoreup'].includes(moveid) && !(fragment.ability && ['Sand Stream'].includes(fragment.ability))) {
								fragment.singles.acceptedSupport.push('sand');
								fragment.vgc.acceptedSupport.push('sand');
							}
							if (['auroraveil'].includes(moveid) && !(fragment.ability && ['Snow Warning'].includes(fragment.ability))) {
								fragment.singles.requestedSupport.push('snow');
								fragment.vgc.requestedSupport.push('snow');
							}
							if (['shaveoff'].includes(moveid) && !(fragment.ability && ['Snow Warning'].includes(fragment.ability))) {
								fragment.singles.acceptedSupport.push('snow');
								fragment.vgc.acceptedSupport.push('snow');
							}

							// sun
							if (
								(fragment.moveType === 'Fire' || fragment.baseMove === 'Hydro Steam') &&
								!(fragment.ability && ['Desolate Land', 'Drought', 'Mega Sol', 'Orichalcum Pulse'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 1.5;
								modFragment.singles.requestedSupport.push('sun');
								modFragment.vgc.requestedSupport.push('sun');
								alternateFragments.push(modFragment);
							}
							if (
								fragment.baseMove === 'Weather Ball' && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 3;
								modFragment.moveType = 'Fire';
								modFragment.singles.requestedSupport.push('sun');
								modFragment.vgc.requestedSupport.push('sun');
								alternateFragments.push(modFragment);
							}

							// rain
							if (
								(fragment.moveType === 'Water') &&
								!(fragment.ability && ['Drizzle', 'Primordial Sea', 'Storm Chaser'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 1.5;
								modFragment.singles.requestedSupport.push('rain');
								modFragment.vgc.requestedSupport.push('rain');
								alternateFragments.push(modFragment);
							}
							if (
								fragment.baseMove === 'Weather Ball' && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 3;
								modFragment.moveType = 'Water';
								modFragment.singles.requestedSupport.push('rain');
								modFragment.vgc.requestedSupport.push('rain');
								alternateFragments.push(modFragment);
							}
							if (
								['Thunder', 'Hurricane', 'Bleakwind Storm', 'Wildbolt Storm', 'Sandsear Storm'].includes(fragment.baseMove) &&
								!(fragment.ability && ['Drizzle', 'Primordial Sea', 'Storm Chaser'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveAccuracy = 100;
								modFragment.singles.requestedSupport.push('rain');
								modFragment.vgc.requestedSupport.push('rain');
								alternateFragments.push(modFragment);
							}

							// sand
							if (
								fragment.baseMove === 'Weather Ball' && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 2;
								modFragment.moveType = 'Rock';
								modFragment.singles.requestedSupport.push('sand');
								modFragment.vgc.requestedSupport.push('sand');
								alternateFragments.push(modFragment);
							}

							// snow
							if (
								fragment.baseMove === 'Blizzard' &&
								!(fragment.ability && ['Snow Warning'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveAccuracy = 100;
								modFragment.singles.requestedSupport.push('snow');
								modFragment.vgc.requestedSupport.push('snow');
								alternateFragments.push(modFragment);
							}
							if (
								fragment.baseMove === 'Weather Ball' && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 2;
								modFragment.moveType = 'Ice';
								modFragment.singles.requestedSupport.push('snow');
								modFragment.vgc.requestedSupport.push('snow');
								alternateFragments.push(modFragment);
							}

							// Electric Terrain
							if (
								fragment.moveType === 'Electric' && !(fragment.ability && ['Electric Surge', 'Hadron Engine'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 1.3;
								modFragment.singles.requestedSupport.push('electricterrain');
								modFragment.vgc.requestedSupport.push('electricterrain');
								if (!modFragment.avoid) modFragment.avoid = [];
								modFragment.avoid.push('groundimmune');
								alternateFragments.push(modFragment);
							}
							if (
								['Terrain Pulse', 'Nature Power'].includes(fragment.baseMove) && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								if (fragment.baseMove === 'Terrain Pulse') modFragment.moveBasePower *= 2;
								if (fragment.baseMove === 'Nature Power') modFragment.moveBasePower *= (9 / 8);
								modFragment.moveBasePower *= 1.3;
								modFragment.moveType = 'Electric';
								modFragment.singles.requestedSupport.push('electricterrain');
								modFragment.vgc.requestedSupport.push('electricterrain');
								alternateFragments.push(modFragment);
							}

							// Grassy Terrain
							if (
								fragment.moveType === 'Grass' && !(fragment.ability && ['Grassy Surge', 'Seed Sower'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 1.3;
								modFragment.singles.requestedSupport.push('grassyterrain');
								modFragment.vgc.requestedSupport.push('grassyterrain');
								if (!modFragment.avoid) modFragment.avoid = [];
								modFragment.avoid.push('groundimmune');
								alternateFragments.push(modFragment);
							}
							if (
								['Terrain Pulse', 'Nature Power'].includes(fragment.baseMove) && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								if (fragment.baseMove === 'Terrain Pulse') modFragment.moveBasePower *= 2;
								if (fragment.baseMove === 'Nature Power') modFragment.moveBasePower *= (9 / 8);
								modFragment.moveBasePower *= 1.3;
								modFragment.moveType = 'Grass';
								modFragment.singles.requestedSupport.push('grassyterrain');
								modFragment.vgc.requestedSupport.push('grassyterrain');
								alternateFragments.push(modFragment);
							}
							
							// Psychic Terrain
							if (
								fragment.moveType === 'Psychic' && !(fragment.ability && ['Psychic Surge', 'Mega-Neural'].includes(fragment.ability))
							) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 1.3;
								modFragment.singles.requestedSupport.push('psychicterrain');
								modFragment.vgc.requestedSupport.push('psychicterrain');
								if (!modFragment.avoid) modFragment.avoid = [];
								modFragment.avoid.push('groundimmune');
								alternateFragments.push(modFragment);
							}
							if (
								['Terrain Pulse', 'Nature Power'].includes(fragment.baseMove) && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								if (fragment.baseMove === 'Terrain Pulse') modFragment.moveBasePower *= 2;
								if (fragment.baseMove === 'Nature Power') modFragment.moveBasePower *= (9 / 8);
								modFragment.moveBasePower *= 1.3;
								modFragment.moveType = 'Psychic';
								modFragment.singles.requestedSupport.push('psychicterrain');
								modFragment.vgc.requestedSupport.push('psychicterrain');
								alternateFragments.push(modFragment);
							}

							// Misty Terrain
							if (
								['Terrain Pulse', 'Nature Power'].includes(fragment.baseMove) && fragment.moveType === 'Normal'
							) {
								let modFragment = Utils.deepClone(fragment);
								if (fragment.baseMove === 'Terrain Pulse') modFragment.moveBasePower *= 2;
								if (fragment.baseMove === 'Nature Power') modFragment.moveBasePower *= (95 / 80);
								modFragment.moveType = 'Fairy';
								modFragment.singles.requestedSupport.push('mistyterrain');
								modFragment.vgc.requestedSupport.push('mistyterrain');
								alternateFragments.push(modFragment);
							}

							// Gravity
							if (!move.ohko && fragment.moveAccuracy <= 75 && moveid !== 'Blizzard') {
								let modFragment = Utils.deepClone(fragment);
								modFragment.format = 'vgc';
								modFragment.moveAccuracy *= 5/3;
								modFragment.vgc.requestedSupport.push('gravity');
								alternateFragments.push(modFragment);
							}
							/*
							// in theory, Gravity helps with Ground moves, but in practice, ... uhhhh these make way too many teams ask for Gravity sjkdfhg
							if (fragment.moveType === 'Ground' && fragment.moveBasePower && fragment.baseMove !== 'Thousand Arrows') {
								fragment.singles.acceptedSupport.push('gravity');
								fragment.vgc.acceptedSupport.push('gravity');
							}
							*/

							// poison
							if (
								['Venoshock', 'Barb Barrage', 'Hex', 'Infernal Parade'].includes(fragment.baseMove) &&
								!(fragment.ability && fragment.ability === 'Technician')
							) {
								let modFragment = Utils.deepClone(fragment);
								if (fragment.tags && (fragment.tags.includes('poison') || (['Hex', 'Infernal Parade'].includes(fragment.baseMove) && fragment.tags.includes('status')))) {
									modFragment.singles.acceptedSupport.push('poison');
									modFragment.vgc.acceptedSupport.push('poison');
								} else {
									modFragment.moveBasePower *= 2;
									modFragment.singles.requestedSupport.push('poison');
									modFragment.vgc.requestedSupport.push('poison');
								}
								alternateFragments.push(modFragment);
							}
							
							if (newMon.randbats.types.includes(fragment.moveType) && fragment.moveBasePower) fragment.stab = true;
							// I usually think in terms of regular base powers,
							// so it's more intuitive for me to divide for lack of STAB than to multiply for STAB:
							if (!fragment.stab) fragment.moveBasePower /= 1.5;
							
							// interested in accounting for base stats (as modifiers to base power) before continuing
							// let's say the following steps' base powers are standardized around ~100 base Attack/SpA with 252 EVs
							// so if the actual stat is more or less than that, the base power should be scaled accoridngly
							if (newMon.randbats.stage && newMon.randbats.stage === 'LC') {
								// okay let's say more like base 85 here aksjdfh
								if (fragment.moveCategory === 'Physical') fragment.moveBasePower *= ((Math.floor((newMon.baseStats.atk*2+94)/20)+5)/18);
								if (fragment.moveCategory === 'Special') fragment.moveBasePower *= ((Math.floor((newMon.baseStats.spa*2+94)/20)+5)/18);
							} else {
								if (fragment.moveCategory === 'Physical') fragment.moveBasePower *= ((newMon.baseStats.atk*2+99)/299);
								if (fragment.moveCategory === 'Special') fragment.moveBasePower *= ((newMon.baseStats.spa*2+99)/299);
							}
						}
						if (alternateFragments) for (const fragment of alternateFragments) {
							
							if (newMon.randbats.types.includes(fragment.moveType) && fragment.moveBasePower) fragment.stab = true;
							// I usually think in terms of regular base powers,
							// so it's more intuitive for me to divide for lack of STAB than to multiply for STAB:
							if (!fragment.stab) fragment.moveBasePower /= 1.5;
							
							// interested in accounting for base stats (as modifiers to base power) before continuing
							// let's say the following steps' base powers are standardized around ~100 base Attack/SpA with 252 EVs
							// so if the actual stat is more or less than that, the base power should be scaled accoridngly
							if (newMon.randbats.stage && newMon.randbats.stage === 'LC') {
								// okay let's say more like base 85 here aksjdfh
								if (fragment.moveCategory === 'Physical') fragment.moveBasePower *= ((Math.floor((newMon.baseStats.atk*2+94)/20)+5)/18);
								if (fragment.moveCategory === 'Special') fragment.moveBasePower *= ((Math.floor((newMon.baseStats.spa*2+94)/20)+5)/18);
							} else {
								if (fragment.moveCategory === 'Physical') fragment.moveBasePower *= ((newMon.baseStats.atk*2+99)/299);
								if (fragment.moveCategory === 'Special') fragment.moveBasePower *= ((newMon.baseStats.spa*2+99)/299);
							}
							
							fragments.push(fragment);
							
							if (fragment.stab && newMon.randbats.abilities.includes('Adaptability') && !fragment.ability) {
								let modFragment = Utils.deepClone(fragment);
								modFragment.moveBasePower *= 4/3;
								modFragment.ability = 'Adaptability';
								fragments.push(modFragment);
							}
						}
	
						for (const fragment of fragments) {
	
						// general / STAB
							// okay, the STAB categories are obviously way unfinished - I'm gonna come back to this
							const unsafeStabs = [
								// This list isn't any kind of penalty!
								// Any move with over 95% accuracy*, provided it is also *not* on this list, will be considered "drawback-free" for later purposes
								// That means anything that could be considered to have a drawback at all should be here!
	
								// some moves with less than 100% accuracy should still be included, in case modifiers make it relevant
								// (for instance, Compound Eyes doesn't make Head Smash drawback-free, but it does for Stone Edge)
	
								// some moves, like Electro Shot and Solar Blade, are only considered valid at all if they have the appropriate support -
								// so they *should* be considered drawback-free if they make it to a point where it matters!
								
								// (*some things are over 95 but less than 100 because of modifiers like Compound Eyes or Wide Lens, but I'm choosing for those to count as drawback-free!)
								
								'flareblitz', 'ragingfury', 'vcreate', 'armorcannon', 'burnup', 'overheat', 'eruption', 'shelltrap',
								'wavecrash', 'waterspout',
								'wildcharge', 'supercellslam', 'doubleshock', 'volttackle', 'thunderclap',
								'woodhammer', 'petaldance', 'leafstorm',
								'icehammer',
								'reversal', 'vitalthrow', 'hammerarm', 'jumpkick', 'axekick', 'closecombat', 'superpower', 'highjumpkick', 'focuspunch',
								'headlongrush',
								'skydrop', 'beakblast', 'bravebird', 'dragonascent',
								'psychoboost',
								'firstimpression',
								'headsmash',
								'phantomforce', 'poltergeist', 'shadowforce',
								'scaleshot', 'dragontail', 'glaiverush', 'outrage', 'clangingscales', 'dracometeor', 'dragonenergy',
								'suckerpunch', 'jawlock', 'foulplay', 'hyperspacefury',
								'hardpress', 'spinout', 'steelroller', 'gigatonhammer', 'makeitrain',
								'fleurcannon',
								'crushgrip', 'flail', 'naturalgift', 'fakeout', 'takedown', 'doubleedge', 'headcharge', 'thrash', 'wringout',
								
								'renewingring', 'entanglement', 'slimecannon',
							];
							const rejectStabs = [
								// moves that generally shouldn't be treated as a *main* attacking or coverage move at all, regardless of BP
								// plenty of these can come up later as "personal" picks, though!
								'inferno', 'blastburn', 'mindblown',
								'dive', 'hydrocannon',
								'zapcannon',
								'chloroblast', 'frenzyplant',
								'sheercold',
								'counter', 'seismictoss', 'upperhand', 'dynamicpunch', 'meteorassault', 'finalgambit',
								'belch',
								'magnitude', 'fissure', 'dig',
								'skyattack', // intentionally leaving Bounce and Fly in because they are a main STAB in some cases
								'mirrorcoat', 'psywave', 'dreameater', 'futuresight', 'synchronoise', 'prismaticlaser',
								'rockwrecker',
								'roaroftime', 'eternabeam',
								'beatup', 'comeuppance', 'ruination', 'fling',
								'metalburst', 'doomdesire', 'steelbeam',
								'naturesmadness', 'mistyexplosion',
								'bide', 'endeavor', 'guillotine', 'horndrill', 'present', 'superfang', 'falseswipe', 'holdback', 'skullbash', 'lastresort', 'gigaimpact', 'selfdestruct', 'explosion', 'sonicboom', 'spitup', 'trumpcard', 'snore', 'razorwind', 'hyperbeam',
							];
							if (
								!rejectStabs.includes(moveid) ||
								(['dynamicpunch', 'inferno', 'zapcannon'].includes(moveid) && fragment.accuracy && fragment.accuracy === 100) ||
								(['mindblown', 'chloroblast', 'steelbeam'].includes(moveid) && fragment.ability && fragment.ability === 'Magic Guard')
							) {
								// this allows for non-STAB moves if they're as strong as a STAB anyway, but I set the bar a little higher for now
								// this will sometimes be the case for moves like Shiftry's Double-Edge or Repehk's Weather Ball!
								// later on, I should be ready to check for how many unique types of "STABs" are covered;
								// if there are at least 2 types in viableStabs, then the set should try to have viableStabs of any 2 types
								
								let modFragment = Utils.deepClone(fragment);
								if (
									(!modFragment.moveAccuracy || modFragment.moveAccuracy > 95) &&
									(!unsafeStabs.includes(moveid) ||
									 (['flareblitz', 'wavecrash', 'wildcharge', 'volttackle', 'woodhammer', 'headsmash', 'takedown', 'doubleedge', 'headcharge'].includes(moveid) && fragment.ability && ['Rock Head', 'Magic Guard'].includes(fragment.ability)) ||
									 (['mindblown', 'chloroblast', 'supercellslam', 'jumpkick', 'highjumpkick', 'steelbeam'].includes(moveid) && fragment.ability && ['Magic Guard'].includes(fragment.ability)) ||
									 (['vcreate', 'armorcannon', 'overheat', 'leafstorm', 'icehammer', 'hammerarm', 'axekick', 'closecombat', 'superpower', 'headlongrush', 'dragonascent', 'psychoboost', 'clangingscales', 'dracometeor', 'hyperspacefury', 'spinout', 'makeitrain', 'fleurcannon'].includes(moveid) && fragment.ability && ['Contrary'].includes(fragment.ability))
									)
								) {
									modFragment.singles.safeStab = true;
									if (move.target !== 'allAdjacent') modFragment.vgc.safeStab = true;
									modFragment.weight = 2;
								}
								if (!fragment.stab && !fragment.teraType) modFragment.teraType = fragment.moveType;
								if (!modFragment.tags) modFragment.tags = [];
								if (!move.overrideOffensiveStat && !modFragment.tags.includes(`${(move.category).toLowerCase()}`)) modFragment.tags.push(`${(move.category).toLowerCase()}`);
								if (fragment.moveAccuracy < 80 || move.multiaccuracy) {
									modFragment.tags.push('inaccurate');
									if (!modFragment.buddy) modFragment.buddy = {};
									if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
									modFragment.buddy.roles.push('accuracyboost');
								}
								if (fragment.moveAccuracy <= 75) modFragment.score = -1; // this gets bypassed if something like Hone Claws or Coil is rolled
								if (
									(fragment.stab && fragment.moveBasePower >= 80) ||
									(fragment.moveType !== 'Normal' && fragment.moveBasePower >= 90) ||
									fragment.moveBasePower >= 120
								) {
									newMon.randbats.viableStabs.push(modFragment);
									// stop giving random things Double-Edge!! I know it has good BP :sob:
									// (the >= 120 preserves *really* strong cases like non-STAB Punk Rock Boomburst, but otherwise, it has to at least be a coverage type if it's not STAB)
								}
								if (fragment.moveBasePower >= 120 && !fragment.item) {
									let modFragment2 = Utils.deepClone(modFragment);
									// this will be a good threshold for choice item sets... I think
									if (!newMon.randbats.offeredSupport.choicebreaker) newMon.randbats.offeredSupport.choicebreaker = [];
									modFragment2.item = (fragment.moveCategory === 'Physical' ? 'Choice Band' : 'Choice Specs');
									if (!modFragment2.avoid) modFragment2.avoid = [];
									modFragment2.avoid.push('speedsetup');
									newMon.randbats.offeredSupport.choicebreaker.push(modFragment2);
								}
							}
							
						// VGC:
							// Fake Out
							if (fragment.moves.includes('Fake Out') || fragment.moves.includes('Mat Block')) {
								if (!newMon.randbats.offeredSupport.fakeout) newMon.randbats.offeredSupport.fakeout = [];
								newMon.randbats.offeredSupport.fakeout.push(fragment);
							}
							// priority
							if (fragment.movePriority > 0 && !['upperhand', 'feint'].includes(moveid)) {
								// those two are cool and all, but they do *not* count as being a team's priority user jsdfngh
								if (fragment.moveBasePower > 40 || ['assist', 'copycat', 'mefirst', 'metronome', 'mirrormove', 'naturepower'].includes(moveid)) {
									if (!newMon.randbats.offeredSupport.priority) newMon.randbats.offeredSupport.priority = [];
									// this was initially a sample to test the score feature, but I think it's a good idea to keep it this way:
									// if you have multiple candidates for priority users, the strongest one is picked first
									let modFragment = Utils.deepClone(fragment);
									if (['firstimpression', 'fakeout'].includes(moveid)) {
										if (!modFragment.avoid) modFragment.avoid = [];
										modFragment.avoid.push('physicalsetup');
										modFragment.avoid.push('speedsetup');
									}
									modFragment.score = fragment.moveBasePower;
									
									if (!modFragment.tags) modFragment.tags = [];
									if (!move.overrideOffensiveStat && !modFragment.tags.includes(`${(move.category).toLowerCase()}`)) modFragment.tags.push(`${(move.category).toLowerCase()}`);
									if (fragment.moveAccuracy < 80 || move.multiaccuracy) {
										modFragment.tags.push('inaccurate');
										if (!modFragment.buddy) modFragment.buddy = {};
										if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
										modFragment.buddy.roles.push('accuracyboost');
									}

									if ((move.category === 'Physical' && !move.overrideDefensiveStat) || (move.overrideDefensiveStat && move.overrideDefensiveStat === 'def')) {
										if (!modFragment.vgc) modFragment.vgc = {};
										if (!modFragment.vgc.acceptedSupport) modFragment.vgc.acceptedSupport = [];
										if (!modFragment.vgc.acceptedSupport.includes('defensereduction')) modFragment.vgc.acceptedSupport.push('defensereduction');
									}
									if ((move.category === 'Special' && !move.overrideDefensiveStat) || (move.overrideDefensiveStat && move.overrideDefensiveStat === 'spd')) {
										if (!modFragment.vgc) modFragment.vgc = {};
										if (!modFragment.vgc.acceptedSupport) modFragment.vgc.acceptedSupport = [];
										if (!modFragment.vgc.acceptedSupport.includes('spdefreduction')) modFragment.vgc.acceptedSupport.push('spdefreduction');
									}

									// we don't want several of the same type on the same set
									modFragment.tags.push(`${(modFragment.moveType).toLowerCase()}priority`);
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push(`${(modFragment.moveType).toLowerCase()}priority`);
									
									newMon.randbats.offeredSupport.priority.push(modFragment);
								} else if (fragment.moveBasePower && (fragment.moveBasePower *1.5 > 40) && !fragment.stab && !fragment.teraType && fragment.moveType !== 'Normal') {
									// push to "personal" for some last-pick set filler
									if (!newMon.randbats.offeredSupport.personal) newMon.randbats.offeredSupport.personal = [];
									let modFragment = Utils.deepClone(fragment);
									if (['firstimpression', 'fakeout'].includes(moveid)) {
										if (!modFragment.avoid) modFragment.avoid = [];
										modFragment.avoid.push('physicalsetup');
										modFragment.avoid.push('speedsetup');
									}
									if (!modFragment.tags) modFragment.tags = [];
									if (!move.overrideOffensiveStat && !modFragment.tags.includes(`${(move.category).toLowerCase()}`)) modFragment.tags.push(`${(move.category).toLowerCase()}`);
									if (fragment.moveAccuracy < 80 || move.multiaccuracy) {
										modFragment.tags.push('inaccurate');
										if (!modFragment.buddy) modFragment.buddy = {};
										if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
										modFragment.buddy.roles.push('accuracyboost');
									}

									if ((move.category === 'Physical' && !move.overrideDefensiveStat) || (move.overrideDefensiveStat && move.overrideDefensiveStat === 'def')) {
										if (!modFragment.vgc) modFragment.vgc = {};
										if (!modFragment.vgc.acceptedSupport) modFragment.vgc.acceptedSupport = [];
										if (!modFragment.vgc.acceptedSupport.includes('defensereduction')) modFragment.vgc.acceptedSupport.push('defensereduction');
									}
									if ((move.category === 'Special' && !move.overrideDefensiveStat) || (move.overrideDefensiveStat && move.overrideDefensiveStat === 'spd')) {
										if (!modFragment.vgc) modFragment.vgc = {};
										if (!modFragment.vgc.acceptedSupport) modFragment.vgc.acceptedSupport = [];
										if (!modFragment.vgc.acceptedSupport.includes('spdefreduction')) modFragment.vgc.acceptedSupport.push('spdefreduction');
									}
									modFragment.teraType = fragment.moveType;

									// we don't want several of the same type on the same set
									modFragment.tags.push(`${(modFragment.moveType).toLowerCase()}priority`);
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push(`${(modFragment.moveType).toLowerCase()}priority`);
									
									newMon.randbats.offeredSupport.personal.push(modFragment);
								}
							}
							// spread
							if ((move.target === 'allAdjacentFoes' || moveid === 'expandingforce') && fragment.moveBasePower > 80 && fragment.moveAccuracy >= 90 && moveid !== 'razorwind') {
								if (!newMon.randbats.offeredSupport.spread) newMon.randbats.offeredSupport.spread = [];
								let modFragment = Utils.deepClone(fragment);
								modFragment.score = fragment.moveBasePower;
									
								if (!modFragment.tags) modFragment.tags = [];
								if (!move.overrideOffensiveStat && !modFragment.tags.includes(`${(move.category).toLowerCase()}`)) modFragment.tags.push(`${(move.category).toLowerCase()}`);
								if (fragment.moveAccuracy < 80 || move.multiaccuracy) {
									modFragment.tags.push('inaccurate');
									if (!modFragment.buddy) modFragment.buddy = {};
									if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
									modFragment.buddy.roles.push('accuracyboost');
								}

								if ((move.category === 'Physical' && !move.overrideDefensiveStat) || (move.overrideDefensiveStat && move.overrideDefensiveStat === 'def')) {
									if (!modFragment.vgc) modFragment.vgc = {};
									if (!modFragment.vgc.acceptedSupport) modFragment.vgc.acceptedSupport = [];
									if (!modFragment.vgc.acceptedSupport.includes('defensereduction')) modFragment.vgc.acceptedSupport.push('defensereduction');
								}
								if ((move.category === 'Special' && !move.overrideDefensiveStat) || (move.overrideDefensiveStat && move.overrideDefensiveStat === 'spd')) {
									if (!modFragment.vgc) modFragment.vgc = {};
									if (!modFragment.vgc.acceptedSupport) modFragment.vgc.acceptedSupport = [];
									if (!modFragment.vgc.acceptedSupport.includes('spdefreduction')) modFragment.vgc.acceptedSupport.push('spdefreduction');
								}

								// we don't want several of the same type on the same set
								modFragment.tags.push(`${(modFragment.moveType).toLowerCase()}spread`);
								if (!modFragment.avoid) modFragment.avoid = [];
								modFragment.avoid.push(`${(modFragment.moveType).toLowerCase()}spread`);
								
								newMon.randbats.offeredSupport.spread.push(modFragment);
							}
							if (move.target === 'allAdjacent' && !move.selfdestruct && moveid !== 'synchronoise') {
								let modFragment = Utils.deepClone(fragment);
								modFragment.score = fragment.moveBasePower;
								
								// seems like we're getting a *lot* of options for these on almost every team, so let's limit ourselves to one of these per Pokémon!
								if (!modFragment.tags) modFragment.tags = [];
								if (!modFragment.tags.includes('allyspread')) modFragment.tags.push('allyspread');
								if (!modFragment.avoid) modFragment.avoid = [];
								if (!modFragment.avoid.includes('allyspread')) modFragment.avoid.push('allyspread');
								// in testing so far, some sets have been getting *too* excited about ally immunities and filling up with several spread moves like this,
								// which is bad, because ally synergies are given the highest priority -
								// if we let them take every possible option for these, they run out of room for important things quickly!

								// we don't want several of the same type on the same set
								modFragment.tags.push(`${(modFragment.moveType).toLowerCase()}spread`);
								modFragment.avoid.push(`${(modFragment.moveType).toLowerCase()}spread`);
								
								// ones that we can use as a main spread should be strong!
								if (fragment.moveBasePower > 80 && fragment.moveAccuracy >= 90) {
									if (!modFragment.tags) modFragment.tags = [];
									if (!move.overrideOffensiveStat && !modFragment.tags.includes(`${(move.category).toLowerCase()}`)) modFragment.tags.push(`${(move.category).toLowerCase()}`);
									if (fragment.moveAccuracy < 80 || move.multiaccuracy) {
										modFragment.tags.push('inaccurate');
										if (!modFragment.buddy) modFragment.buddy = {};
										if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
										modFragment.buddy.roles.push('accuracyboost');
									}

									modFragment.vgc.requestedSupport.push(`${(fragment.moveType).toLowerCase()}immune`); // ex. "electricimmune"
									if (!newMon.randbats.offeredSupport.spread) newMon.randbats.offeredSupport.spread = [];
									newMon.randbats.offeredSupport.spread.push(modFragment);
								}
								
								// but we can drop the BP requirement if it's just to enable ally Abilities, like Lightning Rod
								// these supports will be called, for example, "sideelectric" or "sideelectricnopara"
								if (moveid === 'discharge') { // mostly for Cell Battery
									if (!newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}nopara`]) newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}nopara`] = [];
									newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}nopara`].push(modFragment);
								} else {
									if (!newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}`]) newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}`] = [];
									newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}`].push(modFragment);
								}
							}
							if ([
								'tailwind', 'stickyweb', 'silktrap',
								'cottonspore', 'stringshot', 'scaryface', 'venomdrench',
								'electroweb', 'icywind', 'glaciate', // Bulldoze will receive special handling elsewhere because it doesn't work for every team
								'thunderwave', 'nuzzle', 'glare', 'stunspore',
								'syrupbomb', 'tarshot', 'quash',
							].includes(moveid) ||
								 ([
									 'lowsweep', 'mudshot', 'drumbeating', 'pounce',
								 ].includes(moveid) && fragment.moveBasePower > 80)
							) {
								let modFragment = Utils.deepClone(fragment);
								if (!modFragment.avoid) modFragment.avoid = [];
								modFragment.avoid.push('speedcontrol');
								
								// if (['cottonspore', 'stringshot', 'scaryface'].includes(moveid)) {
								// actually, I want to be more charitable here - Cotton Spore and String Shot are really good moves and shouldn't be rejected like this
								if (['scaryface'].includes(moveid)) {
									if (!modFragment.tags) modFragment.tags = [];
									modFragment.tags.push('statusdebuffmove');
									modFragment.avoid.push('statusdebuffmove');
								}
								if (moveid === 'venomdrench') modFragment.vgc.requestedSupport.push('poison');
								
								if (modFragment.movePriority > 0) {
										if (!newMon.randbats.offeredSupport.speedcontrol) newMon.randbats.offeredSupport.speedcontrol = [];
										newMon.randbats.offeredSupport.speedcontrol.push(modFragment);
								} else {
									if (!pickyVgcSupport.speedcontrol) pickyVgcSupport.speedcontrol = [];
									pickyVgcSupport.speedcontrol.push(modFragment);
								}
							}
							if (moveid === 'trickroom') {
								let modFragment = Utils.deepClone(fragment);
								if (!modFragment.tags) modFragment.tags = [];
								modFragment.tags.push('backuptrickroom');
								modFragment.tags.push('minspeed');
								modFragment.singles.requestedSupport.push('backuptrickroom');
								modFragment.vgc.acceptedSupport.push('backuptrickroom');
								
								if (!newMon.randbats.offeredSupport.trickroom) newMon.randbats.offeredSupport.trickroom = [];
								newMon.randbats.offeredSupport.trickroom.push(modFragment);
							}
							if (moveid === 'gravity') {
								// I think this is getting overused,
								// so I might want it to request some kind of support that limits its scope to more specific abusers
								if (!pickyVgcSupport.gravity) pickyVgcSupport.gravity = [];
								pickyVgcSupport.gravity.push(fragment);
							}
							if (['poisongas', 'mortalspin', 'toxicspikes'].includes(moveid)) {
								let modFragment = Utils.deepClone(fragment);
								if (moveid === 'poisongas') modFragment.format = 'vgc';
								if (moveid === 'toxicspikes') modFragment.format = 'singles';

								if (modFragment.movePriority > 0 || moveid === 'mortalspin') {
									if (!newMon.randbats.offeredSupport.poison) newMon.randbats.offeredSupport.poison = [];
									newMon.randbats.offeredSupport.poison.push(modFragment);
								} else {
									if (!pickyVgcSupport.poison) pickyVgcSupport.poison = [];
									pickyVgcSupport.poison.push(modFragment);
								}
							}
							if (moveid === 'round') {
								if (fragment.moveBasePower >= 80) {
									let modFragment = Utils.deepClone(fragment);
									modFragment.format = 'vgc';
									modFragment.vgc.requestedSupport.push('round');
									if (!newMon.randbats.offeredSupport.round) newMon.randbats.offeredSupport.round = [];
									newMon.randbats.offeredSupport.round.push(modFragment);
								}
								if (fragment.moveBasePower >= 70) {
									let modFragment = Utils.deepClone(fragment);
									modFragment.format = 'vgc';
									if (!pickyVgcSupport.round) pickyVgcSupport.round = [];
									pickyVgcSupport.round.push(modFragment);
								}
							}
	
							// some moves cover both physicalreduction and specialreduction at once
							if (
								(['auroraveil',
								'followme', 'ragepowder',
								'shadowbox', 'partingshot',
								'nobleroar', 'venomdrench',
								'grasswhistle', 'hypnosis', 'lovelykiss', 'sing', 'sleeppowder', 'spore', 'yawn'
							].includes(moveid) && !(fragment.moveAccuracy && fragment.moveAccuracy < 70)) ||
								(['nobleroar', 'tearfullook'].includes(moveid) && fragment.movePriority > 0)
							) {
								let modFragment = Utils.deepClone(fragment);
								if (['nobleroar'].includes(moveid)) {
									if (!modFragment.tags) modFragment.tags = [];
									modFragment.tags.push('statusdebuffmove');
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push('statusdebuffmove');
								}
								if (moveid === 'venomdrench') modFragment.vgc.requestedSupport.push('poison');
								if (modFragment.movePriority > 0) {
									if (!newMon.randbats.offeredSupport.physicalreduction) newMon.randbats.offeredSupport.physicalreduction = [];
									newMon.randbats.offeredSupport.physicalreduction.push(modFragment);
									if (!newMon.randbats.offeredSupport.specialreduction) newMon.randbats.offeredSupport.specialreduction = [];
									newMon.randbats.offeredSupport.specialreduction.push(modFragment);
								} else {
									if (!pickyVgcSupport.physicalreduction) pickyVgcSupport.physicalreduction = [];
									pickyVgcSupport.physicalreduction.push(modFragment);
									if (!pickyVgcSupport.specialreduction) pickyVgcSupport.specialreduction = [];
									pickyVgcSupport.specialreduction.push(modFragment);
								}
							}
							// others are specialized, so you need one of each
							if (
								['kingsshield', 'breakingswipe', 'strengthsap'].includes(moveid) ||
								(['baddybad', 'bittermalice', 'chillingwater', 'lunge', 'tropkick'].includes(moveid) && fragment.moveBasePower > 80) ||
								(['reflect', 'growl', 'charm', 'tickle', 'featherdance'].includes(moveid) && fragment.movePriority > 0)
							) {
								let modFragment = Utils.deepClone(fragment);
								if (['growl', 'charm', 'tickle', 'featherdance'].includes(moveid)) {
									if (!modFragment.tags) modFragment.tags = [];
									modFragment.tags.push('statusdebuffmove');
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push('statusdebuffmove');
								}
								if (modFragment.movePriority > 0) {
									if (!newMon.randbats.offeredSupport.physicalreduction) newMon.randbats.offeredSupport.physicalreduction = [];
									newMon.randbats.offeredSupport.physicalreduction.push(modFragment);
								} else {
									if (!pickyVgcSupport.physicalreduction) pickyVgcSupport.physicalreduction = [];
									pickyVgcSupport.physicalreduction.push(modFragment);
								}
							}
							if (
								['snarl', 'strugglebug'].includes(moveid) ||
								(['glitzyglow', 'mysticalfire'].includes(moveid) && fragment.moveBasePower > 80) ||
								(['lightscreen', 'eerieumpulse'].includes(moveid) && fragment.movePriority > 0)
							) {
								let modFragment = Utils.deepClone(fragment);
								if (['eerieimpulse'].includes(moveid)) {
									if (!modFragment.tags) modFragment.tags = [];
									modFragment.tags.push('statusdebuffmove');
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push('statusdebuffmove');
								}
								if (modFragment.movePriority > 0) {
									if (!newMon.randbats.offeredSupport.specialreduction) newMon.randbats.offeredSupport.specialreduction = [];
									newMon.randbats.offeredSupport.specialreduction.push(modFragment);
								} else {
									if (!pickyVgcSupport.specialreduction) pickyVgcSupport.specialreduction = [];
									pickyVgcSupport.specialreduction.push(modFragment);
								}
							}
							
							// somewhat rudimentary handling of protection for VGC
							if ((move.stallingMove && moveid !== 'endure') || ['fakeout', 'substitute', 'quickguard', 'wideguard'].includes(moveid)) {
								let modFragment = Utils.deepClone(fragment);
								
								modFragment.format = 'vgc'; // forcibly skip these fragments for singles!
								
								if (!modFragment.avoid) modFragment.avoid = [];
								modFragment.avoid.push('protection');
								modFragment.avoid.push('redirection');
								
								if (['fakeout'].includes(moveid)) modFragment.score = 4;
								else if (!['substitute', 'protect', 'detect'].includes(moveid)) modFragment.score = 3;
								else if (moveid === 'detect') modFragment.score = 2;
								else if (moveid === 'protect') modFragment.score = 1;
								else if (moveid === 'substitute') {
									modFragment.score = 0; // never use unless its buddy role is checked off
									if (!modFragment.buddy) modFragment.buddy = {};
									if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
									if (newMon.randbats.types.includes('Ghost')) {
										modFragment.buddy.roles.push('setup');
									} else {
										modFragment.buddy.roles.push('physicalsetup'); // it makes sense in my head okay
									}
								}
								// I don't really want these to replace Protect 100% of the time, but it's nice to have a random chance of them for now:
								else if (['quickguard', 'wideguard'].includes(moveid)) {
									modFragment.bypassScore = true;
									modFragment.unique = true;
								}
								else modFragment.score = 5; // the unique protection clones are the best
								
								if (!newMon.randbats.offeredSupport.protection) newMon.randbats.offeredSupport.protection = [];
								newMon.randbats.offeredSupport.protection.push(modFragment);
							}
	
							// now we're getting into stuff that not every team will request by default, so I'll also have to establish what teams request them, or just setting them up does nothing!
							// redirection
							if (['allyswitch', 'followme', 'ragepowder'].includes(moveid)) {
								if (!newMon.randbats.offeredSupport.redirection) newMon.randbats.offeredSupport.redirection = [];
								newMon.randbats.offeredSupport.redirection.push(fragment);
							}
							// move disruption
							if (['taunt', 'torment', 'encore', 'disable', 'skydrop', 'psychicnoise', 'upperhand', 'imprison'].includes(moveid)) {
								// TODO: these *are not* all interchangeable and should be divided further
								if (!newMon.randbats.offeredSupport.disruption) newMon.randbats.offeredSupport.disruption = [];
								newMon.randbats.offeredSupport.disruption.push(fragment);
							}
							// anti-Trick Room
							if ([
								'taunt', 'encore', 'imprison',
								'spore', 'sleeppowder',
								// 'trickroom', // okay, running Trick Room solely as anti-Trick Room feels weird when it happens
								'roar', 'whirlwind', 'dragontail', 'circlethrow',
							].includes(moveid)) {
								let modFragment = Utils.deepClone(fragment);
								let role = 'antitrickroom';
								if (moveid === 'imprison') {
									if (learnset.trickroom && learnset.trickroom.length) modFragment.moves.push('Trick Room');
									else if (learnset.protect && learnset.protect.length) {
										modFragment.moves.push('Protect');
										role = 'antiprotect';
									} else role = null;
								}
								if (role) {
									if (!newMon.randbats.offeredSupport[role]) newMon.randbats.offeredSupport[role] = [];
									newMon.randbats.offeredSupport[role].push(modFragment);
								}
							}
							// fixed damage
							if ([
								'destinybond', 'counter', 'mirrorcoat', 'metalburst', 'comeuppance', 'endeavor',
								'superfang', 'naturesmadness', 'ruination'
							].includes(moveid)) {
								// TODO: these *are not* all interchangeable and should be divided further
								if (!newMon.randbats.offeredSupport.fixeddamage) newMon.randbats.offeredSupport.fixeddamage = [];
								newMon.randbats.offeredSupport.fixeddamage.push(fragment);
							}
							// damage support
							// physical
							if (
								[
									'howl', 'coaching', 'decorate', 'helpinghand',
									'leer', 'screech', 'obstruct', 'octolock', 'spicyextract', 'tickle',
									'firelash', 'gravapple', 'thunderouskick'
								].includes(moveid) ||
								(['crushclaw', 'razorshell', 'triplearrows'].includes(moveid) && ((!fragment.ability && newMon.randbats.abilities.includes('Serene Grace')) || (fragment.ability && fragment.ability === 'Serene Grace')))
							) {
								let modFragment = Utils.deepClone(fragment);
								if (['leer', 'screech', 'octolock', 'spicyextract', 'tickle'].includes(moveid)) {
									if (!modFragment.tags) modFragment.tags = [];
									modFragment.tags.push('statusdebuffmove');
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push('statusdebuffmove');
								}
								if ((['crushclaw', 'razorshell', 'triplearrows'].includes(moveid) && !fragment.ability && newMon.randbats.abilities.includes('Serene Grace'))) modFragment.ability = 'Serene Grace';
								
								// to be viable, many of these need priority, naturally high Speed, or an Ability that boosts Speed
								// I have set up a way to generalize that, since it comes up for a lot of other kinds of support
								if (modFragment.movePriority > 0 || modFragment.baseMove === 'Octolock') {
										if (!newMon.randbats.offeredSupport.defensereduction) newMon.randbats.offeredSupport.defensereduction = [];
										newMon.randbats.offeredSupport.defensereduction.push(modFragment);
								} else {
									if (!pickyVgcSupport.defensereduction) pickyVgcSupport.defensereduction = [];
									pickyVgcSupport.defensereduction.push(modFragment);
								}
							}
							// special
							if (
								[
									'decorate', 'helpinghand',
									'faketears', 'metalsound', 'octolock',
									'acidspray', 'appleacid', 'luminacrash'
								].includes(moveid) ||
								(['lusterpurge', 'seedflare'].includes(moveid) && ((!fragment.ability && newMon.randbats.abilities.includes('Serene Grace')) || (fragment.ability && fragment.ability === 'Serene Grace')))
							) {
								let modFragment = Utils.deepClone(fragment);
								if (['faketears', 'metalsound', 'octolock'].includes(moveid)) {
									if (!modFragment.tags) modFragment.tags = [];
									modFragment.tags.push('statusdebuffmove');
									if (!modFragment.avoid) modFragment.avoid = [];
									modFragment.avoid.push('statusdebuffmove');
								}
								if ((['lusterpurge', 'seedflare'].includes(moveid) && !fragment.ability && newMon.randbats.abilities.includes('Serene Grace'))) modFragment.ability = 'Serene Grace';
								
								// to be viable, many of these need priority, naturally high Speed, or an Ability that boosts Speed
								// I have set up a way to generalize that, since it comes up for a lot of other kinds of support
								if (modFragment.movePriority > 0 || modFragment.baseMove === 'Octolock') {
									if (!newMon.randbats.offeredSupport.spdefreduction) newMon.randbats.offeredSupport.spdefreduction = [];
									newMon.randbats.offeredSupport.spdefreduction.push(modFragment);
								} else {
									if (!pickyVgcSupport.spdefreduction) pickyVgcSupport.spdefreduction = [];
									pickyVgcSupport.spdefreduction.push(modFragment);
								}
							}
							// side healing
							if (
								[
									'healpulse', 'floralhealing', 'pollenpuff',
									'lifedew', 'junglehealing', 'lunarblessing',
									'revivalblessing',
								].includes(moveid)
							) {
								if (!newMon.randbats.offeredSupport.sidehealing) newMon.randbats.offeredSupport.sidehealing = [];
								newMon.randbats.offeredSupport.sidehealing.push(fragment);
							}
							// momentum
							if (
								[
									'uturn', 'voltswitch', 'flipturn',
									'batonpass', 'teleport', 'chillyreception', 'partingshot',
								].includes(moveid)
							) {
								let modFragment = Utils.deepClone(fragment);
								if (moveid === 'batonpass') modFragment.format = 'vgc'; // banned in singles
								if (!newMon.randbats.offeredSupport.pivoting) newMon.randbats.offeredSupport.pivoting = [];
								newMon.randbats.offeredSupport.pivoting.push(modFragment);
								// TODO: also counts as "personal" with tag "momentum" and probably some buddy fragments
							}
							// backup field effect setting
							if (
								[
									'sunnyday', 'raindance', 'sandstorm', 'hail', 'snowscape', 'chillyreception',
									'electricterrain', 'psychicterrain', 'grassyterrain', 'mistyterrain',
								].includes(moveid)
							) {
								let accept = [];
								let fieldeffect = moveid;
								
								switch (moveid) {
									// offeredSupport
									case 'sunnyday':
										fieldeffect = 'sun';
										break;
									case 'raindance':
										fieldeffect = 'rain';
										break;
									case 'sandstorm':
										fieldeffect = 'sand';
										break;
									case 'hail':
									case 'snowscape':
									case 'chillyreception':
										fieldeffect = 'snow';
										break;
								}

								// usually, you want the backup setter to provide some other support as well - especially something that would make it a good lead
								// and there are some other characteristics that can depend on the field effect itself!
								// so...
								if (learnset.tailwind && learnset.tailwind.length) {
									let tailwindFragment = Utils.deepClone(fragment);
									tailwindFragment.moves.push('Tailwind');
									if (!tailwindFragment.tags) tailwindFragment.tags = [];
									tailwindFragment.tags.push('speedcontrol');
									tailwindFragment.format = 'vgc';
									accept.push(tailwindFragment);
								}
								if (learnset.fakeout && learnset.fakeout.length) {
									let fakeOutFragment = Utils.deepClone(fragment);
									fakeOutFragment.moves.push('Fake Out');
									if (!fakeOutFragment.tags) fakeOutFragment.tags = [];
									fakeOutFragment.tags.push('fakeout');
									fakeOutFragment.format = 'vgc';
									accept.push(fakeOutFragment);
								}
								// these ones shouldn't usually have backup setters just because they can
								if (['sandstorm', 'snow', 'grassyterrain', 'mistyterrain'].includes(fieldeffect)) accept = null;
								// in theory, I can expand on this list with more specific criteria for each field effect!
								// but I don't know what I would do with most of them just yet

								if (accept && accept.length) {
									for (const modFragment of accept) {
										if (modFragment.movePriority > 0) {
											if (!newMon.randbats.offeredSupport[`backup${fieldeffect}`]) newMon.randbats.offeredSupport[`backup${fieldeffect}`] = [];
											newMon.randbats.offeredSupport[`backup${fieldeffect}`].push(modFragment);
										} else {
											if (!pickyVgcSupport[`backup${fieldeffect}`]) pickyVgcSupport[`backup${fieldeffect}`] = [];
											pickyVgcSupport[`backup${fieldeffect}`].push(modFragment);
										}
									}
								}
							}
							
							// setup
							// Speed-boosting setup
							if (
								[
									'clangoroussoul', 'shellsmash', 'filletaway', 'noretreat', // mixed setup
									'dragondance', 'shiftgear', 'tidyup', 'victorydance', // physical setup
									'quiverdance', 'geomancy', // special setup
	
									'rapidspin', // "mixed" Speed-boosting attacks
									'flamecharge', 'aquastep', 'scaleshot', 'trailblaze', // physical Speed-boosting attacks
									'esperwing', // special Speed-boosting attacks
								].includes(moveid)
							) {
								let modFragment = Utils.deepClone(fragment);
	
								if (!modFragment.tags) modFragment.tags = [];
								modFragment.tags.push('speedsetup');
								if (['dragondance', 'shiftgear', 'tidyup', 'victorydance'].includes(moveid)) modFragment.tags.push('physicalsetup');
								if (['quiverdance', 'geomancy'].includes(moveid)) modFragment.tags.push('specialsetup');
								
								if (!modFragment.avoid) modFragment.avoid = [];
								if ([
									'dragondance', 'shiftgear', 'victorydance',
									'flamecharge', 'aquastep', 'scaleshot', 'trailblaze',
								].includes(moveid)) modFragment.avoid.push('special');
								if ([
									'quiverdance', 'geomancy',
									'esperwing',
								].includes(moveid)) modFragment.avoid.push('physical');
								modFragment.avoid.push('speedsetup'); // redundant to have more than one of these on the same set
								
								if (!modFragment.buddy) modFragment.buddy = {};
								if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
								if ([
									'dragondance', 'shiftgear', 'victorydance',
									'flamecharge', 'aquastep', 'scaleshot', 'trailblaze',
								].includes(moveid)) modFragment.buddy.roles.push('physical');
								if ([
									'quiverdance', 'geomancy',
									'esperwing',
								].includes(moveid)) modFragment.buddy.roles.push('special');
								if (['flamecharge', 'aquastep', 'scaleshot', 'trailblaze'].includes(moveid)) modFragment.buddy.roles.push('physicalsetup');
								if (['esperwing'].includes(moveid)) modFragment.buddy.roles.push('specialsetup');
	
								modFragment.score = 3; // the ones that count as offensive setup should outcompete other setup moves
								
								if (!newMon.randbats.offeredSupport.personal) newMon.randbats.offeredSupport.personal = [];
								newMon.randbats.offeredSupport.personal.push(modFragment);
							}
							// offensive setup
							if (
								[
									'growth', 'workup',
									'bellydrum', 'bulkup', 'coil', 'curse', 'honeclaws', 'howl', 'poweruppunch', 'swordsdance',
									'calmmind', 'chargebeam', 'electroshot', 'fierydance', 'meteorbeam', 'mysticalpower', 'nastyplot', 'tailglow', 'takeheart', 'torchsong',
								].includes(moveid)
							) {
								let modFragment = Utils.deepClone(fragment);
	
								if (!modFragment.tags) modFragment.tags = [];
								if (!modFragment.avoid) modFragment.avoid = [];
								if (!modFragment.buddy) modFragment.buddy = {};
								if (!modFragment.buddy.roles) modFragment.buddy.roles = [];
	
								// hard-coding notes:
								// Belly Drum should require Sitrus and might want to require a priority move even in singles (?)
								// Curse doesn't count for Ghost-types but probably has more specific requirements in general
								// Hone Claws requires Triple Axel or a similar inaccurate move
								// Work Up should only be for sets that are already mixed
	
								// some moves have individual exceptions
								if (moveid === 'workup') {
									modFragment.tags.push('physicalsetup');
									modFragment.tags.push('specialsetup');
									modFragment.avoid.push('physicalsetup');
									modFragment.avoid.push('specialsetup');
									modFragment.buddy.roles.push('physical');
									modFragment.buddy.roles.push('special');
								}
								if (moveid === 'bellydrum') {
									if (!modFragment.item) modFragment.item = 'Sitrus Berry';
								}
								if (moveid === 'growth') {
									// already requested sun support earlier
									modFragment.tags.push('physicalsetup');
									modFragment.tags.push('specialsetup');
									modFragment.avoid.push('physicalsetup');
									modFragment.avoid.push('specialsetup');
								}
								if (moveid === 'honeclaws') {
									modFragment.buddy.roles.push('inaccurate');
									modFragment.tags.push('accuracyboost');
									modFragment.avoid.push('accuracyboost');
								}
								if (moveid === 'coil') {
									modFragment.tags.push('accuracyboost');
									modFragment.avoid.push('accuracyboost');
								}
								if (
									[
										'poweruppunch', 'chargebeam',
										'honeclaws', 'workup',
									].includes(moveid)
								) { // you usually don't really want these if there are other options - unless they're a buddy move for some other reason
									modFragment.score = -3;
								} else {
									// you also don't want these getting picked early, though; it's better if they usually only come up as a buddy move
									modFragment.score = -1;
								}
	
								// physical setup
								if (
									[
										'bellydrum', 'bulkup', 'coil', 'curse', 'honeclaws', 'howl', 'poweruppunch', 'swordsdance',
									].includes(moveid)
								) {
									modFragment.tags.push('physicalsetup');
									
									modFragment.avoid.push('special');
									modFragment.avoid.push('physicalsetup');
									modFragment.avoid.push('specialsetup');
									
									modFragment.buddy.roles.push('physical');
								}
	
								// special setup
								if (
									[
										'calmmind', 'chargebeam', 'electroshot', 'fierydance', 'meteorbeam', 'mysticalpower', 'nastyplot', 'tailglow', 'takeheart', 'torchsong',
									].includes(moveid)
								) {
									modFragment.tags.push('specialsetup');
									
									modFragment.avoid.push('physical');
									modFragment.avoid.push('physicalsetup');
									if (moveid !== 'fierydance') modFragment.avoid.push('specialsetup');
									
									modFragment.buddy.roles.push('special');
								}
	
								let modFragmentPrioVGC = Utils.deepClone(modFragment);
								modFragmentPrioVGC.format = 'vgc';
								modFragmentPrioVGC.buddy.roles.push('priority');
								let modFragmentSpreadVGC = Utils.deepClone(modFragment);
								modFragmentSpreadVGC.format = 'vgc';
								modFragmentSpreadVGC.buddy.roles.push('spread');
								modFragment.format = 'singles';
								
								if (!newMon.randbats.offeredSupport.personal) newMon.randbats.offeredSupport.personal = [];
								if (moveid === 'howl') {
									// you don't really need priority or spread to be a good Howl user in VGC, and we don't want to push it to singles at all
									modFragment.format = 'vgc';
									newMon.randbats.offeredSupport.personal.push(modFragment);
								} else if (moveid === 'bellydrum') {
									modFragment.buddy.roles.push('priority');
									newMon.randbats.offeredSupport.personal.push(modFragment);
									newMon.randbats.offeredSupport.personal.push(modFragmentPrioVGC);
								} else if (moveid === 'curse') {
									if (!newMon.randbats.types.includes('Ghost')) { // completely ignore the setup version of Curse if you're Ghost-type
										// normally, singles Pokémon will avoid Curse if they have Bulk Up as an option
										if (!learnset.bulkup) newMon.randbats.offeredSupport.personal.push(modFragment);
										// but if you have something else tagged "minspeed" anyway, go for it!
										let modFragmentCurseSlow = Utils.deepClone(modFragment);
										modFragmentCurseSlow.buddy.roles.push('minspeed');
										newMon.randbats.offeredSupport.personal.push(modFragmentCurseSlow);
										// this is to get it paired with things like Gyro Ball
	
										// for VGC, it's not necessarily worse than Bulk Up, so I won't make that check
										// but there are plenty situations when sets will be labeled minspeed, so it's still good to do that part:
										modFragmentPrioVGC.buddy.roles.push('minspeed');
										modFragmentSpreadVGC.buddy.roles.push('minspeed');
										newMon.randbats.offeredSupport.personal.push(modFragmentPrioVGC);
										newMon.randbats.offeredSupport.personal.push(modFragmentSpreadVGC);
									}
								} else {
									newMon.randbats.offeredSupport.personal.push(modFragment);
									newMon.randbats.offeredSupport.personal.push(modFragmentPrioVGC);
									newMon.randbats.offeredSupport.personal.push(modFragmentSpreadVGC);
								}
							}
						
						// singles-only:
							// Knock Off
							if (fragment.moves.includes('Knock Off')) {
								if (!newMon.randbats.offeredSupport.knockoff) newMon.randbats.offeredSupport.knockoff = [];
								newMon.randbats.offeredSupport.knockoff.push(fragment);
							}
							// damaging entry hazards - Sticky Web and Toxic Spikes will probably be handled differently
							if (['ceaselessedge', 'spikes', 'stealthrock', 'stoneaxe'].includes(moveid)) {
								if (!newMon.randbats.offeredSupport.entryhazard) newMon.randbats.offeredSupport.entryhazard = [];
								newMon.randbats.offeredSupport.entryhazard.push(fragment);
							}
							// hazard control
							if (['defog', 'mortalspin', 'rapidspin', 'tidyup'].includes(moveid)) {
								if (!newMon.randbats.offeredSupport.hazardcontrol) newMon.randbats.offeredSupport.hazardcontrol = [];
								newMon.randbats.offeredSupport.hazardcontrol.push(fragment);
							}
						}
							
							// Upper Hand and team-supported Grassy Glide need their own cases and were *not* included in priority
							// Venom Drench is also neat
					}

					// okay, now the VGC support that was picky about Speed can get sorted properly into offeredSupport
					for (const offeredSupport in pickyVgcSupport) {
						for (const fragment of pickyVgcSupport[offeredSupport]) {
							let supportFragments = [];
							for (const subfragment of vgcSupportSubfragments) {
								let modFragment = Utils.deepClone(fragment);
								let accept = true;
								if (subfragment.ability) {
									if (modFragment.ability && modFragment.ability !== subfragment.ability) accept = false;
									modFragment.ability = subfragment.ability;
								}
								if (subfragment.item) {
									if (modFragment.item && modFragment.item !== subfragment.item) accept = false;
									modFragment.item = subfragment.item;
								}
								if (subfragment.teraType) {
									if (modFragment.teraType && modFragment.teraType !== subfragment.teraType) accept = false;
									modFragment.teraType = subfragment.teraType;
								}
								if (subfragment.tags) {
									if (!modFragment.tags) modFragment.tags = [];
									for (const tag of subfragment.tags) if (!modFragment.tags.includes(tag)) modFragment.tags.push(tag);
									if (modFragment.avoid) {
										for (const avoid of modFragment.avoid) if (modFragment.tags.includes(avoid)) accept = false;
									}
								}
								if (subfragment.moves) {
									if (!modFragment.moves) modFragment.moves = [];
									for (const move of subfragment.moves) if (!modFragment.moves.includes(move)) modFragment.moves.push(move);
									if (modFragment.moves.length > 4) accept = false;
								}
								if (subfragment.requestedSupport) {
									if (!modFragment.vgc.requestedSupport) modFragment.vgc.requestedSupport = [];
									for (const requestedSupport of subfragment.requestedSupport) {
										if (offeredSupport === requestedSupport) accept = false;
										if (offeredSupport === `backup${requestedSupport}`) accept = false;
										// I don't want, for example, the fastest Swift Swim user on the team to be pressured to run Rain Dance simply to support its own Drizzle user
										// backup rain setters should be things like Pranskter users, not rain abusers!
										if (!modFragment.vgc.requestedSupport.includes(requestedSupport)) modFragment.vgc.requestedSupport.push(requestedSupport);
									}
								}
								if (subfragment.evs) {
									if (!modFragment.evs) modFragment.evs = subfragment.evs;
									if (subfragment.evs.hp > modFragment.evs.hp) modFragment.evs.hp = subfragment.evs.hp;
									if (subfragment.evs.atk > modFragment.evs.atk) modFragment.evs.atk = subfragment.evs.atk;
									if (subfragment.evs.def > modFragment.evs.def) modFragment.evs.def = subfragment.evs.def;
									if (subfragment.evs.spa > modFragment.evs.spa) modFragment.evs.spa = subfragment.evs.spa;
									if (subfragment.evs.spd > modFragment.evs.spd) modFragment.evs.spd = subfragment.evs.spd;
									if (subfragment.evs.spe > modFragment.evs.spe) modFragment.evs.spe = subfragment.evs.spe;
									if (modFragment.evs.hp + modFragment.evs.atk + modFragment.evs.def + modFragment.evs.spa + modFragment.evs.spd + modFragment.evs.spe > 508) accept = false;
								}
								if (accept) supportFragments.push(modFragment);
							}
							if (supportFragments.length) {
								if (!newMon.randbats.offeredSupport[offeredSupport]) newMon.randbats.offeredSupport[offeredSupport] = [];
								for (const supportFragment of supportFragments) newMon.randbats.offeredSupport[offeredSupport].push(supportFragment);
							}
						}
					}
	
					// okay I'm gonna have to figure out exactly how an individual fragment's support requests count
					
					// I think after I get through the whole movepool, and there's an *entire category* of offeredSupport where *every* fragment is requesting support,
					// the Pokémon loses that offeredSupport category, and every fragment gets pushed into acceptedSupport instead
					// (a common example might be Grass-types where Grassy Glide is the only priority they're offering)
					
					// but if we have an offeredSupport category where some options are always available while others have requestedSupport,
					// then the category continues to exist,
					// and all of the fragments requesting support additionally get pushed to the acceptedSupport for the species to make it more likely to come up
					// but - obviously - if the support just never comes up during species selection, there are still contingencies in the category
	
					// from there, the individual fragments' requestedSupports only need to be checked again during set construction, after the whole team is done
					// and obviously ones with support available are favored, but ones with requestedSupport missing are completely ignored
					
					for (const fragment of newMon.randbats.viableStabs) {
						let modFragment = Utils.deepClone(fragment);
						modFragment.mainstab = true;
						
						if (fragment.singles.requestedSupport.length) {
							for (const request of fragment.singles.requestedSupport) {
								if (!newMon.randbats.singles.acceptedSupport[request]) newMon.randbats.singles.acceptedSupport[request] = [];
								newMon.randbats.singles.acceptedSupport[request].push(modFragment);
							}
						}
						if (fragment.vgc.requestedSupport.length) {
							for (const request of fragment.vgc.requestedSupport) {
								if (!newMon.randbats.vgc.acceptedSupport[request]) newMon.randbats.vgc.acceptedSupport[request] = [];
								newMon.randbats.vgc.acceptedSupport[request].push(modFragment);
							}
						}
					}
					
					for (const offeredSupport in newMon.randbats.offeredSupport) {
						let accepted = false;
						for (const fragment of newMon.randbats.offeredSupport[offeredSupport]) {
							if (fragment.baseMove) { // if it was just an Ability, this is unnecessary
								if (fragment.singles.requestedSupport.length) {
									for (const request of fragment.singles.requestedSupport) {
										if (!newMon.randbats.singles.acceptedSupport[request]) newMon.randbats.singles.acceptedSupport[request] = [];
										newMon.randbats.singles.acceptedSupport[request].push(fragment);
									}
								}
								if (fragment.vgc.requestedSupport.length) {
									for (const request of fragment.vgc.requestedSupport) {
										if (!newMon.randbats.vgc.acceptedSupport[request]) newMon.randbats.vgc.acceptedSupport[request] = [];
										newMon.randbats.vgc.acceptedSupport[request].push(fragment);
									}
								}
								if (!fragment.singles.requestedSupport.length && !fragment.vgc.requestedSupport.length) accepted = true;
							} else accepted = true;
						}
						if (!accepted) delete newMon.randbats.offeredSupport[offeredSupport];
					}
					
					// finally, some Abilities offer innate utility which has nothing to do with how they affect moves or type matchups, so let's cover those quickly
					for (const ability of newMon.randbats.abilities) {
						let fragment = {
							ability: ability,
							singles: {
								requestedSupport: [],
								acceptedSupport: [],
							},
							vgc: {
								requestedSupport: [],
								acceptedSupport: [],
							},
							fragmentPriority: 4,
						};
						switch (ability) {
							// offeredSupport
							case 'Drizzle':
								fragment.singles.acceptedSupport.push('rain');
								fragment.singles.acceptedSupport.push('backuprain');
								fragment.vgc.acceptedSupport.push('rain');
								fragment.vgc.acceptedSupport.push('backuprain');
								
								if (!newMon.randbats.offeredSupport.rain) newMon.randbats.offeredSupport.rain = [];
								newMon.randbats.offeredSupport.rain.push(fragment);
								break;
							case 'Drought':
							case 'Orichalcum Pulse':
								fragment.singles.acceptedSupport.push('sun');
								fragment.singles.acceptedSupport.push('backupsun');
								fragment.vgc.acceptedSupport.push('sun');
								fragment.vgc.acceptedSupport.push('backupsun');
								
								if (!newMon.randbats.offeredSupport.sun) newMon.randbats.offeredSupport.sun = [];
								newMon.randbats.offeredSupport.sun.push(fragment);
								break;
							case 'Electric Surge':
							case 'Hadron Engine':
								fragment.singles.acceptedSupport.push('electricterrain');
								fragment.singles.acceptedSupport.push('backupelectricterrain');
								fragment.vgc.acceptedSupport.push('electricterrain');
								fragment.vgc.acceptedSupport.push('backupelectricterrain');
								
								if (!newMon.randbats.offeredSupport.electricterrain) newMon.randbats.offeredSupport.electricterrain = [];
								newMon.randbats.offeredSupport.electricterrain.push(fragment);
								if (!newMon.randbats.offeredSupport.antisleep) newMon.randbats.offeredSupport.antisleep = [];
								newMon.randbats.offeredSupport.antisleep.push(fragment);
								break;
							case 'Grassy Surge':
								fragment.singles.acceptedSupport.push('grassyterrain');
								fragment.singles.acceptedSupport.push('backupgrassyterrain');
								fragment.vgc.acceptedSupport.push('grassyterrain');
								fragment.vgc.acceptedSupport.push('backupgrassyterrain');
								// full disclosure: it's relatively unlikely that anything will actually be set to offer the support "backupgrassyterrain"
								// this is just because it's almost never a worthwhile consideration
								// but I'm still adding the acceptedSupport here for completion just in case it comes up
								
								if (!newMon.randbats.offeredSupport.grassyterrain) newMon.randbats.offeredSupport.grassyterrain = [];
								newMon.randbats.offeredSupport.grassyterrain.push(fragment);
								break;
							case 'Intimidate':
								if (!newMon.randbats.offeredSupport.physicalreduction) newMon.randbats.offeredSupport.physicalreduction = [];
								newMon.randbats.offeredSupport.physicalreduction.push(fragment);
								if (!newMon.randbats.offeredSupport.intimidate) newMon.randbats.offeredSupport.intimidate = [];
								newMon.randbats.offeredSupport.intimidate.push(fragment);
								break;
							case 'Flower Gift':
								fragment.singles.requestedSupport.push('sun');
								fragment.vgc.requestedSupport.push('sun');
								if (!newMon.randbats.singles.acceptedSupport.sun) newMon.randbats.singles.acceptedSupport.sun = [];
								newMon.randbats.singles.acceptedSupport.sun.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.sun) newMon.randbats.vgc.acceptedSupport.sun = [];
								newMon.randbats.vgc.acceptedSupport.sun.push(fragment);
								
								if (!newMon.randbats.offeredSupport.specialreduction) newMon.randbats.offeredSupport.specialreduction = [];
								newMon.randbats.offeredSupport.specialreduction.push(fragment);
								break;
							case 'Misty Surge':
								fragment.singles.acceptedSupport.push('mistyterrain');
								fragment.singles.acceptedSupport.push('backupmistyterrain');
								fragment.vgc.acceptedSupport.push('mistyterrain');
								fragment.vgc.acceptedSupport.push('backupmistyterrain');
								// full disclosure: it's relatively unlikely that anything will actually be set to offer the support "backupmistyterrain"
								// this is just because it's almost never a worthwhile consideration
								// but I'm still adding the acceptedSupport here for completion just in case it comes up

								if (!newMon.randbats.offeredSupport.mistyterrain) newMon.randbats.offeredSupport.mistyterrain = [];
								newMon.randbats.offeredSupport.mistyterrain.push(fragment);
								if (!newMon.randbats.offeredSupport.antistatus) newMon.randbats.offeredSupport.antistatus = [];
								newMon.randbats.offeredSupport.antistatus.push(fragment);
								if (!newMon.randbats.offeredSupport.antisleep) newMon.randbats.offeredSupport.antisleep = [];
								newMon.randbats.offeredSupport.antisleep.push(fragment);
								break;
							case 'Psychic Surge':
							case 'Mega-Neural':
								fragment.singles.acceptedSupport.push('psychicterrain');
								fragment.singles.acceptedSupport.push('backuppsychicterrain');
								fragment.vgc.acceptedSupport.push('psychicterrain');
								fragment.vgc.acceptedSupport.push('backuppsychicterrain');
								
								if (!newMon.randbats.offeredSupport.psychicterrain) newMon.randbats.offeredSupport.psychicterrain = [];
								newMon.randbats.offeredSupport.psychicterrain.push(fragment);
								if (!newMon.randbats.offeredSupport.antipriority) newMon.randbats.offeredSupport.antipriority = [];
								newMon.randbats.offeredSupport.antipriority.push(fragment);
								break;
							case 'Sand Stream':
							case 'Sand Spit':
								fragment.singles.acceptedSupport.push('sand');
								fragment.singles.acceptedSupport.push('backupsand');
								fragment.vgc.acceptedSupport.push('sand');
								fragment.vgc.acceptedSupport.push('backupsand');
								// full disclosure: it's relatively unlikely that anything will actually be set to offer the support "backupsand"
								// this is just because it's almost never a worthwhile consideration
								// but I'm still adding the acceptedSupport here for completion just in case it comes up
								
								if (!newMon.randbats.offeredSupport.sand) newMon.randbats.offeredSupport.sand = [];
								newMon.randbats.offeredSupport.sand.push(fragment);
								break;
							case 'Snow Warning':
								fragment.singles.acceptedSupport.push('snow');
								fragment.singles.acceptedSupport.push('backupsnow');
								fragment.vgc.acceptedSupport.push('snow');
								fragment.vgc.acceptedSupport.push('backupsnow');
								// full disclosure: it's relatively unlikely that anything will actually be set to offer the support "backupsnow"
								// this is just because it's almost never a worthwhile consideration
								// but I'm still adding the acceptedSupport here for completion just in case it comes up
								
								if (!newMon.randbats.offeredSupport.snow) newMon.randbats.offeredSupport.snow = [];
								newMon.randbats.offeredSupport.snow.push(fragment);
								break;
							case 'Storm Chaser':
								// we need any one of these, not all three
								let fragmentElectric = Utils.deepClone(fragment);
								fragmentElectric.singles.acceptedSupport.push('rain');
								fragmentElectric.singles.acceptedSupport.push('backuprain');
								fragmentElectric.vgc.acceptedSupport.push('rain');
								fragmentElectric.vgc.acceptedSupport.push('backuprain');
								fragmentElectric.vgc.requestedSupport.push('sideelectric');
								
								let fragmentFlying = Utils.deepClone(fragment);
								fragmentFlying.singles.acceptedSupport.push('rain');
								fragmentFlying.singles.acceptedSupport.push('backuprain');
								fragmentFlying.vgc.acceptedSupport.push('rain');
								fragmentFlying.vgc.acceptedSupport.push('backuprain');
								fragmentFlying.vgc.requestedSupport.push('sideflying');
								
								let fragmentWater = Utils.deepClone(fragment);
								fragmentWater.singles.acceptedSupport.push('rain');
								fragmentWater.singles.acceptedSupport.push('backuprain');
								fragmentWater.vgc.acceptedSupport.push('rain');
								fragmentWater.vgc.acceptedSupport.push('backuprain');
								fragmentWater.vgc.requestedSupport.push('sidewater');
								
								if (!newMon.randbats.offeredSupport.rain) newMon.randbats.offeredSupport.rain = [];
								if (!newMon.randbats.offeredSupport.backuprain) newMon.randbats.offeredSupport.backuprain = [];
								newMon.randbats.offeredSupport.rain.push(fragmentElectric);
								newMon.randbats.offeredSupport.rain.push(fragmentFlying);
								newMon.randbats.offeredSupport.rain.push(fragmentWater);
								newMon.randbats.offeredSupport.backuprain.push(fragmentElectric);
								newMon.randbats.offeredSupport.backuprain.push(fragmentFlying);
								newMon.randbats.offeredSupport.backuprain.push(fragmentWater);
								break;
							// acceptedSupport
							case 'Swift Swim':
							case 'Dry Skin':
							case 'Rain Dish':
								fragment.singles.requestedSupport.push('rain');
								fragment.vgc.requestedSupport.push('rain');
								if (!newMon.randbats.singles.acceptedSupport.rain) newMon.randbats.singles.acceptedSupport.rain = [];
								newMon.randbats.singles.acceptedSupport.rain.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.rain) newMon.randbats.vgc.acceptedSupport.rain = [];
								newMon.randbats.vgc.acceptedSupport.rain.push(fragment);
								break;
							case 'Hydration':
								fragment.singles.requestedSupport.push('rain');
								fragment.vgc.requestedSupport.push('rain');
								if (learnset.rest && learnset.rest.length) {
									fragment.baseMove = 'Rest';
									fragment.moves = ['Rest'];
									fragment.tags = 'recovery';
									fragment.role = 'personal';
								}
								if (!newMon.randbats.singles.acceptedSupport.rain) newMon.randbats.singles.acceptedSupport.rain = [];
								newMon.randbats.singles.acceptedSupport.rain.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.rain) newMon.randbats.vgc.acceptedSupport.rain = [];
								newMon.randbats.vgc.acceptedSupport.rain.push(fragment);
								break;
							case 'Chlorophyll':
							case 'Harvest':
								fragment.singles.requestedSupport.push('sun');
								fragment.vgc.requestedSupport.push('sun');
								if (!newMon.randbats.singles.acceptedSupport.sun) newMon.randbats.singles.acceptedSupport.sun = [];
								newMon.randbats.singles.acceptedSupport.sun.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.sun) newMon.randbats.vgc.acceptedSupport.sun = [];
								newMon.randbats.vgc.acceptedSupport.sun.push(fragment);
								break;
							case 'Sand Rush':
							case 'Sand Force':
								fragment.singles.requestedSupport.push('sand');
								fragment.vgc.requestedSupport.push('sand');
								if (!newMon.randbats.singles.acceptedSupport.sand) newMon.randbats.singles.acceptedSupport.sand = [];
								newMon.randbats.singles.acceptedSupport.sand.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.sand) newMon.randbats.vgc.acceptedSupport.sand = [];
								newMon.randbats.vgc.acceptedSupport.sand.push(fragment);
								break;
							case 'Slush Rush':
							case 'Ice Body':
							case 'Ice Face':
								fragment.singles.requestedSupport.push('snow');
								fragment.vgc.requestedSupport.push('snow');
								if (!newMon.randbats.singles.acceptedSupport.snow) newMon.randbats.singles.acceptedSupport.snow = [];
								newMon.randbats.singles.acceptedSupport.snow.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.snow) newMon.randbats.vgc.acceptedSupport.snow = [];
								newMon.randbats.vgc.acceptedSupport.snow.push(fragment);
								break;
							case 'Surge Surfer':
								fragment.singles.requestedSupport.push('electricterrain');
								fragment.vgc.requestedSupport.push('electricterrain');
								if (!newMon.randbats.singles.acceptedSupport.electricterrain) newMon.randbats.singles.acceptedSupport.electricterrain = [];
								newMon.randbats.singles.acceptedSupport.electricterrain.push(fragment);
								if (!newMon.randbats.vgc.acceptedSupport.electricterrain) newMon.randbats.vgc.acceptedSupport.electricterrain = [];
								newMon.randbats.vgc.acceptedSupport.electricterrain.push(fragment);
								break;
						}
					}
				}
			}
		}

		let originalTeamSpecies = [];
		let originalTeamNumbers = [];
		
		let setLevel = 100;
		let format = "singles";
		if (this.ruleTable.adjustLevel) setLevel = this.ruleTable.adjustLevel;
		if (this.activePerHalf && this.activePerHalf !== 1) format = "vgc";
		
		let stage = 'LC'; // easier to default to LC and check to disprove it at every possible step than the other way around

		if (team) {
			for (const pokemon of team) {
				if (pokemon && pokemon.species && this.dex.species.get(pokemon.species)) {
					if (this.dex.species.get(pokemon.species).id) originalTeamSpecies.push(this.dex.species.get(pokemon.species).id);
					if (this.dex.species.get(pokemon.species).num) originalTeamNumbers.push(this.dex.species.get(pokemon.species).num);
				}
				if (pokemon && (!pokemon.level || pokemon.level > 5)) stage = 'Evo'; // can't be LC if you're not level 5
				// !pokemon.level is for level 100s, which are missed otherwise
			}
		} else team = [];
		
		let shiny = false;
		if (!team.length && this.randomChance(1, 100)) shiny = true; // for fun, the whole team will be Shiny 1% of the time


		
		// check for monotype and LC
		let monotype = null;
		let types = [
			'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
			'Steel', 'Fairy', 'Normal',
		];
		let eligibleMonotypes = [];
		if (originalTeamSpecies.length) {
			for (const type of types) {
				let eligible = true;
				for (const id of originalTeamSpecies) if (!this.dex.species.get(id).randbats.types.includes(type)) eligible = false;
				if (eligible) eligibleMonotypes.push(type);
			}
			for (const id of originalTeamSpecies) if (!(this.dex.species.get(id).randbats.stage && this.dex.species.get(id).randbats.stage === 'LC')) stage = 'Evo';
			// it must not be LC if you have a non-LC
		} else stage = 'Evo'; // ... and obviously don't assume LC if the team is empty!
		if (originalTeamSpecies.length > 1) {
			// if there's more than 1 Pokémon, the player has already decided if it's monotype
			if (eligibleMonotypes.length) monotype = this.sample(eligibleMonotypes);
		} else {
			// but if not, the randomizer can decide if it should be monotype or not!
			if (this.randomChance(1,10)) { // the chance can be anything I want, but 10% should be good for now
				if (!eligibleMonotypes.length) eligibleMonotypes = types;
				monotype = this.sample(eligibleMonotypes);
			}
		}
		if (stage === 'LC') {
			monotype = null; // not sure if every monotype is even possible in LC
			setLevel = 5; // if your team still qualifies as LC after all of these checks, randomized sets should be level 5
		}
		// I don't *think* I have to worry about a separate LC banlist
		// because it's not like I was gonna put Dragon Rage or Sonic Boom on any of the FE sets anyway
		// but if Paul asks me to ban anything (like webs?), I'll figure it out ajkdfh

		let regulationb = false;
		// once Regulation B exists, I'll need to add a way for this to be "true"
		// this will probably just be based on the format name! but I won't worry about it now because it doesn't exist yet
		
		let megaLimit = 1;
		if (format === 'vgc') megaLimit = 2; // 2 Megas are fine for bring 6 pick 4
		let restrictedLimit = 6; // singles restricted is just Ubers
		if (format === 'vgc') restrictedLimit = 2;
		
		if (!regulationb) {
			megaLimit = 0;
			restrictedLimit = 0;
		}

		
		// now let's gather a list of eligible Pokémon to use for the rest of the process
		let eligiblePokemon = [];
		for (const id in this.dex.data.Pokedex) {
			if (
				this.dex.data.Pokedex[id].randbats && // in the format/has randbats data
				!originalTeamSpecies.includes(id) && !originalTeamNumbers.includes(this.dex.data.Pokedex[id].num) && // species clause
				(!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) || regulationb) && // not banned
				(!monotype || this.dex.data.Pokedex[id].randbats.types.includes(monotype) ||
				 (this.dex.data.Pokedex[id].forceTeraType && this.dex.data.Pokedex[id].forceTeraType === monotype)
				) && // account for monotype, but our special Terastallized states get some flexibility
				!(this.dex.data.Pokedex[id].forceTeraType && !this.dex.data.Pokedex[id].randbats.battleOnly) && // if something has a special Terastallized state, don't separately count the base form as eligible
				(this.dex.data.Pokedex[id].randbats.stage && this.dex.data.Pokedex[id].randbats.stage === stage) // account for LC
			) eligiblePokemon.push(id);
		}
		if (!eligiblePokemon.length || 6 > (team.length + eligiblePokemon.length)) { // shouldn't be an issue but just in case
			monotype = null;
			for (const id in this.dex.data.Pokedex) {
				if (
					this.dex.data.Pokedex[id].randbats && // in the format/has randbats data
					!originalTeamSpecies.includes(id) && !originalTeamNumbers.includes(this.dex.data.Pokedex[id].num) && // species clause
					(!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) || regulationb) && // not banned
					(this.dex.data.Pokedex[id].randbats.stage && this.dex.data.Pokedex[id].randbats.stage === stage) // account for LC
				) eligiblePokemon.push(id);
			}
		}
		if (!eligiblePokemon.length) return team; // I don't think this can even happen


		
		// TODO: iterate over existing team members' actual sets and adjust accordingly
		// I would like to evaluate the base team members in more detail for their requestedSupport, offeredSupport and acceptedSupport, but...
		// I'm not ready to do that just yet, so I'll leave them as their species defaults for now.
		// I'll come back to this after I've gone over the main support list!

		if (team.length) {
			for (const pokemon of team) {
				pokemon.offeredSupport = this.dex.species.get(pokemon.species).randbats.offeredSupport;
				pokemon.requestedSupport = this.dex.species.get(pokemon.species).randbats[format].requestedSupport;
				pokemon.acceptedSupport = this.dex.species.get(pokemon.species).randbats[format].acceptedSupport;
				pokemon.coveredStabs = [];
				pokemon.attackingTypes = {};
				pokemon.remainingStabTypes = [];
				pokemon.remainingStabMoves = [];
				
				pokemon.doNotReroll = true;
			}
		}
		
		// Now, we can start picking a first pass of team members
		// For now, when we decide something, we should push it to firstDraftTeam, not to the team just yet; we'll get to build sets later!
		const firstDraftTeam = [];
		if (team.length) for (const pokemon of team) firstDraftTeam.push(pokemon);

		// This next bit might look strange, but: before we make any informed decisions, it will help us to come up with a *completely* random selection of 6 Pokémon.
		// Most of these will likely be replaced shortly with more "optimal" choices, so you wouldn't expect it to matter,
		// but it's actually a really valuable fix to a problem I was running into earlier:
		// when we added Pokémon one at a time and based our choices on an incomplete team,
		// the selection ended up biased towards whatever could *potentially* fill the most different roles in *general,* because it assumed none of them were being filled
		// which meant it kept picking the same few versatile Pokémon disproportionately often and then often warping the rest of the team around them.
		// Starting with a fully-random selection of 6 Pokémon helps with that,
		// because it essentially means that a random assortment of roles will already be covered.
		// That way, when we do start to make weighted choices, the roles we value will be different every time, and the resulting teams end up much more varied overall!
		if (!firstDraftTeam.length && eligiblePokemon.filter(id => this.dex.data.Pokedex[id].copyData).length) {
			// if a team started completely empty, I want the first Pokémon selected to be a completely random Evo 2 sub
			let chosenRandomPokemon = this.sample(eligiblePokemon.filter(id => this.dex.data.Pokedex[id].copyData));
			firstDraftTeam.push({
				name: this.dex.data.Pokedex[chosenRandomPokemon].name,
				species: this.dex.data.Pokedex[chosenRandomPokemon].name,
				offeredSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats.offeredSupport,
				requestedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].requestedSupport,
				acceptedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].acceptedSupport,
				coveredStabs: [],
				attackingTypes: {},
				remainingStabTypes: [],
				remainingStabMoves: [],
				// we also don't want to reroll this first pick later! the rest of the team can be built around it
				doNotReroll: true,
			});
			eligiblePokemon = eligiblePokemon.filter(pokemon => pokemon !== chosenRandomPokemon);
		}
		
		while (firstDraftTeam.length < 6 && eligiblePokemon.length) {
			let eligiblePokemonThisStep = eligiblePokemon;
			if (monotype && firstDraftTeam.length === 5) {
				// the last Pokémon chosen for monotype can be any type!
				// later, we'll force its Tera Type to match the team instead
				let monotypeBypassEligiblePokemon = [];
				// figure out the full list of eligible Pokémon
				// we don't want to overwrite eligiblePokemon because we'll still use it in the for loop after this one!
				// instead, we can make a temporary list for just this step
				for (const id in this.dex.data.Pokedex) {
					if (
						this.dex.data.Pokedex[id].randbats && // in the format/has randbats data
						!originalTeamSpecies.includes(id) && !originalTeamNumbers.includes(this.dex.data.Pokedex[id].num) && // species clause
						!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) && // not banned
						!(this.dex.data.Pokedex[id].forceTeraType && !this.dex.data.Pokedex[id].randbats.battleOnly) && // if something has a special Terastallized state, don't separately count the base form as eligible
						(this.dex.data.Pokedex[id].randbats.stage && this.dex.data.Pokedex[id].randbats.stage === stage) && // account for LC
						(!this.dex.data.Pokedex[id].forceTeraType || this.dex.data.Pokedex[id].forceTeraType === monotype) // we want to force a Tera Type later
					) monotypeBypassEligiblePokemon.push(id);
				}
				if (monotypeBypassEligiblePokemon.length) eligiblePokemonThisStep = monotypeBypassEligiblePokemon;
			}
			let chosenRandomPokemon = this.sample(eligiblePokemonThisStep);
			firstDraftTeam.push({
				name: this.dex.data.Pokedex[chosenRandomPokemon].name,
				species: this.dex.data.Pokedex[chosenRandomPokemon].name,
				offeredSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats.offeredSupport,
				requestedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].requestedSupport,
				acceptedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].acceptedSupport,
				coveredStabs: [],
				attackingTypes: {},
				remainingStabTypes: [],
				remainingStabMoves: [],
				doNotReroll: null,
			});
			eligiblePokemon = eligiblePokemon.filter(pokemon => (pokemon !== chosenRandomPokemon && this.dex.species.get(pokemon).num !== this.dex.species.get(chosenRandomPokemon).num));
		}

		// Okay, now we know our format and whether or not we're playing LC,
		// we have a completely-random selection for our initial team,
		// and we can access the entire pool of eligiblePokemon and their randbats data
		// Next, we should start evaluating what we have so far and what we need for a team

		let baseRequestedSupport = [];
		// These are a kind of default checklist for each format, but there will be more specific requests as team members are evaluated
		if (format === "vgc") baseRequestedSupport = ['fakeout', 'priority', 'spread', 'speedcontrol', 'antitrickroom', 'physicalreduction', 'specialreduction'];
		else baseRequestedSupport = ['choicebreaker', 'priority', 'entryhazard', 'hazardcontrol', 'knockoff', 'contactpunish', 'electricimmune', 'groundimmune'];

		let teamPosition = 0;
		for (const draftTeamMember of firstDraftTeam) {
			teamPosition++;
			if (draftTeamMember.doNotReroll) continue;
			
			let currentStep = [];
			
			let requestedSupportInGeneral = [];
			let offeredSupportInGeneral = {}; // this one is not just a list, but how many of each
			
			let requestedSupportThisStep = [];
			let offeredSupportThisStep = [];
			let acceptedSupportThisStep = [];
			
			let teamNumbersThisStep = [];
			let resistancesThisStep = [];
			
			// other special limits
			let specialTerastallizedStateThisStep = false;
			let megaThisStep = 0;
			let restrictedThisStep = 0;
			
			if (firstDraftTeam.length) {
				for (const request of baseRequestedSupport) if (!requestedSupportInGeneral.includes(request)) requestedSupportInGeneral.push(request);
				for (const pokemon of firstDraftTeam) {
					if (pokemon === draftTeamMember) continue; // we're evaluating them against every *other* Pokémon
					for (const requestedSupport in pokemon.requestedSupport) if (!requestedSupportInGeneral.includes(requestedSupport)) requestedSupportInGeneral.push(requestedSupport);
					for (const offeredSupport in pokemon.offeredSupport) {
						if (!offeredSupportThisStep.includes(offeredSupport)) offeredSupportThisStep.push(offeredSupport);
						if (!offeredSupportInGeneral[offeredSupport]) offeredSupportInGeneral[offeredSupport] = 0;
						offeredSupportInGeneral[offeredSupport]++;
					}
					for (const acceptedSupport in pokemon.acceptedSupport) if (!acceptedSupportThisStep.includes(acceptedSupport)) acceptedSupportThisStep.push(acceptedSupport);
					if (this.dex.species.get(pokemon.species)) {
						if (this.dex.species.get(pokemon.species).num) teamNumbersThisStep.push(this.dex.species.get(pokemon.species).num);
						for (const type of types) if (!resistancesThisStep.includes(type) && (this.dex.species.get(pokemon.species).randbats.immunities[type] || (this.dex.species.get(pokemon.species).randbats.resistances[type] && !this.dex.species.get(pokemon.species).randbats.weaknesses[type]))) resistancesThisStep.push(type);

						// special limits
						if (this.dex.species.get(pokemon.species).forceTeraType) specialTerastallizedStateThisStep = true;
						if (regulationb) {
							if (this.dex.species.get(pokemon.species).forme && this.dex.species.get(pokemon.species).forme.includes("Mega")) megaThisStep++;
							if (this.dex.species.get(pokemon.species).tags && (this.dex.species.get(pokemon.species).tags.includes("Restricted Legendary") || this.dex.species.get(pokemon.species).tags.includes("Mythical"))) restrictedThisStep++;
						}
					}
				}
			}

			// one more setup thing: the last Pokémon chosen for monotype can be any type!
			// later, we'll force its Tera Type to match the team instead
			let monotypeBypassEligiblePokemon = [];
			if (monotype && (teamPosition === 6)) {
				// figure out the full list of eligible Pokémon
				// we don't want to overwrite eligiblePokemon because we'll still use it in the for loop after this one!
				// instead, we can make a temporary list for just this step
				for (const id in this.dex.data.Pokedex) {
					if (
						this.dex.data.Pokedex[id].randbats && // in the format/has randbats data
						!originalTeamSpecies.includes(id) && !originalTeamNumbers.includes(this.dex.data.Pokedex[id].num) && // species clause
						!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) && // not banned
						!(this.dex.data.Pokedex[id].forceTeraType && !this.dex.data.Pokedex[id].randbats.battleOnly) && // if something has a special Terastallized state, don't separately count the base form as eligible
						(this.dex.data.Pokedex[id].randbats.stage && this.dex.data.Pokedex[id].randbats.stage === stage) && // account for LC
						(!this.dex.data.Pokedex[id].forceTeraType || this.dex.data.Pokedex[id].forceTeraType === monotype) // we want to force a Tera Type later
					) monotypeBypassEligiblePokemon.push(id);
				}
			}
			let eligiblePokemonThisStep = eligiblePokemon;
			if (monotypeBypassEligiblePokemon.length) eligiblePokemonThisStep = monotypeBypassEligiblePokemon;

			if (specialTerastallizedStateThisStep) { // regardless of the format, don't give more than one of these!
				eligiblePokemonThisStep = eligiblePokemonThisStep.filter(id => !this.dex.data.Pokedex[id].forceTeraType);
			}
			
			if (regulationb) {
				// I realize I'm going to have to do a little more than this when we actually do Regulation B
				// This section guarantees you don't go *over* the limit, but nothing is set up to guarantee you a Mega or two restricted Pokémon
				// I don't actually know how I would even want to handle a singles Ubers format - it doesn't feel quite correct to force a full team of Ubers, does it?
				// but I think for VGC, where you can only have 2 restricted Pokémon anyway, I'll probably want them to be the first two Pokémon generated every time
				// Anyway, I'll come back to this when the format exists! This section unavoidably goes unused for now for obvious reasons
				if (megaThisStep >= megaLimit) {
					eligiblePokemonThisStep = eligiblePokemonThisStep.filter(id => !(this.dex.data.Pokedex[id].forme && this.dex.data.Pokedex[id].forme.includes("Mega")));
				}
				if (restrictedThisStep >= restrictedLimit) {
					eligiblePokemonThisStep = eligiblePokemonThisStep.filter(id => !(this.dex.data.Pokedex[id].tags && (this.dex.data.Pokedex[id].tags.includes("Restricted Legendary") || this.dex.data.Pokedex[id].tags.includes("Mythical"))));
				}
				// On the other hand, there's no reason at all to force a special Terastallized state, so that one is fine how it is
			}
			
			// Another thing: I need to filter which kinds of support are possible to ask for, now that I've established the pool of eligible Pokémon
			for (const request of requestedSupportInGeneral) {
				let possible = false;
				for (const id of eligiblePokemonThisStep) {
					if (this.dex.data.Pokedex[id].randbats.offeredSupport[request]) possible = true;
				}
				if (possible) requestedSupportThisStep.push(request);
			}
			// This is because I noticed the team generator prioritizing impossible goals a couple of times on monotype
			// It makes a pretty small difference in most cases, but it can come up if a type has multiple options for one goal and no options at all for another goal

			// Now let's see which of those attainable goals we want for this step!
			if (requestedSupportThisStep.filter(request => (!offeredSupportInGeneral[request])).length) { // If possible, we want a role that's requested and not already covered
				requestedSupportThisStep = requestedSupportThisStep.filter(request => (!offeredSupportInGeneral[request]));
			} else { // Failing that, we want a role that's requested and only 1 Pokémon can potentially cover it so far
				requestedSupportThisStep = requestedSupportThisStep.filter(request => (offeredSupportInGeneral[request] === 1));
			}
			// There's no next failsafe here, though - it's actually good if this still doesn't return anything!
			// That means the team covered its bases as well as it could, so we'll get to skip the next step entirely
			
			console.log(resistancesThisStep);
			console.log(`requested this step: ` + requestedSupportThisStep);

			// If we have any requestedSupport at this point, we want to find offeredSupport that matches it
			if (requestedSupportThisStep.length) {
				// Score them by how many roles they can fill, but no more than 3
				let maxScore = 0;
				for (const id of eligiblePokemonThisStep) {
					// species clause
					if (teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num)) continue;
					
					let score = 0;
					for (const role of requestedSupportThisStep) if (this.dex.data.Pokedex[id].randbats.offeredSupport[role]) score++;
					if (score > (requestedSupportThisStep.length + (teamPosition - 6))) score = (requestedSupportThisStep.length + (teamPosition - 6));
					if (score < 0) score = 0;
					if (score > maxScore) { // reset
						currentStep = [];
						maxScore = score;
					}
					if (score === maxScore) currentStep.push(id);
				}
			}
			// The reason we're capping out at 3 is because the Pokémon will need rooms for STABs and stuff too!
			// If we don't have a cap here, we're likely to pick one Pokémon that can theoretically fill any role very early...
			// and then think we've covered our bases and ignore roles entirely for the rest of the process...
			// only to find that the Pokémon can't cover more than a handful of roles and the rest of the team can't fill the gaps it left.
			// That's also why we like getting at least one backup option for each role if we can!
			// It's still possible to end up with a team that isn't perfect because of how this is set up,
			// but I think there are enough failsafes in later steps that it should come up with something usable more often than not,
			// and I want it to be open-ended enough to leave room for variety and fun options, too!
			
			if (!currentStep.length) currentStep = eligiblePokemonThisStep.filter(id => !teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num));
			
			// Then, we'll try to look for anything with acceptedSupport that matches our offeredSupport
			if (offeredSupportThisStep.length) {
				let desiredSupport = [];
				for (const id of currentStep) {
					// species clause
					if (teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num)) continue;
					
					// Unlike before, I think just a yes or a no is fine
					let accepted = false;
					for (const role of offeredSupportThisStep) if (this.dex.data.Pokedex[id].randbats[format].acceptedSupport[role] && !acceptedSupportThisStep.includes(role)) accepted = true;
					if (accepted === true) desiredSupport.push(id);
				}
				if (desiredSupport.length) currentStep = desiredSupport;
			}

			// narrowing down: type synergy for requestedSupport
			// // if we're doing requestedSupport for a specific Pokémon on the team (not a default), I'll want to prioritize defensive synergies with that Pokémon, not the whole team!
			// // probably total up the weaknesses, then use that as a multiplier
			// // (ex. if 2 Pokémon that requestedSupport Intimidate are both weak to Water, and 0 are weak to Fire,
			// // then the Intimidators are scored with 2 points for a Water resist and 0 for a Fire resist)
			// // it should go both ways I think - it's cooler for the Intimidator to have a weakness if several of the teammates it supports resist it, isn't it?
			if (firstDraftTeam.length) {
				console.log(`Current step: synergy resistances`);
				let synergyResists = [];
				let synergyResistMaxScore = 0;
				for (const id of currentStep) {
					let synergyResistScore = 0;
					let membersRequestingSupport = [];
					for (const offeredSupport in this.dex.data.Pokedex[id].randbats.offeredSupport) for (const pokemon of firstDraftTeam) if (pokemon.requestedSupport[offeredSupport] || pokemon.acceptedSupport[offeredSupport]) membersRequestingSupport.push(pokemon);
					if (!membersRequestingSupport) continue;

					if (membersRequestingSupport.length) {
						for (const type in types) {
							if (this.dex.data.Pokedex[id].randbats.immunities[type] || (this.dex.data.Pokedex[id].randbats.resistances[type] && !this.dex.data.Pokedex[id].randbats.weaknesses[type])) {
								// the Pokémon we're checking has a resistance, so give it points for each memberRequestingSupport that's weak to that type
								for (const member in membersRequestingSupport) if (this.dex.species.get(member.species).randbats.weaknesses[type] && !this.dex.species.get(member.species).randbats.resistances[type]) synergyResistScore++;
							} else if (this.dex.data.Pokedex[id].randbats.weaknesses[type] && !this.dex.data.Pokedex[id].randbats.resistances[type]) {
								// the Pokémon we're checking has a weakness, so give it points for each memberRequestingSupport that resists that type
								for (const member in membersRequestingSupport) if (this.dex.species.get(member.species).randbats.immunities[type] || (this.dex.species.get(member.species).randbats.resistances[type] && !this.dex.species.get(member.species).randbats.weaknesses[type])) synergyResistScore++;
							}
						}
						if (synergyResistScore > synergyResistMaxScore) { // reset
							synergyResists = [];
							synergyResistMaxScore = synergyResistScore;
							console.log(synergyResistMaxScore);
						}
						if (synergyResistScore === synergyResistMaxScore) synergyResists.push(id);
					}
				}
				console.log(synergyResists);
				if (synergyResists.length) currentStep = synergyResists;
			}

			// narrowing down: offering resistances for the team as a whole
			// // possible: replace with super effective STAB coverage for VGC?
			let teamResists = [];
			let teamResistMaxScore = 0;
			for (const id of currentStep) {
				let teamResistScore = 0;
				for (const type of types) if (!resistancesThisStep.includes(type) && (this.dex.data.Pokedex[id].randbats.immunities[type] || (this.dex.data.Pokedex[id].randbats.resistances[type] && !this.dex.data.Pokedex[id].randbats.weaknesses[type]))) teamResistScore++;
				if (teamResistScore > (18 - resistancesThisStep.length + teamPosition - 6)) teamResistScore = (18 - resistancesThisStep.length + teamPosition - 6);
				if (teamResistScore < 0) teamResistScore = 0;
				// I hope I did this right? uh, the point is - it should be "good enough" to cover all but 5 types on the first member, all but 4 types on the second member, all but 3 types on the third member, and so on
				
				if (teamResistScore > teamResistMaxScore) { // reset
					teamResists = [];
					teamResistMaxScore = teamResistScore;
				}
				if (teamResistScore === teamResistMaxScore) teamResists.push(id);
			}
			if (teamResists.length) currentStep = teamResists;
			
			// previously, if we had already covered an acceptedSupport, we didn't make it a priority to get it again - it's more important to narrow down by the other criteria
			// if it's still an option now, though, we might as well take it!
			if (offeredSupportThisStep.length) {
				let desiredSupport = [];
				for (const id of currentStep) {
					// species clause
					if (teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num)) continue;
					
					// for now, I think just a yes or a no is fine
					let accepted = false;
					for (const role of offeredSupportThisStep) if (this.dex.data.Pokedex[id].randbats[format].acceptedSupport[role]) accepted = true;
					if (accepted === true) desiredSupport.push(id);
				}
				if (desiredSupport.length) currentStep = desiredSupport;
			}
			
			// safety nets
			if (!currentStep.length) currentStep = eligiblePokemonThisStep.filter(id => !teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num));
			if (!currentStep.length) currentStep = eligiblePokemon.filter(id => !teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num));
			if (!currentStep.length) continue;
			
			// and... now we get to choose a Pokémon!
			let chosenRandomPokemon = this.sample(currentStep);
			// we can replace the drafted team member accordingly
			console.log(`Replaced ${draftTeamMember.name} with ${chosenRandomPokemon}`);
			firstDraftTeam[teamPosition - 1] = {
				name: this.dex.data.Pokedex[chosenRandomPokemon].name,
				species: this.dex.data.Pokedex[chosenRandomPokemon].name,
				offeredSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats.offeredSupport,
				requestedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].requestedSupport,
				acceptedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].acceptedSupport,
				coveredStabs: [],
				attackingTypes: {},
				remainingStabTypes: [],
				remainingStabMoves: [],
			};
		}
		console.log(firstDraftTeam);



		// outside the loop
		let teamOfferedSupport = {};
		let teamHighPrioRequestedSupport = {};
		
		let sets = [];
		let teamItemsSoFar = []; // for item clause
		if (firstDraftTeam.length) {
			for (const set of firstDraftTeam) {
				let randomized = true;
				if (set.item && !teamItemsSoFar.includes(set.item)) teamItemsSoFar.push(set.item);
				if (team.length) {
					for (const pokemon of team) {
						if (pokemon.species === set.species) randomized = false;
					}
				}
				if (randomized) set.hasBeenRandomized = true;
				set.coveredStabs = [];
				set.attackingTypes = {};
				set.movePowers = {};
				set.remainingStabTypes = [];
				set.remainingStabMoves = [];
				sets.push(set);
			}
		}
		
		// TEAMWIDE SET CONSTRUCTION: FRAGMENTS
		let eligibleFragments = true;
		let fragmentsList = [];
		
		for (const set of sets) {
			let species = this.dex.species.get(set.species);
			
			if (set.hasBeenRandomized) {
				// legality stuff, mostly for in-battle form changes
				// if the player is the one who brought the set, the validator will already have checked if it was legal, so I shouldn't force any of these details;
				// this is only for if the randomizer chose the Pokémon!
				
				if (species.battleOnly) {
					if (typeof species.battleOnly === 'string') set.species = species.battleOnly;
					else if (typeof species.battleOnly === 'object' && species.battleOnly.length) set.species = this.sample(species.battleOnly);
					set.name = set.species;
					// We can set a "freeAbility" for the post-form-change Ability!
					set.freeAbility = species.abilities[0];
					// For an example, Mega Manectric will have Intimidate as its freeAbility
					// That means that if we have a fragment requesting Intimidate in a Mega Manectric's pool, we want to check it off as completed right away
					// We don't have to worry about "fitting" Intimidate later - any fragment with Intimidate will know it's covered from now on
					// At the same time, we *don't* want to put Intimidate as the set's Ability!
					// If we did, it wouldn't be a legal Manectric pre-Mega...
					// but we'd also be rejecting perfectly viable support options like Lightning Rod if we think the Ability slot is taken by Intimidate!
					// Defining set.freeAbility here is setup so we can get around both of these issues once we're in the main set construction loop
				}
				// note that the rest of this will check this.dex.species.get(set.species) if we want specifically the base form (since we just changed the set to the base form),
				// but simply species if we want the form the randomizer actually chose (since that was recorded at the beginning of this loop)
				
				if (species.requiredItem) set.item = species.requiredItem;
				else if (species.requiredItems && typeof species.requiredItems === 'object' && species.requiredItems.length) set.item = this.sample(species.requiredItems);
				if (species.requiredAbility) set.ability = species.requiredAbility;
				if (species.requiredMove) {
					if (!set.moves) set.moves = [];
					if (!set.moves.includes(species.requiredMove) && set.moves.length < 4) set.moves.push(species.requiredMove);
				}
				if (species.forceTeraType) set.teraType = species.forceTeraType;
	
				// if there's only one possible Ability, account for it right away (in case it's a role, so the team knows it's covered)
				if (this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.abilities.length === 1) set.ability = this.dex.species.get(set.species).randbats.abilities[0];
	
				// some species may have been given hard-coded randbats details
				if (species.randbats[format].mandatory) {
					if (species.randbats[format].mandatory.ability) set.ability = species.randbats[format].mandatory.ability;
					if (species.randbats[format].mandatory.item) set.item = species.randbats[format].mandatory.item;
					if (species.randbats[format].mandatory.teraType) set.teraType = species.randbats[format].mandatory.teraType;
					if (species.randbats[format].mandatory.moves) {
						if (!set.moves) set.moves = [];
						for (const move of species.randbats[format].mandatory.moves) {
							if (!set.moves.includes(move) && set.moves.length < 4) set.moves.push(move);
						}
					}
				}

				// we need that boss team "monotype" vibe!
				// this overrides even the Pokémon's hard-coded randbats details if it has any -
				// but we still have to check for forceTeraType for set legality!
				if (monotype && !species.randbats.types.includes(monotype) && !species.forceTeraType) set.teraType = monotype;
			}
			
			// push everything in viableStabs, offeredSupport, [format].requestedSupport and [format].acceptedSupport
			// note that viableStabs is intentionally not sorted by type - for instance viableStabs.flying doesn't exist; all of the fragments are in viableStabs right now
			for (const fragment of species.randbats.viableStabs) {
				if (typeof fragment === 'string') continue;
				let modFragment = Utils.deepClone(fragment);
				modFragment.pokemon = set;
				modFragment.role = 'mainstab'; // actually I don't want this to specify a type either
				fragmentsList.push(modFragment);
			}
			for (const offeredSupport in species.randbats.offeredSupport) {
				if (species.randbats.offeredSupport[offeredSupport] === 'true') {
					if (!teamOfferedSupport[offeredSupport]) teamOfferedSupport[offeredSupport] = [];
					if (!teamOfferedSupport[offeredSupport].includes(set)) teamOfferedSupport[offeredSupport].push(set);
				}
				for (const fragment of species.randbats.offeredSupport[offeredSupport]) {
					if (typeof fragment !== 'string') {
						let modFragment = Utils.deepClone(fragment);
						modFragment.pokemon = set;
						modFragment.role = offeredSupport;
						fragmentsList.push(modFragment);
					}
				}
			}
			for (const requestedSupport in species.randbats[format].requestedSupport) {
				if (typeof fragment === 'string' && fragment === 'true') {
					if (!teamHighPrioRequestedSupport[requestedSupport]) teamHighPrioRequestedSupport[requestedSupport] = [];
					if (!teamHighPrioRequestedSupport[requestedSupport].includes(set)) teamHighPrioRequestedSupport[requestedSupport].push(set);
				}
				for (const fragment of species.randbats[format].requestedSupport[requestedSupport]) {
					if (typeof fragment !== 'string') {
						let modFragment = Utils.deepClone(fragment);
						modFragment.pokemon = set;
						fragmentsList.push(modFragment);
					}
				}
			}
			for (const acceptedSupport in species.randbats[format].acceptedSupport) {
				for (const fragment of species.randbats[format].acceptedSupport[acceptedSupport]) {
					if (typeof fragment === 'string' && fragment === 'true') {
						if (!teamHighPrioRequestedSupport[acceptedSupport]) teamHighPrioRequestedSupport[acceptedSupport] = [];
						if (!teamHighPrioRequestedSupport[acceptedSupport].includes(set)) teamHighPrioRequestedSupport[acceptedSupport].push(set);
					}
					if (typeof fragment !== 'string') {
						let modFragment = Utils.deepClone(fragment);
						modFragment.pokemon = set;
						fragmentsList.push(modFragment);
					}
				}
			}
		}

		for (const fragment of fragmentsList) {
			// quick sanity check: clearing out false positive "buddy fragments"
			// if fragment.buddy existed but it was empty to begin with, it would mistakenly be treated as complete and prioritized
			// I noticed this happening a couple of times during testing, so this is a failsafe!
			if (fragment.buddy) {
				if (
					!fragment.buddy.ability && !fragment.buddy.item && !fragment.buddy.teraType && !(fragment.buddy.moves && fragment.buddy.moves.length) && !(fragment.buddy.roles && fragment.buddy.roles.length) && !(
						fragment.buddy.evs && (fragment.buddy.evs['hp'] > 0 || fragment.buddy.evs['atk'] > 0 || fragment.buddy.evs['def'] > 0 || fragment.buddy.evs['spa'] > 0 || fragment.buddy.evs['spd'] > 0 || fragment.buddy.evs['spe'] > 0)
					)
				) {
					fragment.buddy = null;
				}
			}
			// also, some fragments that came from requestedSupport or acceptedSupport still need to be identified as main STABs
			if (!fragment.role && fragment.mainstab) fragment.role = 'mainstab';
		}

		while (eligibleFragments) {
			// if there are already no fragments left on any Pokémon, immediately set eligibleFragments to false and then "continue;" to end the loop
			if (!fragmentsList.length) {
				eligibleFragments = false;
				continue;
			}

			// STEP 1: counting space
			
			// identify how much space each Pokémon has left for fragments (specifically moveslots and leftover EVs, since there's only one item, Ability and Tera Type anyway)
			for (const set of sets) {
				if (set.moves) set.moveCount = set.moves.length;
				if (set.evs) set.evCount = set.evs['hp'] + set.evs['atk'] + set.evs['def'] + set.evs['spa'] + set.evs['spd'] + set.evs['spe'];
				// reset these each step
				set.remainingStabTypes = [];
				set.remainingStabMoves = [];
			}
			
			// STEP 2: fragment eligibility
			for (const fragment of fragmentsList) {
				fragment.eligible = true;
				
				// basic fragment-specific checks
				if (fragment.format && fragment.format !== format) {
					fragment.eligible = false;
					continue;
				}
				if (fragment.unique) {
					let unique = true;
					for (const set of sets) if (set.moves && set.moves.includes(fragment.baseMove)) unique = false;
					if (!unique) {
						fragment.eligible = false;
						continue;
					}
				}
				if (fragment.avoid && fragment.pokemon.roles) {
					let avoid = false;
					for (const role of fragment.avoid) {
						if (fragment.pokemon.roles.includes(role)) avoid = true;
					}
					if (avoid) {
						fragment.eligible = false;
						continue;
					}
				}
				if (fragment.pokemon.avoid && fragment.role) {
					let avoid = false;
					for (const role of fragment.pokemon.avoid) {
						if (role === fragment.role) avoid = true;
					}
					if (avoid) {
						fragment.eligible = false;
						continue;
					}
				}
				if (fragment.pokemon.avoid && fragment.tags) {
					let avoid = false;
					for (const role of fragment.pokemon.avoid) {
						if (fragment.tags.includes(role)) avoid = true;
					}
					if (avoid) {
						fragment.eligible = false;
						continue;
					}
				}
				
				fragment.highpriority = false;
				if (fragment.role && fragment.role === 'mainstab') fragment.fragmentPriority = 2;
				if (fragment.role && fragment.role === 'protection') fragment.fragmentPriority = 1;
				if (fragment.role && fragment.role === 'personal') fragment.fragmentPriority = 0;

				if (fragment.ability && fragment.pokemon.freeAbility && fragment.ability === fragment.pokemon.freeAbility) {
					fragment.ability = null;
				}
				if (fragment.ability && fragment.pokemon.ability) {
					if (fragment.ability === fragment.pokemon.ability) fragment.ability = null;
					else fragment.eligible = false;
				}
				if (fragment.item && fragment.pokemon.item) {
					if (fragment.item === fragment.pokemon.item) fragment.item = null;
					if (fragment.role === 'choicebreaker') fragment.role = 'mainstab';
					else fragment.eligible = false;
				}
				if (fragment.item && format === 'vgc' && teamItemsSoFar.includes(fragment.item)) fragment.eligible = false; // item clause
				if (fragment.teraType && fragment.pokemon.teraType) {
					if (fragment.teraType === fragment.pokemon.teraType) fragment.teraType = null;
					else fragment.eligible = false;
				}
				if (fragment.moves && fragment.pokemon.moves) {
					fragment.moves = fragment.moves.filter((move) => (!fragment.pokemon.moves.includes(move)));
					if (fragment.moves.length + fragment.pokemon.moveCount > 4) fragment.eligible = false;
				}
				if (fragment.evs && fragment.pokemon.evs) {
					if (fragment.evs === fragment.pokemon.evs) fragment.evs = null;
					else {
						let evCount = 0;
						if (fragment.evs['hp'] > fragment.pokemon.evs['hp']) evCount += fragment.evs['hp'] - fragment.pokemon.evs['hp'];
						if (fragment.evs['atk'] > fragment.pokemon.evs['atk']) evCount += fragment.evs['atk'] - fragment.pokemon.evs['atk'];
						if (fragment.evs['def'] > fragment.pokemon.evs['def']) evCount += fragment.evs['def'] - fragment.pokemon.evs['def'];
						if (fragment.evs['spa'] > fragment.pokemon.evs['spa']) evCount += fragment.evs['spa'] - fragment.pokemon.evs['spa'];
						if (fragment.evs['spd'] > fragment.pokemon.evs['spd']) evCount += fragment.evs['spd'] - fragment.pokemon.evs['spd'];
						if (fragment.evs['spe'] > fragment.pokemon.evs['spe']) evCount += fragment.evs['spe'] - fragment.pokemon.evs['spe'];
						
						if (evCount === 0) fragment.evs = null;
						else if (evCount + fragment.pokemon.evCount > 508) fragment.eligible = false;
					}
				}
				
				if (
					!fragment.ability && !fragment.item && !fragment.teraType && !(fragment.moves && fragment.moves.length) && !(
						fragment.evs && (fragment.evs['hp'] > 0 || fragment.evs['atk'] > 0 || fragment.evs['def'] > 0 || fragment.evs['spa'] > 0 || fragment.evs['spd'] > 0 || fragment.evs['spe'] > 0)
					)
				) {
					// the fragment is already complete, so I should also check it off of the role tally and then delete it from the fragments list
					if (fragment.role) {
						console.log(`${fragment.fragmentPriority} (default) - ${fragment.pokemon.name} has completed ${fragment.role} (${fragment.baseMove ? fragment.baseMove : ' '})`);
						if (fragment.moveBasePower && fragment.moveBasePower > 0) {
							if (!fragment.pokemon.attackingTypes[fragment.moveType]) fragment.pokemon.attackingTypes[fragment.moveType] = [];
							if (!fragment.pokemon.attackingTypes[fragment.moveType].includes(fragment.baseMove)) fragment.pokemon.attackingTypes[fragment.moveType].push(fragment.baseMove);
						}
						if (!['mainstab', 'protection', 'personal'].includes(fragment.role)) {
							if (!teamOfferedSupport[fragment.role]) teamOfferedSupport[fragment.role] = [];
							if (!teamOfferedSupport[fragment.role].includes(fragment.pokemon)) teamOfferedSupport[fragment.role].push(fragment.pokemon);
							if (!fragment.pokemon.roles) fragment.pokemon.roles = [];
							if (!fragment.pokemon.roles.includes(fragment.role)) fragment.pokemon.roles.push(fragment.role);
						}
						else if (fragment.role === 'mainstab' && fragment.moveType && !fragment.pokemon.coveredStabs.includes(fragment.moveType)) fragment.pokemon.coveredStabs.push(fragment.moveType);
					}
					if (fragment.baseMove) {
						if (fragment.pokemon.movePowers[this.dex.moves.get(fragment.baseMove).name]) {
							if (fragment.moveBasePower && fragment.moveBasePower > fragment.pokemon.movePowers[this.dex.moves.get(fragment.baseMove).name]) fragment.pokemon.movePowers[this.dex.moves.get(fragment.baseMove).name] = fragment.moveBasePower;
						} else {
							if (fragment.moveBasePower) fragment.pokemon.movePowers[this.dex.moves.get(fragment.baseMove).name] = fragment.moveBasePower;
						}
					}
					if (fragment.tags) { // I only define each fragment with one role, but sometimes - especially for the "buddy" property later - I think it could come in handy to give them more labels than that
						if (!fragment.pokemon.roles) fragment.pokemon.roles = [];
						for (const tag of fragment.tags) if (!fragment.pokemon.roles.includes(tag)) fragment.pokemon.roles.push(tag);
					}
					if (fragment.avoid) {
						if (!fragment.pokemon.avoid) fragment.pokemon.avoid = [];
						for (const avoid of fragment.avoid) if (!fragment.pokemon.avoid.includes(avoid)) fragment.pokemon.avoid.push(avoid);
					}
					if (fragment[format].acceptedSupport) for (const request of fragment[format].acceptedSupport) {
						if (!teamHighPrioRequestedSupport[request]) teamHighPrioRequestedSupport[request] = [];
						if (!teamHighPrioRequestedSupport[request].includes(fragment.pokemon)) teamHighPrioRequestedSupport[request].push(fragment.pokemon);
					}
					if (fragment[format].requestedSupport) for (const request of fragment[format].requestedSupport) {
						if (!teamHighPrioRequestedSupport[request]) teamHighPrioRequestedSupport[request] = [];
						if (!teamHighPrioRequestedSupport[request].includes(fragment.pokemon)) teamHighPrioRequestedSupport[request].push(fragment.pokemon);
					}
					fragment.eligible = false;
				}

				// "Fragment buddies" are for completely optional properties that are particularly nice to pair together
				// For example, having U-turn isn't a prerequisite to being a viable Choice Band user,
				// and having a Choice Band certainly isn't a prerequisite to running U-turn!
				// but if we've decided to run Band anyway, and the more important set requirements have already been covered,
				// it might be a good idea to give U-turn a bump in priority over the other possible remaining options
				// This is something that just gets decided on a case-by-case basis per fragment; it's just good to have the option to set this up
				if (fragment.buddy) {
					if (fragment.buddy.ability && fragment.pokemon.freeAbility && fragment.ability === fragment.pokemon.freeAbility) {
						fragment.buddy.ability = null;
					}
					if (fragment.buddy.ability && fragment.pokemon.ability && fragment.buddy.ability === fragment.pokemon.ability) fragment.buddy.ability = null;
					if (fragment.buddy.item && fragment.pokemon.item && fragment.buddy.item === fragment.pokemon.item) fragment.buddy.item = null;
					if (fragment.buddy.teraType && fragment.pokemon.teraType && fragment.buddy.teraType === fragment.pokemon.teraType) fragment.buddy.teraType = null;
					if (fragment.buddy.moves && fragment.pokemon.moves) fragment.buddy.moves = fragment.buddy.moves.filter((move) => (!fragment.pokemon.moves.includes(move)));
					if (fragment.buddy.roles && fragment.pokemon.roles) fragment.buddy.roles = fragment.buddy.roles.filter((role) => (!fragment.pokemon.roles.includes(role)));
					if (fragment.buddy.evs && fragment.pokemon.evs) {
						if (fragment.buddy.evs === fragment.pokemon.evs) fragment.buddy.evs = null;
						else {
							let evCount = 0;
							if (fragment.buddy.evs['hp'] > fragment.pokemon.evs['hp']) evCount += fragment.buddy.evs['hp'] - fragment.pokemon.evs['hp'];
							if (fragment.buddy.evs['atk'] > fragment.pokemon.evs['atk']) evCount += fragment.buddy.evs['atk'] - fragment.pokemon.evs['atk'];
							if (fragment.buddy.evs['def'] > fragment.pokemon.evs['def']) evCount += fragment.buddy.evs['def'] - fragment.pokemon.evs['def'];
							if (fragment.buddy.evs['spa'] > fragment.pokemon.evs['spa']) evCount += fragment.buddy.evs['spa'] - fragment.pokemon.evs['spa'];
							if (fragment.buddy.evs['spd'] > fragment.pokemon.evs['spd']) evCount += fragment.buddy.evs['spd'] - fragment.pokemon.evs['spd'];
							if (fragment.buddy.evs['spe'] > fragment.pokemon.evs['spe']) evCount += fragment.buddy.evs['spe'] - fragment.pokemon.evs['spe'];
							
							if (evCount === 0) fragment.buddy.evs = null;
						}
					}
					
					if (
						!fragment.buddy.ability && !fragment.buddy.item && !fragment.buddy.teraType && !(fragment.buddy.moves && fragment.buddy.moves.length) && !(fragment.buddy.roles && fragment.buddy.roles.length) && !(
							fragment.buddy.evs && (fragment.buddy.evs['hp'] > 0 || fragment.buddy.evs['atk'] > 0 || fragment.buddy.evs['def'] > 0 || fragment.buddy.evs['spa'] > 0 || fragment.buddy.evs['spd'] > 0 || fragment.buddy.evs['spe'] > 0)
						)
					) {
						// the fragment buddy is complete!
						fragment.buddy = null;
						fragment.buddycomplete = true;
					}
				}

				// some more eligibility checks:
				// Choice items
				if (((fragment.item && ['Choice Band', 'Choice Specs', 'Choice Scarf'].includes(fragment.item)) || (fragment.ability && fragment.ability === 'Gorilla Tactics')) && fragment.pokemon.moves) {
					for (const move of fragment.pokemon.moves) {
						// what moves should you never be choiced into? I can come back to this and add more exceptions if I need
						if (this.dex.moves.get(move).category === 'Status' && ![
							'Healing Wish', 'Lunar Dance', 'Memento', 'Parting Shot', 'Chilly Reception',
							'Trick', 'Switcheroo', 'Bestow',
							'Defog', 'Tidy Up',
							'Nature Power', 'Sleep Talk',
						].includes(this.dex.moves.get(move).name)) fragment.eligible = false;
						if (['Fake Out', 'First Impression'].includes(move)) fragment.eligible = false;
					}
				}
				if (((fragment.pokemon.item && ['Choice Band', 'Choice Specs', 'Choice Scarf'].includes(fragment.pokemon.item)) || (fragment.pokemon.ability && fragment.pokemon.ability === 'Gorilla Tactics')) && fragment.moves) {
					for (const move of fragment.moves) {
						if (this.dex.moves.get(move).category === 'Status' && ![
							'Healing Wish', 'Lunar Dance', 'Memento', 'Parting Shot', 'Chilly Reception',
							'Trick', 'Switcheroo', 'Bestow',
							'Defog', 'Tidy Up',
							'Nature Power', 'Sleep Talk',
						].includes(this.dex.moves.get(move).name)) fragment.eligible = false;
						if (['Fake Out', 'First Impression'].includes(move)) fragment.eligible = false;
					}
				}
				// Assault Vest
				if (fragment.item && fragment.item === 'Assault Vest' && fragment.pokemon.moves) {
					for (const move of fragment.pokemon.moves) {
						// reject status moves, except Me First
						if (this.dex.moves.get(move).category === 'Status' && this.dex.moves.get(move).name !== 'Me First') fragment.eligible = false;
					}
				}
				if (fragment.pokemon.item && fragment.pokemon.item === 'Assault Vest' && fragment.moves) {
					for (const move of fragment.moves) {
						// reject status moves, except Me First
						if (this.dex.moves.get(move).category === 'Status' && this.dex.moves.get(move).name !== 'Me First') fragment.eligible = false;
					}
				}
				// don't run multiple protection moves on the same set
				if (fragment.moves && fragment.pokemon.moves) {
					let fragmentStall = false;
					for (const move of fragment.moves) if (this.dex.moves.get(move).stallingMove || ['Fake Out', 'Substitute', 'Quick Guard', 'Wide Guard'].includes(this.dex.moves.get(move).name)) fragmentStall = true;
					let pokemonStall = false;
					for (const move of fragment.pokemon.moves) if (this.dex.moves.get(move).stallingMove || ['Fake Out', 'Substitute', 'Quick Guard', 'Wide Guard'].includes(this.dex.moves.get(move).name)) pokemonStall = true;
					if (fragmentStall && pokemonStall) fragment.eligible = false;
				}
				// now is a good time to keep track of how many main STABs are still possible, for the next stap
				if (fragment.eligible && fragment.role === 'mainstab') {
					if (fragment.moveType && !fragment.pokemon.remainingStabTypes.includes(fragment.moveType)) fragment.pokemon.remainingStabTypes.push(fragment.moveType);
					if (fragment.baseMove && !fragment.pokemon.remainingStabMoves.includes(fragment.baseMove)) fragment.pokemon.remainingStabMoves.push(fragment.baseMove);
				}
			}
			fragmentsList = fragmentsList.filter((fragment) => (fragment.eligible === true));
			
			if (!fragmentsList.length) {
				eligibleFragments = false;
				continue;
			}

			// make sure to set aside room for STABs if they exist!
			// this only actually matters if enough high-priority roles could be assigned to the same set fill it before you even get to STABs, so there are *some* situations when it won't come up at all
			// but in the situations when it does come up, it's important to entirely deletes the ineligible fragment!
			// otherwise, other Pokémon might start to request support that has been offered but isn't possible to fit on a set
			for (const set of sets) {
				// some Pokémon may end up with 3 or more "STAB" types by this point because of certain modifiers, but we only care about leaving space for any 2
				let maxStabSpace = 2;
				if (set.coveredStabs.length) maxStabSpace -= set.coveredStabs.length;
				
				let stabSpace = set.remainingStabTypes.length;
				if (stabSpace && stabSpace > maxStabSpace) stabSpace = maxStabSpace;
				
				if (stabSpace && stabSpace > 0) set.moveCount += stabSpace;
			}
			for (const fragment of fragmentsList) {
				let reportMovesLeft = false;
				let movesLeft = [];
				if (fragment.moves && fragment.pokemon.moves) {
					if ((fragment.moves.filter((move) => (!fragment.pokemon.moves.includes(move) && !fragment.pokemon.remainingStabMoves.includes(move))).length + fragment.pokemon.moveCount) > 4) fragment.eligible = false;
					if (!fragment.eligible) {
						console.log(`${fragment.pokemon.name} rejected ${fragment.baseMove} to save room for STABs`);
						if (fragment.pokemon.name === 'Drampa') reportMovesLeft = true;
					}
					if (fragment.eligible && !movesLeft.includes(fragment.baseMove) && fragment.pokemon.name === 'Drampa') movesLeft.push(fragment.baseMove);
				}
				if (movesLeft && reportMovesLeft) {
					console.log('Moves left:');
					console.log(movesLeft);
				}
			}
			fragmentsList = fragmentsList.filter((fragment) => (fragment.eligible === true));
			
			if (!fragmentsList.length) {
				eligibleFragments = false;
				continue;
			}
			
			// for each fragment:
			// // if any of its criteria are already met (like it has an Ability but the set also already has that Ability), clear that requirement to simplify the fragment
			// // if (after the above) all of its criteria are filled, replace the fragment with "true" to check it off as complete
			// // if (after the above) any of its criteria are impossible to meet (like it has an Ability but the set already has a different Ability, or it takes more moves than there are open slots), delete the fragment
			// // // IMPORTANT: delete any fragment that's "just" a main STAB if another main STAB of the *same type* is already in!
			// // // if I don't, I risk letting two fragments in for "compressing" with conflicting STABs of the same type, and then you can't actually fit them both anyway

			let teamRequestedSupport = {};
			for (const request of baseRequestedSupport) {
				if (!teamRequestedSupport[request]) teamRequestedSupport[request] = [];
				teamRequestedSupport[request].push("true");
			}
			for (const fragment of fragmentsList) if (fragment[format].requestedSupport) for (const request of fragment[format].requestedSupport) {
				if (!teamRequestedSupport[request]) teamRequestedSupport[request] = [];
				if (!teamRequestedSupport[request].includes(fragment.pokemon)) teamRequestedSupport[request].push(fragment.pokemon);
			}
			for (const fragment of fragmentsList) if (fragment[format].acceptedSupport) for (const request of fragment[format].acceptedSupport) {
				if (!teamRequestedSupport[request]) teamRequestedSupport[request] = [];
				if (!teamRequestedSupport[request].includes(fragment.pokemon)) teamRequestedSupport[request].push(fragment.pokemon);
			}
			for (const type of types) {
				if (!teamRequestedSupport[`${(type).toLowerCase()}resist`]) teamRequestedSupport[`${(type).toLowerCase()}resist`] = [];
				teamRequestedSupport[`${(type).toLowerCase()}resist`].push("true");
			}
			
			let possibleSupport = {};
			for (const support in teamOfferedSupport) possibleSupport[support] = teamOfferedSupport[support];

			// getting priorities in order
			for (const fragment of fragmentsList) {
				if (fragment.role) {
					// prioritize roles that aren't covered
					if (teamRequestedSupport[fragment.role] && !teamOfferedSupport[fragment.role]) {
						// major, team-specific synergies get 6
						fragment.fragmentPriority = 6;
						// default synergies get 5
						if (baseRequestedSupport.includes(fragment.role)) fragment.fragmentPriority = 5;
						// minor synergies get 4
						if (fragment.role.indexOf(`immune`) >= 0) fragment.fragmentPriority = 4;
						if (fragment.role.indexOf(`resist`) >= 0) fragment.fragmentPriority = 4;
					}
					if (teamOfferedSupport[fragment.role] && fragment.fragmentPriority > 3) fragment.fragmentPriority = 0;
					if (fragment.role === 'mainstab') {
						// don't do multiple main STABs of the same type
						if (fragment.pokemon.coveredStabs.includes(fragment.moveType)) fragment.eligible = false;
						// and don't bother to prioritize "STABs" of more than two types
						else if (fragment.pokemon.coveredStabs.length > 1 && fragment.fragmentPriority === 2) fragment.fragmentPriority = 0;
					} else if (fragment.role !== 'protection') {
						// if one half of a synergy exists, prioritize the other half
						if ((teamHighPrioRequestedSupport[fragment.role] && teamHighPrioRequestedSupport[fragment.role].filter((requester) => (requester !== fragment.pokemon)).length) && !teamOfferedSupport[fragment.role]) fragment.highpriority = true;
						// if the team doesn't want the support, throw out the fragment
						if ((!teamRequestedSupport[fragment.role] || !teamRequestedSupport[fragment.role].filter((requester) => (requester !== fragment.pokemon)).length) && (!teamHighPrioRequestedSupport[fragment.role] || !teamHighPrioRequestedSupport[fragment.role].filter((requester) => (requester !== fragment.pokemon)).length) && fragment.role !== 'personal') fragment.eligible = false;
						// otherwise, record that the support is still possible at this point
						else {
							if (!possibleSupport[fragment.role]) possibleSupport[fragment.role] = [];
							if (!possibleSupport[fragment.role].includes(fragment.pokemon)) possibleSupport[fragment.role].push(fragment.pokemon);
						}
					}
				}
			}
			
			for (const fragment of fragmentsList) {
				if (fragment[format].requestedSupport) {
					for (const request of fragment[format].requestedSupport) {
						// if one half of a synergy exists, prioritize getting at least one of the other half
						if ((teamOfferedSupport[request] && teamOfferedSupport[request].filter((requester) => (requester !== fragment.pokemon)).length) && !teamHighPrioRequestedSupport[request]) fragment.highpriority = true;
						// but filter out impossible requests
						if ((!possibleSupport[request] || !possibleSupport[request].filter((requester) => (requester !== fragment.pokemon)).length)) fragment.eligible = false;
					}
				}
			}
			fragmentsList = fragmentsList.filter((fragment) => (fragment.eligible === true));
			
			if (!fragmentsList.length) {
				eligibleFragments = false;
				continue;
			}


			// STEP 3: fragment matchmaking
			
			// list acceptedSupportThisStep based on remaining fragments
			// list relevant roles (mix of requestedSupportThisStep and acceptedSupportThisStep, except roles that are already filled)

			// for each fragment:
			// // if it's an acceptedSupport, but the corresponding offeredSupport isn't offered by any Pokémon and isn't already on the team, delete the fragment
			// // if it's an offeredSupport, but there is no corresponding requestedSupport or acceptedSupport, delete the fragment
			// // // DO NOT delete the fragment if there *is* a requestedSupport or acceptedSupport but it's already covered - that will just lower its priority later!
			// // if it's an offeredSupport and it's still here, add it to a tally of how many Pokémon are offering that support (ones with fewer options will be prioritized later)


			
			// STEP 4: fragment priorities
			// okay, we're done deleting fragments this step - if there are any left, we want to pick one! now we're just narrowing down a favorite

			// if there are any eligible fragments except STABs (which also means there's *room* for something else before STABs, as established earlier), filter out fragments that are "just" main STABs
			// // if not, STABs are the only thing left for this loop, so keep going!
			
			// if we're not focusing on STABs yet:
			// // if it's an offeredSupport, but it's already covered by the team, flag it as "low-priority" (but don't delete it! these are still handy when we have nothing better to do)
			// // // if there are only "low-priority" fragments, run with them; if not, filter them out of the current step and keep going

			let prioritizeRoles = true;
			// highpriority is dynamic and depends on the current step
			let fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.highpriority));
			// the rest only matters if nothing is highpriority!

			// fragmentPriority of 6 is for *specific team themes* that get fast-tracked
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.fragmentPriority > 5));
			
			// fragmentPriority of 5 is for *standard roles* that aren't covered yet
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.fragmentPriority > 4));
			
			// fragmentPriority of 4 is for *minor* synergies between team members, like immunity to an ally's spread move
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.fragmentPriority > 3));
			
			if (!fragmentsListThisStep.length) {
				prioritizeRoles = false; // every possible role has either been assigned once or dismissed for the current step
				// fragmentPriority of 3 is reserved for the threatlist feature; this is unused for now
				fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.fragmentPriority > 2));
			}
			
			// at this point, if we have any with completed "buddy" fragments, let's prioritize those!
			if (!fragmentsListThisStep.length) if (fragmentsList.filter((fragment) => (fragment.buddycomplete)).length) fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.buddycomplete));
			
			// fragmentPriority of 2 is for main STABs
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.fragmentPriority > 1));
			
			// fragmentPriority of 1 is for protection moves in VGC, but it won't come up in singles
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.fragmentPriority > 0));

			// fragmentPriority of 0 is for "personal" picks as well as roles that have already been completed
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList;
			
			if (!fragmentsListThisStep.length) {
				eligibleFragments = false;
				continue;
			}
			
			// // only if the current step *isn't* low-priority, filter fragments for the current step so only the most unique *right now* are counted, then keep going (if the current step is low-priority, uniqueness doesn't matter!)
			// // if possible, prioritize fragments based on whether a move, Ability or item they include is a) also a viable STAB or b) on a different eligible, not-low-priority fragment on the same Pokémon
			// // // (provisionally: the more compression, the better?)
			// // if possible, prioritize fragments based on the Pokémon's next-most-unique fragment (the *less* unique, the better - and perfect if there just are no other fragments competing!)

			if (prioritizeRoles) {
				let reducedFragmentsListThisStep = [];
				let roleCount = {};
				for (const fragment of fragmentsListThisStep) {
					if (fragment.role && !['mainstab', 'protection', 'personal'].includes(fragment.role)) {
						if (!roleCount[fragment.role]) roleCount[fragment.role] = [];
						if (!roleCount[fragment.role].includes(fragment.pokemon.name)) roleCount[fragment.role].push(fragment.pokemon.name);
					}
				}
				let minRoleCount = 6;
				for (const role in roleCount) {
					if (minRoleCount > roleCount[role].length) minRoleCount = roleCount[role].length;
				}
				for (const fragment of fragmentsListThisStep) {
					if (fragment.role && !['mainstab', 'protection', 'personal'].includes(fragment.role) && roleCount[fragment.role].length <= minRoleCount) reducedFragmentsListThisStep.push(fragment);
				}
				if (reducedFragmentsListThisStep.length) fragmentsListThisStep = reducedFragmentsListThisStep;
			}
			
			// if there are multiple remaining candidates for the same role (or STAB type), and any of them have a score defined, filter out all competition for that role except the highest-scoring
			// // the "score" is on a per-role basis and not standardized, so only compare fragments with the same role!!!
			let reducedFragmentsListThisStep = [];
			let roleScores = {};
			let safeScores = {};
			for (const fragment of fragmentsListThisStep) {
				if (fragment.role && !['mainstab'].includes(fragment.role)) {
					if (!roleScores[fragment.role]) roleScores[fragment.role] = 0;
					if (fragment.score && fragment.score > roleScores[fragment.role]) roleScores[fragment.role] = fragment.score;
				}
				else if (fragment.role && fragment.role === 'mainstab') {
					if (!roleScores[fragment.pokemon]) roleScores[fragment.pokemon] = 0;
					if (fragment.score && fragment.score > roleScores[fragment.pokemon]) roleScores[fragment.pokemon] = fragment.score;
					if (!safeScores[fragment.pokemon]) safeScores[fragment.pokemon] = 0;
					if (fragment[format].safeStab && fragment.moveBasePower && fragment.moveBasePower > safeScores[fragment.pokemon]) safeScores[fragment.pokemon] = fragment.moveBasePower;
				}
			}
			for (const fragment of fragmentsListThisStep) {
				let safeToPush = true;
				if (fragment.role && !['mainstab'].includes(fragment.role)) {
					if (roleScores[fragment.role] && roleScores[fragment.role] > 0 && (!fragment.score || (roleScores[fragment.role] > fragment.score))) safeToPush = false;
				}
				else if (fragment.role && fragment.role === 'mainstab') {
					if (roleScores[fragment.pokemon] && roleScores[fragment.pokemon] > 0 && (!fragment.score || (roleScores[fragment.pokemon] > fragment.score))) safeToPush = false;
					if (!(fragment.score && fragment.score > 0) && safeScores[fragment.pokemon] && safeScores[fragment.pokemon] > 0 && (!fragment.moveBasePower || (safeScores[fragment.pokemon] > fragment.moveBasePower))) safeToPush = false;
				}
				if (fragment.bypassScore) safeToPush = true;
				if (safeToPush) reducedFragmentsListThisStep.push(fragment);
			}
			if (reducedFragmentsListThisStep.length) fragmentsListThisStep = reducedFragmentsListThisStep;

			let weightedFragmentsListThisStep = [];
			for (const fragment of fragmentsListThisStep) {
				if (fragment.weight && fragment.weight > 0) {
					for (let i = 0; i < fragment.weight; i++) weightedFragmentsListThisStep.push(fragment);
				} else {
					weightedFragmentsListThisStep.push(fragment);
				}
			}
			if (weightedFragmentsListThisStep.length) fragmentsListThisStep = weightedFragmentsListThisStep;

			// STEP 5: applying fragments
			// finally, pick a random fragment from the narrowed-down pool, apply it to the set, and loop
			let chosenFragment = this.sample(fragmentsListThisStep);
			if (chosenFragment) {
				if (chosenFragment.ability) chosenFragment.pokemon.ability = chosenFragment.ability;
				if (chosenFragment.item) {
					chosenFragment.pokemon.item = chosenFragment.item;
					if (!teamItemsSoFar.includes(chosenFragment.item)) teamItemsSoFar.push(chosenFragment.item);
				}
				if (chosenFragment.teraType) chosenFragment.pokemon.teraType = chosenFragment.teraType;
				if (chosenFragment.moves) {
					if (!chosenFragment.pokemon.moves) chosenFragment.pokemon.moves = [];
					for (const move of chosenFragment.moves) chosenFragment.pokemon.moves.push(move);
				}
				if (chosenFragment.evs) {
					if (!chosenFragment.pokemon.evs) chosenFragment.pokemon.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
					if (chosenFragment.evs['hp'] > chosenFragment.pokemon.evs['hp']) chosenFragment.pokemon.evs['hp'] = chosenFragment.evs['hp'];
					if (chosenFragment.evs['atk'] > chosenFragment.pokemon.evs['atk']) chosenFragment.pokemon.evs['atk'] = chosenFragment.evs['atk'];
					if (chosenFragment.evs['def'] > chosenFragment.pokemon.evs['def']) chosenFragment.pokemon.evs['def'] = chosenFragment.evs['def'];
					if (chosenFragment.evs['spa'] > chosenFragment.pokemon.evs['spa']) chosenFragment.pokemon.evs['spa'] = chosenFragment.evs['spa'];
					if (chosenFragment.evs['spd'] > chosenFragment.pokemon.evs['spd']) chosenFragment.pokemon.evs['spd'] = chosenFragment.evs['spd'];
					if (chosenFragment.evs['spe'] > chosenFragment.pokemon.evs['spe']) chosenFragment.pokemon.evs['spe'] = chosenFragment.evs['spe'];
				}
				if (chosenFragment.role) {
					console.log(`${chosenFragment.fragmentPriority}${chosenFragment.highpriority ? ' (highprio)' : ' '}${chosenFragment.buddycomplete ? ' (buddycomplete)' : ' '} - ${chosenFragment.pokemon.name} assigned ${chosenFragment.role} (${chosenFragment.baseMove ? chosenFragment.baseMove : ' '})`);
					if (chosenFragment.moveBasePower && chosenFragment.moveBasePower > 0) {
						if (!chosenFragment.pokemon.attackingTypes[chosenFragment.moveType]) chosenFragment.pokemon.attackingTypes[chosenFragment.moveType] = [];
						if (!chosenFragment.pokemon.attackingTypes[chosenFragment.moveType].includes(chosenFragment.baseMove)) chosenFragment.pokemon.attackingTypes[chosenFragment.moveType].push(chosenFragment.baseMove);
					}
					if (!['mainstab', 'protection', 'personal'].includes(chosenFragment.role)) {
						if (!teamOfferedSupport[chosenFragment.role]) teamOfferedSupport[chosenFragment.role] = [];
						if (!teamOfferedSupport[chosenFragment.role].includes(chosenFragment.pokemon)) teamOfferedSupport[chosenFragment.role].push(chosenFragment.pokemon);
						if (!chosenFragment.pokemon.roles) chosenFragment.pokemon.roles = [];
						if (!chosenFragment.pokemon.roles.includes(chosenFragment.role)) chosenFragment.pokemon.roles.push(chosenFragment.role);
					}
					else if (chosenFragment.role === 'mainstab' && chosenFragment.moveType && !chosenFragment.pokemon.coveredStabs.includes(chosenFragment.moveType)) chosenFragment.pokemon.coveredStabs.push(chosenFragment.moveType);
				}
				if (chosenFragment.tags) {
					if (!chosenFragment.pokemon.roles) chosenFragment.pokemon.roles = [];
					for (const tag of chosenFragment.tags) if (!chosenFragment.pokemon.roles.includes(tag)) chosenFragment.pokemon.roles.push(tag);
				}
				if (chosenFragment.avoid) {
					if (!chosenFragment.pokemon.avoid) chosenFragment.pokemon.avoid = [];
					for (const avoid of chosenFragment.avoid) if (!chosenFragment.pokemon.avoid.includes(avoid)) chosenFragment.pokemon.avoid.push(avoid);
				}
				if (chosenFragment.baseMove) {
					if (chosenFragment.pokemon.movePowers[this.dex.moves.get(chosenFragment.baseMove).name]) {
						if (chosenFragment.moveBasePower && chosenFragment.moveBasePower > chosenFragment.pokemon.movePowers[this.dex.moves.get(chosenFragment.baseMove).name]) chosenFragment.pokemon.movePowers[this.dex.moves.get(chosenFragment.baseMove).name] = chosenFragment.moveBasePower;
					} else {
						if (chosenFragment.moveBasePower) chosenFragment.pokemon.movePowers[this.dex.moves.get(chosenFragment.baseMove).name] = chosenFragment.moveBasePower;
					}
				}
				if (chosenFragment[format].acceptedSupport) for (const request of chosenFragment[format].acceptedSupport) {
					if (!teamHighPrioRequestedSupport[request]) teamHighPrioRequestedSupport[request] = [];
					teamHighPrioRequestedSupport[request].push(chosenFragment.pokemon);
				}
				if (chosenFragment[format].requestedSupport) for (const request of chosenFragment[format].requestedSupport) {
					if (!teamHighPrioRequestedSupport[request]) teamHighPrioRequestedSupport[request] = [];
					teamHighPrioRequestedSupport[request].push(chosenFragment.pokemon);
				}
				chosenFragment.eligible = false;
			}
		}

		// Since we made it this far, we're officially done with fragments! Yay
		// Everything should be a lot simpler from here akjdfhg
		// However, it's very likely that, when we get to this point, a set will have fewer than 508 EVs defined -
		// even if it had fragments with EVs set, there's no guarantee that the combination of fragments totaled the exact right amount.
		// We might even be missing an item or a Tera Type!
		// The more set fragments I set up, the less this is going to matter; these are *just* the fallback!

		// Items require consideration for the whole team, because of item clause, so those will come later
		let itemsAlreadyUsed = [];
		let setsWithoutItems = [];

		// EVs and Tera Types only require consideration for the individual set
		for (const set of sets) {
			// failsafes
			if (!set.moves) set.moves = ["Protect"];
			if (
				set.moves.length < 4 && !set.moves.includes('Protect') &&
				this.dex.data.Learnsets[this.toID(set.species)].learnset.protect &&
				!(set.item && ['Choice Band', 'Choice Specs', 'Choice Scarf', 'Assault Vest'].includes(set.item)) &&
				!(set.ability && ['Gorilla Tactics'].includes(set.ability))
			) set.moves.push('Protect');
			
			// purely cosmetic: let's reorder the set's moves
			if (set.moves.length > 1) {
				
				// first, sort by set.movePowers if applicable
				let bpAltMoveOrder = [];
				let failsafe = false;
				while (bpAltMoveOrder.length < set.moves.length) {
					let maxMovePower = 'undefined';
					let movesCurrentStep = [];
					for (const move of set.moves) {
						if (bpAltMoveOrder.includes(this.dex.moves.get(move).name)) continue;
						let movePower = 0;
						if (set.movePowers[this.dex.moves.get(move).name]) movePower = set.movePowers[this.dex.moves.get(move).name];
						if (movePower > maxMovePower || maxMovePower === 'undefined') {
							// reset
							maxMovePower = movePower;
							movesCurrentStep = [];
						}
						if (movePower === maxMovePower) movesCurrentStep.push(this.dex.moves.get(move).name);
					}
					if (!movesCurrentStep.length) movesCurrentStep = set.moves;
					for (const move of movesCurrentStep) if (!bpAltMoveOrder.includes(this.dex.moves.get(move).name)) bpAltMoveOrder.push(this.dex.moves.get(move).name);
				}
				
				// then sort by priority
				let prioAltMoveOrder = [];
				failsafe = false;
				while (bpAltMoveOrder.length && (prioAltMoveOrder.length < set.moves.length)) {
					let maxMovePriority = 'undefined';
					let movesCurrentStep = [];
					for (const move of bpAltMoveOrder) {
						if (prioAltMoveOrder.includes(this.dex.moves.get(move).name)) continue;
						let movePriority = 0;
						if (this.dex.moves.get(move).priority) movePriority = this.dex.moves.get(move).priority;
						// exceptions:
						// most status moves go are pushed to the back
						if (this.dex.moves.get(move).category && this.dex.moves.get(move).category === 'Status') movePriority -=20;
						// but pivoting and self-KO moves go last
						if (this.dex.moves.get(move).selfSwitch || this.dex.moves.get(move).selfdestruct) movePriority = -40;
						if (movePriority > maxMovePriority || maxMovePriority === 'undefined') {
							// reset
							maxMovePriority = movePriority;
							movesCurrentStep = [];
						}
						if (movePriority === maxMovePriority) {
							movesCurrentStep.push(this.dex.moves.get(move).name);
						}
					}
					if (!movesCurrentStep.length) movesCurrentStep = bpAltMoveOrder;
					for (const move of movesCurrentStep) if (!prioAltMoveOrder.includes(this.dex.moves.get(move).name)) prioAltMoveOrder.push(this.dex.moves.get(move).name);
				}

				if (prioAltMoveOrder.length) set.moves = prioAltMoveOrder;
			}
			
			if (set.item) {
				itemsAlreadyUsed.push(set.item);
			} else {
				if (stage === 'LC' && format !== 'vgc') {
					// not respecting item clause for LC, and keeping it pretty simple
					// for LC, we want to do the item before EVs, not after

					// Choice Scarf is the most specific, so let's test several criteria and only run with it if we meet all of them
					let choiceScarf = true;
					
					// First: in vanilla LC, this is usually best if you're able to hit 14 or more Speed, since 21 outspeeds everything
					// In Evo specifically, you would need 18 for a Scarf to outspeed Uraxys, but that's silly;
					// I checked and 14 is still all you need for anything else
					let maxSpeed = Math.floor((Math.floor((2 * this.dex.species.get(set.species).baseStats.spe + 31 + 63) / 20) + 5) * 1.1);
					if (maxSpeed < 14 || maxSpeed >= 20) choiceScarf = false; // let's not Scarf anything that's already *that* fast...
					
					// let's also calculate how many EVs it takes to reach 14
					// working backwards from the formula... to have 14 Speed in LC with a positive nature, you need (2 * base stat) + 31 + (EVs/4) >= 160
					// or to do the same with a neutral nature, you need >= 180
					// so let's solve for EVs:
					let requiredEvsPositive = 4 * (129 - (2 * this.dex.species.get(set.species).baseStats.spe));
					let requiredEvsNeutral = 4 * (149 - (2 * this.dex.species.get(set.species).baseStats.spe));
					// we already checked if the max Speed was possible, but now we want to check if it's within the EV limit
					if (set.evs && (set.evs.hp + set.evs.atk + set.evs.def + set.evs.spa + set.evs.spd + requiredEvsPositive) > 508) choiceScarf = false;
					// if even a positive nature costs too many EVs, we can't do it!
					// (of course, if we don't have any EVs assigned, this one is fine)

					// with some exceptions, the only sets that can pull off a Choice Scarf have only attacking moves
					for (const move of set.moves) {
						if (!this.dex.moves.get(move)) continue;
						if (this.dex.moves.get(move).category === 'Status' && ![
							'Healing Wish', 'Lunar Dance', 'Memento', 'Parting Shot', 'Chilly Reception',
							'Trick', 'Switcheroo', 'Bestow',
							'Defog', 'Tidy Up',
							'Nature Power', 'Sleep Talk',
						].includes(move)) choiceScarf = false;
						if (['Fake Out', 'First Impression'].includes(move)) choiceScarf = false;
					}

					// okay... if choiceScarf is still an option, let's go for it!
					if (choiceScarf) {
						set.item = 'Choice Scarf';
						if (!set.evs) set.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
						if (set.evs && (set.evs.hp + set.evs.atk + set.evs.def + set.evs.spa + set.evs.spd + requiredEvsNeutral) > 508) {
							if (set.evs.spe < requiredEvsNeutral) set.evs.spe = requiredEvsNeutral;
							set.forceSpeedNeutral = true; // look I'm improvising okay
						} else {
							if (set.evs.spe < requiredEvsPositive) set.evs.spe = requiredEvsPositive;
							set.forceSpeedPositive = true;
						}
					} else if (
						// offensive role
						(set.roles.includes('physical') || set.roles.includes('special')) &&
						// base 49 HP or lower
						(this.dex.species.get(set.species) && this.dex.species.get(set.species).baseStats.hp <= 49) &&
						// not relying on bulk investment for other fragments
						!(set.evs && (set.evs.hp + set.evs.def + set.evs.spd) > 0)
					) set.item = 'Life Orb';
					else if (set.roles.includes('recovery') || set.ability === 'Regenerator') set.item = 'Eviolite';
					else set.item = 'Berry Juice';
				} else {
					setsWithoutItems.push(set);
				}
			}
			
			// EVs
			if (!set.evs) set.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
			let increment = 4;
			if (format === 'vgc') increment = 8;
			if (stage === 'LC') increment = 80;
			set.firstPoint = { hp: increment, atk: increment, def: increment, spa: increment, spd: increment, spe: increment };

			// quick thing: EVs should *always* be multiples of 4 at worst
			for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) if (set.evs[stat] % 4) set.evs[stat] -= set.evs[stat] % 4;
			
			let evsLeft = (508 - (set.evs.hp + set.evs.atk + set.evs.def + set.evs.spa + set.evs.spd + set.evs.spe));
			
			// first check: for VGC and LC, I need to account for the first point of each stat
			// hope I'm doing this right jsmdfg
			if (increment > 4) {
				let multiple = 1;
				if (increment === 80) multiple = 20; // for LC, we want each stat to be 5 more than a multiple of 20 (10 more for HP)
				else if (increment === 8) multiple = 2; // for VGC, we want each stat to be 5 more than a multiple of 2 (10 more for HP)
				
				let statsToFix = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
				let statsPool = [];
				
				// first, we'll subtract EVs that aren't doing anything for us
				for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
					if (!this.dex.species.get(set.species).baseStats[stat]) continue;
					let statValue = this.dex.species.get(set.species).baseStats[stat] * 2 + 31 + (set.evs[stat] / 4);
					let correction = 4 * (statValue % multiple);
					if (correction && set.evs[stat] > 0) {
						statsToFix[stat] = set.evs[stat] - correction + increment;
						set.evs[stat] -= correction;
						if (set.evs[stat] < 0) set.evs[stat] = 0;
					}
				}
				evsLeft = (508 - (set.evs.hp + set.evs.atk + set.evs.def + set.evs.spa + set.evs.spd + set.evs.spe));
				
				// then, we'll try to add them back one at a time, from lowest-commitment to highest
				for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
					if (statsToFix[stat] > 0 && !(statsToFix[stat] > evsLeft)) statsPool.push(stat);
				}
				while (statsPool.length) {
					let minStats = [];
					let minStat = null;
					for (const stat of statsPool) {
						if (!minStat || minStat > statsToFix[stat]) {
							// reset
							minStats = [];
							minStats.push(stat);
							minStat = statsToFix[stat];
						}
						else if (minStat === statsToFix[stat]) minStats.push(stat);
					}
					if (minStats.length && !(minStat > evsLeft)) { // if it's possible to increment any of the stats...
						let chosenStat = this.sample(minStats);
						set.evs[chosenStat] += statsToFix[chosenStat];
						evsLeft -= statsToFix[chosenStat];
						statsPool = statsPool.filter(stat => stat !== chosenStat);
					} else {
						statsPool = [];
					}
				}

				// finally, if any stat still has 0 investment, let's store a number for it to use for its first point of investment later
				for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
					if (set.evs[stat] <= 0) {
						if (!this.dex.species.get(set.species).baseStats[stat]) continue;
						let statValue = this.dex.species.get(set.species).baseStats[stat] * 2 + 31;
						let correction = 4 * (statValue % multiple);
						if (correction) set.firstPoint[stat] -= correction;
					}
				}
			}

			evsLeft = (508 - (set.evs.hp + set.evs.atk + set.evs.def + set.evs.spa + set.evs.spd + set.evs.spe));
			if ((evsLeft >= increment) && (set.roles && (set.roles.includes('physical') || set.roles.includes('special')))) {
				// second check: offenses
				// be ready to make an exception for this.dex.moves.get(move).overrideOffensiveStat though
				// we *probably* want these to be as high as we can get in that case
				// if it has one of those roles, this Pokémon functions offensively, so we probably care about at least one of its attacking stats!
				// however, it's possible to have the role 'physical' and actually be running Body Press, or the role 'special' and actually be running Wallow, for example
				// so we should double-check which of our offenses we're actually using:
				let statsPool = [];
				for (const move of set.moves) {
					if (set.roles.includes('physical') && this.dex.moves.get(move).category === 'Physical' && move !== 'Foul Play') {
						if (this.dex.moves.get(move).overrideOffensiveStat) {
							if (!statsPool.includes(this.dex.moves.get(move).overrideOffensiveStat)) statsPool.push(this.dex.moves.get(move).overrideOffensiveStat);
						} else {
							if (!statsPool.includes('atk')) statsPool.push('atk');
						}
					} else if (set.roles.includes('special') && this.dex.moves.get(move).category === 'Special') {
						if (this.dex.moves.get(move).overrideOffensiveStat) {
							if (!statsPool.includes(this.dex.moves.get(move).overrideOffensiveStat)) statsPool.push(this.dex.moves.get(move).overrideOffensiveStat);
						} else {
							if (!statsPool.includes('spa')) statsPool.push('spa');
						}
					}
				}
				// let's not worry about stats that can't increase any more!
				if (statsPool.length) statsPool = statsPool.filter(stat => (set.evs[stat] + increment <= 252));
				
				// first point time
				if (statsPool.length) {
					for (const stat of statsPool) {
						// these are all worth investing in
						if (set.evs[stat] === 0 && set.firstPoint[stat] <= evsLeft) {
							set.evs[stat] = set.firstPoint[stat];
							evsLeft -= set.firstPoint[stat];
						}
					}
				}
				
				while (statsPool.length && evsLeft >= increment && ((set.evs['atk'] + increment <= 252) && (set.evs['spa'] + increment <= 252))) {
					// Now that we have our list of relevant "offensive" stats, we should calculate which one is the lowest, then increment it, then repeat
					// To be honest, this was an arbitrary call, but... thinking about mixed attackers, they usually do 252 to their lower offense and 4 to their higher one, right?
					// so I decided to stop when either Attack or Sp. Atk hits 252 EVs, since the "first point" was just assigned
					// This is only applicable to the fallback anyway, of course - if an earlier fragment gave a meaningful benchmark for one of those, that will have taken priority!
					// That said, I'm actually *not* going to apply the same cap to Defense and Sp. Def -
					// there's really nothing wrong with 252 Def / 252 SpA for, like, Body Press/Meteor Beam or something, you know?

					let minStats = [];
					let minStat = null;
					for (const stat of statsPool) {
						// figuring out which one is lowest is easy here because we don't have HP
						if (!this.dex.species.get(set.species).baseStats[stat]) continue;
						// we don't need to worry about the increments for this particular calculation
						let statValue = ((this.dex.species.get(set.species).baseStats[stat] * 2 + 36 + (set.evs[stat]/4)));
						if (!minStat || minStat > statValue) {
							// reset
							minStats = [];
							minStats.push(stat);
							minStat = statValue;
						}
						else if (minStat === statValue) minStats.push(stat);
					}
					if (minStats.length) {
						let chosenStat = this.sample(minStats);
						set.evs[chosenStat] += increment;
						evsLeft -= increment;
						statsPool = statsPool.filter(stat => (set.evs[stat] + increment <= 252));
					} else {
						statsPool = [];
					}
				}
			}

			// second check: Speed
			// if you *can* afford to max Speed, and you have an offensive role, you'll try to go all the way to the max;
			// if you don't have room to max Speed, presumably you've Speed-crept what you could through your fragments, so we'll skip modifying Speed and jump to bulk!
			if ((evsLeft >= increment || (set.evs.spe === 0 && evsLeft >= set.firstPoint.spe)) && set.roles && !set.roles.includes('minspeed') && (set.roles.includes('physical') || set.roles.includes('special'))) {
				if (set.evs.spe === 0 && set.firstPoint.spe <= evsLeft && evsLeft >= (252 - increment + 1)) {
					set.evs.spe = set.firstPoint.spe;
					evsLeft -= set.firstPoint.spe;
				}
				while ((set.evs.spe + evsLeft >= (252 - increment + 1)) && (set.evs.spe + increment <= 252)) { // only if you can increment Speed more *and* doing so will eventually hit your max Speed
					set.evs.spe += increment;
					evsLeft -= increment;
				}
			}

			// third check: HP
			if (
				stage === 'LC' && set.item && set.item === 'Life Orb' && (set.evs.hp + set.evs.def + set.evs.spd === 0) &&
				this.dex.species.get(set.species) && this.dex.species.get(set.species).baseStats.hp <= 49
			) {
				// edge case: Life Orb holders in LC that don't already have bulk investment want exactly 19 HP, if possible
				if (!set.ivs) set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
				let targetHp = 99 - 2 * this.dex.species.get(set.species).baseStats.hp; // yay math
				if (set.ivs.hp > targetHp) set.ivs.hp = targetHp;
			} else {
				// ideally, I want to set up fragments to optimize HP-to-defense ratios where there are specific benchmarks involved,
				// but I think where there *aren't* any benchmarks, it's better to just prioritize HP in most cases
				if (set.evs.hp === 0 && set.firstPoint.hp <= evsLeft) {
					set.evs.hp = set.firstPoint.hp;
					evsLeft -= set.firstPoint.hp;
				}
				while ((evsLeft >= increment) && (set.evs.hp + increment <= 252)) {
					set.evs.hp += increment;
					evsLeft -= increment;
				}
			}
			
			// final check: defenses
			// I *think* we'll just keep raising whichever one is lowest by 4 at a time
			for (const stat of ['def', 'spd']) {
				if (set.evs[stat] === 0 && set.firstPoint[stat] <= evsLeft) {
					set.evs[stat] = set.firstPoint[stat];
					evsLeft -= set.firstPoint[stat];
				}
			}
			while (evsLeft >= increment) {
				let defense = (this.dex.species.get(set.species).baseStats.def * 2 + 36 + (set.evs.def/4));
				let spdef = (this.dex.species.get(set.species).baseStats.spd * 2 + 36 + (set.evs.spd/4));
				if (spdef > defense && (set.evs['def'] + increment <= 252)) {
					set.evs['def'] += increment;
					evsLeft -= increment;
				} else if (set.evs['spd'] + increment <= 252) {
					set.evs['spd'] += increment;
					evsLeft -= increment;
				} else evsLeft = 0;
			}
			
			// EVs should always be done now!
			// and that gives us enough information to decide our nature, too
			if (!set.nature) {
				set.nature = '';
				let boostedStat = null;
				let loweredStat = null;
				
				// figuring out the best stat for the nature to raise
				if (set.forceSpeedPositive) boostedStat = 'spe';
				else if (set.evs.spe + increment > 252 && !set.forceSpeedNeutral) boostedStat = 'spe';
				else {
					let maxStats = [];
					let maxStat = null;
					for (const stat of ['atk', 'def', 'spa', 'spd']) {
						if (!this.dex.species.get(set.species).baseStats[stat]) continue;
						let statValue = ((this.dex.species.get(set.species).baseStats[stat] * 2 + 36 + (set.evs[stat]/4)));
						if (!maxStat || maxStat < statValue) {
							// reset
							maxStats = [];
							maxStats.push(stat);
							maxStat = statValue;
						}
						else if (maxStat === statValue) maxStats.push(stat);
					}
					if (maxStats.length) boostedStat = this.sample(maxStats);
				}

				// figuring out a safe dump stat for the nature
				let attackingStats = [];
				for (const move of set.moves) {
					if (this.dex.moves.get(move).category === 'Physical' && move !== 'Foul Play') {
						if (this.dex.moves.get(move).overrideOffensiveStat) {
							if (!attackingStats.includes(this.dex.moves.get(move).overrideOffensiveStat)) attackingStats.push(this.dex.moves.get(move).overrideOffensiveStat);
						} else {
							if (!attackingStats.includes('atk')) attackingStats.push('atk');
						}
					} else if (this.dex.moves.get(move).category === 'Special') {
						if (this.dex.moves.get(move).overrideOffensiveStat) {
							if (!attackingStats.includes(this.dex.moves.get(move).overrideOffensiveStat)) attackingStats.push(this.dex.moves.get(move).overrideOffensiveStat);
						} else {
							if (!attackingStats.includes('spa')) attackingStats.push('spa');
						}
					}
				}
				if (set.roles && set.roles.includes('minspeed')) loweredStat = 'spe';
				else if (!attackingStats.includes('atk')) loweredStat = 'atk';
				else if (!attackingStats.includes('spa')) loweredStat = 'spa';
				else if (set.evs.spe === 0) loweredStat = 'spe';
				else if (set.evs.atk === 0 && !(set.roles && set.roles.includes('physical'))) loweredStat = 'atk';
				else if (boostedStat === 'spd') loweredStat = 'def';
				else loweredStat = 'spd';

				if (boostedStat === 'atk') {
					if (loweredStat === 'def') set.nature = 'Lonely';
					else if (loweredStat === 'spa') set.nature = 'Adamant';
					else if (loweredStat === 'spd') set.nature = 'Naughty';
					else if (loweredStat === 'spe') set.nature = 'Brave';
				} else if (boostedStat === 'def') {
					if (loweredStat === 'atk') set.nature = 'Bold';
					else if (loweredStat === 'spa') set.nature = 'Impish';
					else if (loweredStat === 'spd') set.nature = 'Lax';
					else if (loweredStat === 'spe') set.nature = 'Relaxed';
				} else if (boostedStat === 'spa') {
					if (loweredStat === 'atk') set.nature = 'Modest';
					else if (loweredStat === 'def') set.nature = 'Mild';
					else if (loweredStat === 'spd') set.nature = 'Rash';
					else if (loweredStat === 'spe') set.nature = 'Quiet';
				} else if (boostedStat === 'spd') {
					if (loweredStat === 'atk') set.nature = 'Calm';
					else if (loweredStat === 'def') set.nature = 'Gentle';
					else if (loweredStat === 'spa') set.nature = 'Careful';
					else if (loweredStat === 'spe') set.nature = 'Sassy';
				} else if (boostedStat === 'spe') {
					if (loweredStat === 'atk') set.nature = 'Timid';
					else if (loweredStat === 'def') set.nature = 'Hasty';
					else if (loweredStat === 'spa') set.nature = 'Jolly';
					else if (loweredStat === 'spd') set.nature = 'Naive';
				}

				// setting 0 IVs for certain stats
				if (!set.ivs) set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
				if (set.roles && set.roles.includes('minspeed')) set.ivs.spe = 0;
				if (
					!attackingStats.includes('atk') &&
					!set.moves.includes('Assist') && !set.moves.includes('Copycat') && !set.moves.includes('Me First') &&
					!set.moves.includes('Metronome') && !set.moves.includes('Mirror Move')
				) set.ivs.atk = 0; // don't minimize Attack if you could potentially call a physical move (:

				// okay and one more thing:
				// some items will want to calculate exact stats, but it's way easier if I do that here because I still have natures stored
				set.exactStats = {
					hp: Math.floor(
						(this.dex.species.get(set.species).baseStats.hp * 2 + set.ivs.hp + set.evs.hp/4) * (setLevel / 100) + setLevel + 10
					),
					atk: Math.floor(
						Math.floor(
							(this.dex.species.get(set.species).baseStats.atk * 2 + set.ivs.atk + set.evs.atk/4) * (setLevel / 100) + 5
						) * (boostedStat === 'atk' ? 1.1 : ((loweredStat === 'atk' ? 0.9 : 1)))
					),
					def: Math.floor(
						Math.floor(
							(this.dex.species.get(set.species).baseStats.def * 2 + set.ivs.def + set.evs.def/4) * (setLevel / 100) + 5
						) * (boostedStat === 'def' ? 1.1 : ((loweredStat === 'def' ? 0.9 : 1)))
					),
					spa: Math.floor(
						Math.floor(
							(this.dex.species.get(set.species).baseStats.spa * 2 + set.ivs.spa + set.evs.spa/4) * (setLevel / 100) + 5
						) * (boostedStat === 'spa' ? 1.1 : ((loweredStat === 'spa' ? 0.9 : 1)))
					),
					spd: Math.floor(
						Math.floor(
							(this.dex.species.get(set.species).baseStats.spd * 2 + set.ivs.spd + set.evs.spd/4) * (setLevel / 100) + 5
						) * (boostedStat === 'spd' ? 1.1 : ((loweredStat === 'spd' ? 0.9 : 1)))
					),
					spe: Math.floor(
						Math.floor(
							(this.dex.species.get(set.species).baseStats.spe * 2 + set.ivs.spe + set.evs.spe/4) * (setLevel / 100) + 5
						) * (boostedStat === 'spe' ? 1.1 : ((loweredStat === 'spe' ? 0.9 : 1)))
					),
				};
				console.log(set.exactStats);
			}

			if (!set.ability) set.ability = this.dex.species.get(set.species).abilities[0];
			
			// Tera Types
			if (!set.teraType) {
				// first, we should score every type
				let validTeraTypes = [
					'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
					'Steel', 'Fairy', 'Normal',
				];
				let teraTypes = {
					Fire: 0,
					Water: 0,
					Electric: 0,
					Grass: 0,
					Ice: 0,
					Fighting: 0,
					Poison: 0,
					Ground: 0,
					Flying: 0,
					Psychic: 0,
					Bug: 0,
					Rock: 0,
					Ghost: 0,
					Dragon: 0,
					Dark: 0,
					Steel: 0,
					Fairy: 0,
					Normal: 0,
				};
				let stellarCount = [];
				
				if (set.ability !== 'Normalize') {
					for (const move of set.moves) {
						const moveData = this.dex.moves.get(move);
						// - moves on the set that can get the boost to 60 BP from Tera
						if (
							moveData.basePower && !(moveData.basePower >= 60 || (moveData.basePower >= 40 && set.ability === 'Technician') || moveData.basePower <= 1) &&
							!(moveData.priority && moveData.priority > 0) && !moveData.multihit &&
							!['Hidden Power', 'Judgment', 'Multi-Attack', 'Natural Gift', 'Revelation Dance', 'Struggle', 'Techno Blast', 'Terrain Pulse', 'Weather Ball'].includes(moveData.name)
						) teraTypes[moveData.type]++;
						
						// - moves on the set that aren't already STAB
						if (moveData.category !== 'Status' && !this.dex.species.get(set.species).types.includes(moveData.type)) {
							if (!['Hidden Power', 'Judgment', 'Multi-Attack', 'Natural Gift', 'Revelation Dance', 'Struggle', 'Techno Blast', 'Terrain Pulse', 'Weather Ball'].includes(moveData.name)) teraTypes[moveData.type] += 2;
							if (!stellarCount.includes(moveData.type)) stellarCount.push(moveData.type);
						}
					}
					if (['Refrigerate', 'Aerilate', 'Pixilate', 'Galvanize', 'Dragonize'].includes(set.ability)) teraTypes.Normal = 0;
				}

				if (this.dex.species.get(set.species).randbats) {
					// - types that complement the Pokémon's defensive profile:
					for (const teraType of validTeraTypes) {
						for (const checkType of validTeraTypes) {
							// - this mostly means resistances to the Pokémon's weaknesses...
							if (
								this.dex.species.get(set.species).randbats.weaknesses[checkType] &&
								!(this.dex.species.get(set.species).randbats.resistances[checkType] && (
									this.dex.species.get(set.species).randbats.resistances[checkType] === 'true' ||
									(this.dex.species.get(set.species).randbats.resistances[checkType].Ability && this.dex.species.get(set.species).randbats.resistances[checkType].Ability.includes(set.ability))
								)) &&
								!(this.dex.species.get(set.species).randbats.immunities[checkType] && (
									this.dex.species.get(set.species).randbats.immunities[checkType] === 'true' ||
									(this.dex.species.get(set.species).randbats.immunities[checkType].Ability && this.dex.species.get(set.species).randbats.immunities[checkType].Ability.includes(set.ability))
								))
							) {
								if (this.dex.data.TypeChart[teraType.toLowerCase()].damageTaken[checkType] >= 2) { // the Tera Type has a resistance or immunity
									teraTypes[teraType]++;
								}
								if (this.dex.data.TypeChart[teraType.toLowerCase()].damageTaken[checkType] === 1) { // the Tera Type is also weak to the type
									teraTypes[teraType]--;
								}
							}
							// - ... but it also helps if the Pokémon has an immunity or resistance Ability that cancels out one of the new type's weaknesses
							if (
								(this.dex.species.get(set.species).randbats.immunities[checkType] && this.dex.species.get(set.species).randbats.immunities[checkType].Ability && this.dex.species.get(set.species).randbats.immunities[checkType].Ability.includes(set.ability)) ||
								(this.dex.species.get(set.species).randbats.resistances[checkType] && this.dex.species.get(set.species).randbats.resistances[checkType].Ability && this.dex.species.get(set.species).randbats.resistances[checkType].Ability.includes(set.ability))
							) {
								if (this.dex.data.TypeChart[teraType.toLowerCase()].damageTaken[checkType] === 1) { // the Tera Type has a weakness
									teraTypes[teraType] += 2;
								}
							}
						}
					}
				}

				// - types with utility the set is requesting: Fire for preventing burns, Grass for preventing redirection, Ghost for preventing Fake Out, etc.
				if (set.roles) {
					// nothing for now
				}
				
				// we want to make sure this is pretty random-feeling, so... I'm leaning towards allowing for the second-highest score as well as the highest?
				let maxScore = 0;
				for (const type of validTeraTypes) if (teraTypes[type] > maxScore) maxScore = teraTypes[type];
				if (validTeraTypes.filter((type) => (teraTypes[type] && teraTypes[type] >= (maxScore -1) && teraTypes[type] > 0)).length) validTeraTypes = validTeraTypes.filter((type) => (teraTypes[type] && teraTypes[type] >= (maxScore -1) && teraTypes[type] > 0));
				if (stellarCount.length && stellarCount.length > 3) validTeraTypes.push('Stellar');
				set.teraType = this.sample(validTeraTypes);
			}
			if (!set.happiness && set.hasBeenRandomized) set.happiness = 255;
			if (set.hasBeenRandomized) set.level = setLevel;
			if (!set.shiny && set.hasBeenRandomized) set.shiny = shiny; // clarifying: shiny is a variable we defined earlier, not the string "shiny"
		}
		if (setsWithoutItems.length) {
			// now we get to assign items to the remaining team members!
			// in theory, item clause only needs to be enforced at all for VGC;
			// however, *from this step on,* I'm also going to enforce it for singles!
			// that's because if we've made it this far, the set doesn't strictly need its item to function,
			// so even in singles, it's fine to prioritize spicing things up and having fun with it!
			
			for (const set of setsWithoutItems) {
				set.possibleItems = {
					currentStep: [],
					tier0: [],
					tier1: [],
					tier2: [],
					tier3: [],
					tier4: [],
				};
				
				// push possible items to each tier
				// tier 0 - extremely context-specific items
				let pushItems = [];
				let critMoves = 0;
				let whiteHerb = false;
				let defBoost = false;
				let overrideOffenseWithDefense = false;
				let spdBoost = false;
				let overrideOffenseWithSpDef = false;
				for (const move of set.moves) {
					let moveData = this.dex.moves.get(move);
					if (moveData) {
						if (moveData.flags['sound'] && set.roles.includes('special') && !moveData.selfSwitch) pushItems.push('Throat Spray');
						if (format === 'singles' && moveData.volatileStatus && moveData.volatileStatus === 'partiallytrapped') pushItems.push('Binding Band');
						if (format === 'singles' && moveData.volatileStatus && moveData.volatileStatus === 'entanglement') {
							pushItems.push('Binding Band');
							pushItems.push('Shed Shell');
						}
						if (moveData.accuracy && (moveData.accuracy !== true) && moveData.accuracy <= 50 && set.ability !== 'No Guard') pushItems.push('Blunder Policy');
						if (moveData.multihit) {
							if (moveData.multiaccuracy) pushItems.push('Wide Lens');
							else if (Array.isArray(moveData.multihit)) pushItems.push('Loaded Dice');
							
							if (moveData.flags['contact']) {
								if (moveData.flags['punch']) pushItems.push('Punching Glove');
								else if (moveData.multihit === 10) pushItems.push('Protective Pads');
							}
						}
						if (moveData.flags['charge'] && !['Electro Shot', 'Solar Beam', 'Solar Blade'].includes(moveData.name)) pushItems.push('Power Herb');
						if (moveData.critRatio && moveData.critRatio === 2) critMoves++;
						if (moveData.selfdestruct && moveData.selfdestruct === 'always') pushItems.push('Custap Berry');
						if (moveData.self && moveData.self.boosts) {
							for (const boost in moveData.self.boosts) if (moveData.self.boosts[boost] < 0) whiteHerb = true;
							if (moveData.self.boosts.def && moveData.self.boosts.def > 0) defBoost = true;
							if (moveData.self.boosts.spd && moveData.self.boosts.spd > 0) spdBoost = true;
						}
						if (moveData.secondary && moveData.secondary.self && moveData.secondary.self.boosts) {
							for (const boost in moveData.secondary.self.boosts) if (moveData.secondary.self.boosts[boost] < 0) whiteHerb = true;
							if (moveData.secondary.self.boosts.def && moveData.secondary.self.boosts.def > 0) defBoost = true;
							if (moveData.secondary.self.boosts.spd && moveData.secondary.self.boosts.spd > 0) spdBoost = true;
						}
						if (moveData.overrideOffensiveStat) {
							if (moveData.overrideOffensiveStat === 'def') overrideOffenseWithDefense = true;
							if (moveData.overrideOffensiveStat === 'spd') overrideOffenseWithSpDef = true;
						}
						if (
							(moveData.sideCondition && ['reflect', 'lightscreen', 'auroraveil'].includes(moveData.sideCondition)) ||
							(moveData.self && moveData.self.sideCondition && ['reflect', 'lightscreen', 'auroraveil'].includes(moveData.self.sideCondition))
						) pushItems.push('Light Clay');
					}
				}
				if (whiteHerb && set.ability !== 'Contrary') {
					pushItems.push('White Herb');
					if (
						!set.roles.includes('pivoting') && !set.roles.includes('setup') && !set.roles.includes('redirection') &&
						!(format === 'vgc' && !set.roles.includes('physical'))
					) pushItems.push('Eject Pack');
				}
				if (set.roles.includes('physical') && ((set.ability === 'Intimidate' && format === 'vgc') || set.moves.includes('Swagger'))) pushItems.push('Mirror Herb');
				if (
					(set.roles.includes('physical') && set.ability === 'Guts') ||
					(!set.roles.includes('physical') && set.ability === 'Quick Feet') ||
					(set.roles.includes('special') && set.ability === 'Flare Boost') ||
					set.ability === 'Marvel Scale'
				) pushItems.push('Flame Orb');
				if (
					set.roles.includes('physical') && ['Guts', 'Toxic Boost', 'Quick Feet'].includes(set.ability)
				) pushItems.push('Toxic Orb');
				if ((set.ability === 'Sturdy' || set.moves.includes('Endure')) && format === 'singles') {
					if (set.roles.includes('entryhazard')) pushItems.push('Custap Berry');
					if (!set.roles.includes('speedsetup')) pushItems.push('Salac Berry');
					if (set.roles.includes('speedsetup') || set.roles.includes('priority')) {
						if (set.roles.includes('physical')) pushItems.push('Liechi Berry');
						if (set.roles.includes('special')) pushItems.push('Petaya Berry');
					} else {
						pushItems.push('Red Card');
					}
				}
				if (set.moves.includes('Endeavor')) pushItems.push('Custap Berry');
				if (['Defiant', 'Guard Dog', 'Competitive'].includes(set.ability) && set.evs.spe > 0 && format === 'vgc') pushItems.push('Adrenaline Orb');
				if (set.ability === 'Unburden' && set.moves.includes('Fake Out')) pushItems.push('Normal Gem');
				if (critMoves > 1) {
					pushItems.push('Scope Lens');
					pushItems.push('Razor Claw');
				}
				if (set.moves.includes('Fling')) { // why would you have this assigned and not already have an item jsmdfg
					if (
						this.dex.species.get(set.species) && this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.types.includes('Dark')
					) pushItems.push('Iron Ball');
					else pushItems.push('Light Ball');
				}
				if (set.moves.includes('Trick') || set.moves.includes('Switcheroo')) { // same as above--
					if (set.ability === 'Magic Guard') pushItems.push('Sticky Barb');
					else if (set.ability === 'Prankster') pushItems.push('Eject Button');
					else {
						pushItems.push('Ring Target');
						pushItems.push('Iron Ball');
						pushItems.push('Lagging Tail');
					}
				}
				// Terrain seeds: they can be useful on pretty much anything,
				// but it's even better if they go to a Pokémon that can make proper use of the defensive boost or one with Unburden, so we'll prioritize those
				if (teamOfferedSupport.electricterrain) {
					if (overrideOffenseWithDefense || spdBoost || set.ability === 'Unburden') pushItems.push('Electric Seed');
					else set.possibleItems.tier2.push('Electric Seed');
				}
				if (teamOfferedSupport.grassyterrain) {
					if (overrideOffenseWithDefense || spdBoost || set.ability === 'Unburden') pushItems.push('Grassy Seed');
					else set.possibleItems.tier2.push('Grassy Seed');
				}
				if (teamOfferedSupport.mistyterrain) {
					if (overrideOffenseWithSpDef || defBoost || set.ability === 'Unburden') pushItems.push('Misty Seed');
					else set.possibleItems.tier2.push('Misty Seed');
				}
				if (teamOfferedSupport.psychicterrain) {
					if (overrideOffenseWithSpDef || defBoost || set.ability === 'Unburden') pushItems.push('Psychic Seed');
					else set.possibleItems.tier2.push('Psychic Seed');
				}
				// field effect extenders: top priority goes to manual setters if there are any, but they're also useful on autosetters
				if (
					set.moves.includes('Electric Terrain') || set.moves.includes('Grassy Terrain') || set.moves.includes('Misty Terrain') || set.moves.includes('Psychic Terrain')
				) {
					pushItems.push('Terrain Extender');
				} else if (
					set.roles.includes('electricterrain') || set.roles.includes('grassyterrain') || set.roles.includes('mistyterrain') || set.roles.includes('psychicterrain') ||
					set.roles.includes('backupelectricterrain') || set.roles.includes('backupgrassyterrain') || set.roles.includes('backupmistyterrain') || set.roles.includes('backuppsychicterrain')
				) {
					set.possibleItems.tier2.push('Terrain Extender');
				}
				if (set.moves.includes('Sunny Day')) {
					pushItems.push('Heat Rock');
				} else if (set.roles.includes('sun') || set.roles.includes('backupsun')) {
					set.possibleItems.tier2.push('Heat Rock');
				}
				if (set.moves.includes('Rain Dance')) {
					pushItems.push('Damp Rock');
				} else if (set.roles.includes('rain') || set.roles.includes('backuprain')) {
					set.possibleItems.tier2.push('Damp Rock');
				}
				if (set.moves.includes('Sandstorm')) {
					pushItems.push('Smooth Rock');
				} else if (set.roles.includes('sand') || set.roles.includes('backupsand')) {
					set.possibleItems.tier2.push('Smooth Rock');
				}
				if (set.moves.includes('Snowscape') || set.moves.includes('Hail')) { // Chilly Reception does not imply a need for this
					pushItems.push('Icy Rock');
				} else if (set.roles.includes('snow') || set.roles.includes('backupsnow')) {
					set.possibleItems.tier2.push('Icy Rock');
				}
				// species-specific items
				if (this.dex.species.get(set.species).evos) set.possibleItems.tier0.push('Eviolite');
				// ... actually yeah that's the only one I guess
				// it doesn't feel correct at all to push for something like Soul Dew on Latios and Latias,
				// and something like Thick Club is more likely to be outright guaranteed by an earlier fragment
				// so I guess it's just Eviolite?
				for (const item of pushItems) if (!set.possibleItems.tier0.includes(item)) set.possibleItems.tier0.push(item);

				// this section was going to be tier 1 at first, but they ended up a bit more spread out
				// these items are mostly based on type matchups!
				if (this.dex.species.get(set.species) && this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.weaknesses) {
					// actually, resist Berries are more fun in some situations than others, so I'm putting them in tiers all over the place
					const resistBerryTypes = [
						'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
						'Steel', 'Fairy',
					];
					for (const berryType of resistBerryTypes) {
						let itemTier = 'tier2'; // start out at tier 2
						let eligible = false;
						if (!this.dex.species.get(set.species).randbats.weaknesses[berryType]) continue;
						// if it's one of your weaknesses...
						for (const coverageType of resistBerryTypes) {
							if (!set.attackingTypes[coverageType]) continue; // and you have a coverage type...
							// (... preferably not just one of your STABs...)
							if (this.dex.species.get(set.species).randbats.types.includes[coverageType]) itemTier = 'tier3';
							if (this.dex.data.TypeChart[berryType.toLowerCase()].damageTaken[coverageType] === 1) eligible = true; // that can hit it for SE
						}
						if (berryType === 'Dark') eligible = true; // ... or I guess if it's just a Dark weakness, because Colbur for Knock is kinda always viable
						if (eligible) {
							// give them a boost if your Tera Type is also weak to it
							if (this.dex.data.TypeChart[(set.teraType).toLowerCase()].damageTaken[berryType] === 1) itemTier = 'tier1';
							// and favor them a lot more in monotype!
							if (monotype && (this.dex.data.TypeChart[monotype.toLowerCase()].damageTaken[berryType] === 1)) itemTier = 'tier0';

							if (berryType === 'Fire') set.possibleItems[itemTier].push('Occa Berry');
							if (berryType === 'Water') set.possibleItems[itemTier].push('Passho Berry');
							if (berryType === 'Electric') set.possibleItems[itemTier].push('Wacan Berry');
							if (berryType === 'Grass') set.possibleItems[itemTier].push('Rindo Berry');
							if (berryType === 'Ice') set.possibleItems[itemTier].push('Yache Berry');
							if (berryType === 'Fighting') set.possibleItems[itemTier].push('Chople Berry');
							if (berryType === 'Poison') set.possibleItems[itemTier].push('Kebia Berry');
							if (berryType === 'Ground') set.possibleItems[itemTier].push('Shuca Berry');
							if (berryType === 'Flying') set.possibleItems[itemTier].push('Coba Berry');
							if (berryType === 'Psychic') set.possibleItems[itemTier].push('Payapa Berry');
							if (berryType === 'Bug') set.possibleItems[itemTier].push('Tanga Berry');
							if (berryType === 'Rock') set.possibleItems[itemTier].push('Charti Berry');
							if (berryType === 'Ghost') set.possibleItems[itemTier].push('Kasib Berry');
							if (berryType === 'Dragon') set.possibleItems[itemTier].push('Haban Berry');
							if (berryType === 'Dark') set.possibleItems[itemTier].push('Colbur Berry');
							if (berryType === 'Steel') set.possibleItems[itemTier].push('Babiri Berry');
							if (berryType === 'Fairy') set.possibleItems[itemTier].push('Roseli Berry');
						}
					}
					// Air Balloon
					if (
						this.dex.species.get(set.species).randbats.weaknesses.Ground &&
						!(this.dex.species.get(set.species).randbats.immunities.Ground && !(this.dex.species.get(set.species).randbats.immunities.Ground.Ability || this.dex.species.get(set.species).randbats.immunities.Ground.Ability.includes(set.ability))) &&
						(this.dex.species.get(set.species).randbats.resistances.Rock || ['Magic Guard', 'Regenerator'].includes(set.ability))
					) {
						set.possibleItems.tier2.push('Air Balloon');
					} else if (set.species === 'Rotom-Fan') set.possibleItems.tier2.push('Air Balloon'); // ONLY SOMETIMES but it's funny
					// Utility Umbrella I guess???
					if (
						teamOfferedSupport.rain && !teamRequestedSupport.rain.includes(set) && !set.roles.includes('rain') && !set.roles.includes('backuprain') && !(
							this.dex.species.get(set.species).randbats.resistances.Water === 'true' ||
							(this.dex.species.get(set.species).randbats.resistances.Water.Ability && this.dex.species.get(set.species).randbats.resistances.Water.Ability.includes(set.ability))
						)
					) {
						if (set.moves.includes('Synthesis') || set.moves.includes('Morning Sun') || set.moves.includes('Moonlight')) set.possibleItems.tier0.push('Utility Umbrella');
						else set.possibleItems.tier2.push('Utility Umbrella');
					} else if (
						teamOfferedSupport.sun && !teamRequestedSupport.sun.includes(set) && !set.roles.includes('sun') && !set.roles.includes('backupsun') && !(
							this.dex.species.get(set.species).randbats.resistances.Fire === 'true' ||
							(this.dex.species.get(set.species).randbats.resistances.Fire.Ability && this.dex.species.get(set.species).randbats.resistances.Fire.Ability.includes(set.ability))
						)
					) {
						set.possibleItems.tier2.push('Utility Umbrella');
					}
					// Absorb Bulb and Cell Battery
					// For these, you want to resist the type, but *not* be immune to it
					// Absorb Bulb also wants to be a special attacker, and Cell Battery wants to be a physical attacker
					// // In VGC, resisting the type isn't as important, but Cell Battery holders ideally want to be para-immune
					// // In VGC, you want a teammate that can side-proc the item
					// (disregarding Snowball and Luminous Moss for now)

					// Weakness Policy
					// // In VGC, again, you want a teammate that can side-proc the item
					// // In singles, you want high bulk, an offensive role, and Speed-boosting capability
				}
				// Room Service is... specific enough to be interesting, but not strong enough to be a top priority,
				// so I guess I'll also make it tier 1 for now and see how that feels?
				if (format === 'vgc' && teamOfferedSupport.trickroom) {
					if (set.exactStats.spe / 1.5 < 80 && set.exactStats.spe > 80) set.possibleItems.tier1.push('Room Service');
				}

				// tier 2 - generic, good items; most likely to pull from here in general
				// Leftovers / Black Sludge
				if (format === 'singles') {
					if (this.dex.species.get(set.species) && this.dex.species.get(set.species).types.includes('Poison')) set.possibleItems.tier2.push('Black Sludge');
					else set.possibleItems.tier2.push('Leftovers');
				}
				// Sitrus / pinch berries on bulky users
				if (format === 'vgc' && (set.evs.hp + set.evs.def + set.evs.spd) > 340) {
					if (!['Bold', 'Modest', 'Calm', 'Timid'].includes(set.nature)) set.possibleItems.tier2.push('Figy Berry');
					if (!['Lonely', 'Mild', 'Gentle', 'Hasty'].includes(set.nature)) set.possibleItems.tier2.push('Iapapa Berry');
					if (!['Adamant', 'Impish', 'Careful', 'Jolly'].includes(set.nature)) set.possibleItems.tier2.push('Wiki Berry');
					if (!['Naughty', 'Lax', 'Rash', 'Naive'].includes(set.nature)) set.possibleItems.tier2.push('Aguav Berry');
					if (!['Brave', 'Relaxed', 'Quiet', 'Sassy'].includes(set.nature)) set.possibleItems.tier2.push('Mago Berry');
				}
				// Assault Vest and Choice items
				let statusMoveCount = 0;
				let drainMoveCount = 0;
				let choiceItem = true;
				for (const move of set.moves) {
					if (!this.dex.moves.get(move)) continue;
					if (this.dex.moves.get(move).category === 'Status' && move !== 'Me First') statusMoveCount++;
					if (this.dex.moves.get(move).drain) drainMoveCount++;
					if (this.dex.moves.get(move).category === 'Status' && ![
						'Healing Wish', 'Lunar Dance', 'Memento', 'Parting Shot', 'Chilly Reception',
						'Trick', 'Switcheroo', 'Bestow',
						'Defog', 'Tidy Up',
						'Nature Power', 'Sleep Talk',
					].includes(move)) choiceItem = false;
					if (['Fake Out', 'First Impression'].includes(move)) choiceItem = false;
				}
				if (!statusMoveCount) {
					if (format === 'vgc' && set.ability === 'Intimidate' || set.moves.includes('Fake Out')) set.possibleItems.tier0.push('Assault Vest');
					else set.possibleItems.tier2.push('Assault Vest');
				}
				if (choiceItem) {
					let choiceValue = 'tier2';
					if (set.roles.includes('pivoting') choiceValue = 'tier0';
					if (set.roles.includes('physical') && !set.roles.includes('special')) set.possibleItems[choiceValue].push('Choice Band');
					if (set.roles.includes('special') && !set.roles.includes('physical')) set.possibleItems[choiceValue].push('Choice Specs');
					if ((set.exactStats.spe * 1.5 > (format === 'singles' ? 403 : 204)) && !(set.exactStats.spe > (format === 'singles' ? 403 : 204))) set.possibleItems[choiceValue].push('Choice Scarf');
				}
				// Covert Cloak and Clear Amulet
				if (format === 'vgc') {
					if (
						set.roles && set.roles.includes('physical') && !set.roles.includes('antiintimidate') &&
						!['Clear Body', 'White Smoke', 'Full Metal Body'].includes(set.ability)
					) {
						if (set.roles.includes('physicalsetup')) set.possibleItems.tier0.push('Clear Amulet');
						else set.possibleItems.tier2.push('Clear Amulet');
						// also setting White Herb for tier 3
						set.possibleItems.tier3.push('White Herb');
					}
					if (
						!(this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.types.includes('Ghost')) && set.teraType !== 'Ghost' &&
						!set.roles.includes('antipriority') && set.ability !== 'Shield Dust'
					) {
						if (set.roles.includes('speedcontrol') || set.roles.includes('trickroom')) set.possibleItems.tier0.push('Covert Cloak');
						else set.possibleItems.tier2.push('Covert Cloak');
					}
				}
				// Mental Herb
				if (
					format === 'vgc' && set.roles.includes('trickroom') && !['Oblivious', 'Good as Gold', 'Magic Bounce'].includes(set.ability) && !teamOfferedSupport.aromaveil
				) {
					if ( // higher priority if you're really not worried about Fake Out
						(this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.types.includes('Ghost')) ||
						set.teraType === 'Ghost' || set.roles.includes('antipriority') || set.ability === 'Shield Dust' ||
						teamOfferedSupport.psychicterrain
					) {
						set.possibleItems.tier0.push('Mental Herb');
					} else { // but still useful if not
						set.possibleItems.tier2.push('Mental Herb');
					}
				}
				// Safety Goggles
				if ( // let's avoid complete redundancy at least
					format === 'vgc' &&
					!(this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.types.includes('Grass')) && set.teraType !== 'Grass' &&
					!set.roles.includes('sleepimmune') &&
					![
						'Overcoat', 'Good as Gold', 'Magic Bounce',
						'Vital Spirit', 'Insomnia', 'Sweet Veil',
					].includes(set.ability) &&
					!teamOfferedSupport.antisleep && !teamOfferedSupport.electricterrain && !teamOfferedSupport.mistyterrain
				) {
					// but then there are a handful of different use cases
					// the matchup with specific Spore users is relevant, but I don't think I can generalize that just yet; consider this a TODO for the threatlist mechanic
					
					// Okay, so top-priority Trick Room setters first...
					// let's look at this the same way as Mental Herb: give Safety Goggles *much* higher priority if you're not afraid of priority
					if (
						set.roles.includes('trickroom') &&
						((this.dex.species.get(set.species).randbats && this.dex.species.get(set.species).randbats.types.includes('Ghost')) ||
						set.teraType === 'Ghost' || set.roles.includes('antipriority') || set.ability === 'Shield Dust' ||
						teamOfferedSupport.psychicterrain)
					) {
						set.possibleItems.tier0.push('Safety Goggles');
					} else { // but now we have a lot of other use cases
						if (
							// - has the move Trick Room, has its own redirection, or has the role 'antitrickroom' specifically through the move Taunt
							set.roles.includes('trickroom') || set.roles.includes('redirection') || set.moves.includes('Taunt')
						) {
							set.possibleItems.tier2.push('Safety Goggles');
						} else if (
							// no other Spore immunity on the team (outside of Tera) AND
							(!teamOfferedSupport.sleepimmune && !teamOfferedSupport.powderimmune) &&
							// - is a bulky pivot, esp. with Intimidate and/or Fake Out
							// - is strong a single-target attacker that already isn't concerned by Intimidate
							((set.roles.includes('pivoting') && (set.roles.includes('fakeout') || set.roles.includes('intimidate'))) ||
							(set.roles.includes('physical') && set.roles.includes('antiintimidate' && !set.roles.includes('spread'))))
						) {
						}
					}
				}
				// Focus Sash
				if (set.ability !== 'Sturdy') {
					if (format === 'vgc') {
						if (
							(set.exactStats.hp * set.exactStats.def <= 16000 || set.exactStats.hp * set.exactStats.spd <= 16000) &&
							(set.evs.spe >= 248 || set.ability === 'Prankster')
						) set.possibleItems.tier2.push('Focus Sash');
					} else {
						if (set.roles.includes('entryhazard') && statusMoveCount > 1) set.possibleItems.tier2.push('Focus Sash');
					}
				}
				// Life Orb
				if (set.roles.includes('physical') || set.roles.includes('special')) {
					// fast, offensive Pokémon, preferably with some kind of recovery
					if (['Magic Guard', 'Regenerator'].includes(set.ability)) {
						set.possibleItems.tier0.push('Life Orb');
					} else if (drainMoveCount) set.possibleItems.tier2.push('Life Orb');
				}
				if (drainMoveCount && set.moves.includes('Leech Seed')) set.possibleItems.tier2.push('Big Root');
				// Rocky Helmet
				if (format === 'singles') {
					// if you aren't weak to Rock + are HP- or Defense-invested + resist at least two of Dark, Fighting and Bug, or resist one and have Regenerator?
					if (
						(set.evs.hp + set.evs.def) >= 248 && // must be HP or Defense-invested
						
						// must resist at least one of Dark, Fighting and Bug
						(
							(
								this.dex.species.get(set.species).randbats.resistances.Dark && (
									this.dex.species.get(set.species).randbats.resistances.Dark === 'true' ||
									(this.dex.species.get(set.species).randbats.resistances.Dark.Ability && this.dex.species.get(set.species).randbats.resistances.Dark.Ability.includes(set.ability))
								)
							) || (
								this.dex.species.get(set.species).randbats.resistances.Fighting && (
									this.dex.species.get(set.species).randbats.resistances.Fighting === 'true' ||
									(this.dex.species.get(set.species).randbats.resistances.Fighting.Ability && this.dex.species.get(set.species).randbats.resistances.Fighting.Ability.includes(set.ability))
								)
							) || (
								this.dex.species.get(set.species).randbats.resistances.Bug && (
									this.dex.species.get(set.species).randbats.resistances.Bug === 'true' ||
									(this.dex.species.get(set.species).randbats.resistances.Bug.Ability && this.dex.species.get(set.species).randbats.resistances.Bug.Ability.includes(set.ability))
								)
							)
						) &&
						
						// must not be weak to Stealth Rock
						(['Regenerator', 'Magic Guard'].includes(set.ability) || !(this.dex.species.get(set.species).randbats.weaknesses.Rock))
					) set.possibleItems.tier2.push('Rocky Helmet');
				} else {
					// if you have redirection?
					if (set.roles.includes('redirection')) set.possibleItems.tier2.push('Rocky Helmet');
				}
				// Heavy-Duty Boots
				if (format === 'singles' && set.ability !== 'Magic Guard') {
					if (set.roles.includes('pivoting') || set.roles.includes('hazardcontrol')) {
						if (
							this.dex.species.get(set.species) && this.dex.species.get(set.species).randbats &&
							this.dex.species.get(set.species).randbats.weaknesses.Rock
						) set.possibleItems.tier0.push('Heavy-Duty Boots'); // if you're a pivot or hazard control and not Rock-resistant
					} else if ( // if you're not a pivot or hazard control, but you're Rock-weak
						this.dex.species.get(set.species) && this.dex.species.get(set.species).randbats &&
						this.dex.species.get(set.species).randbats.weaknesses.Rock
					) {
						set.possibleItems.tier2.push('Heavy-Duty Boots');
					}
				}
				// Eject Button
				if (
					(set.roles.includes('redirection') || this.dex.abilities.get(set.ability).onEmergencyExit)
				) {
					set.possibleItems.tier2.push('Red Card');
					if (
						format !== 'singles' || ['Regenerator', 'Magic Guard'].includes(set.ability) || !(this.dex.species.get(set.species).randbats.weaknesses.Rock)
					) set.possibleItems.tier2.push('Eject Button');
				}
				// type-boosting items
				if (set.roles.includes('physical') || set.roles.includes('special')) {
					if (set.attackingTypes.Fire && set.attackingTypes.Fire.length > 1) set.possibleItems.tier2.push('Charcoal');
					if (set.attackingTypes.Fire && set.attackingTypes.Fire.length > 1) set.possibleItems.tier2.push('Flame Plate');
					
					if (set.attackingTypes.Water && set.attackingTypes.Water.length > 1) set.possibleItems.tier2.push('Mystic Water');
					if (set.attackingTypes.Water && set.attackingTypes.Water.length > 1) set.possibleItems.tier2.push('Splash Plate');
					if (set.attackingTypes.Water && set.attackingTypes.Water.length > 1) set.possibleItems.tier2.push('Wave Incense');
					if (set.attackingTypes.Water && set.attackingTypes.Water.length > 1) set.possibleItems.tier2.push('Sea Incense');
					
					if (set.attackingTypes.Electric && set.attackingTypes.Electric.length > 1) set.possibleItems.tier2.push('Magnet');
					if (set.attackingTypes.Electric && set.attackingTypes.Electric.length > 1) set.possibleItems.tier2.push('Zap Plate');
					
					if (set.attackingTypes.Grass && set.attackingTypes.Grass.length > 1) set.possibleItems.tier2.push('Miracle Seed');
					if (set.attackingTypes.Grass && set.attackingTypes.Grass.length > 1) set.possibleItems.tier2.push('Meadow Plate');
					if (set.attackingTypes.Grass && set.attackingTypes.Grass.length > 1) set.possibleItems.tier2.push('Rose Incense');
					
					if (set.attackingTypes.Ice && set.attackingTypes.Ice.length > 1) set.possibleItems.tier2.push('Never-Melt Ice');
					if (set.attackingTypes.Ice && set.attackingTypes.Ice.length > 1) set.possibleItems.tier2.push('Icicle Plate');
					
					if (set.attackingTypes.Fighting && set.attackingTypes.Fighting.length > 1) set.possibleItems.tier2.push('Black Belt');
					if (set.attackingTypes.Fighting && set.attackingTypes.Fighting.length > 1) set.possibleItems.tier2.push('Fist Plate');
					
					if (set.attackingTypes.Poison && set.attackingTypes.Poison.length > 1) set.possibleItems.tier2.push('Poison Barb');
					if (set.attackingTypes.Poison && set.attackingTypes.Poison.length > 1) set.possibleItems.tier2.push('Toxic Plate');
					
					if (set.attackingTypes.Ground && set.attackingTypes.Ground.length > 1) set.possibleItems.tier2.push('Soft Sand');
					if (set.attackingTypes.Ground && set.attackingTypes.Ground.length > 1) set.possibleItems.tier2.push('Earth Plate');
					
					if (set.attackingTypes.Flying && set.attackingTypes.Flying.length > 1) set.possibleItems.tier2.push('Sharp Beak');
					if (set.attackingTypes.Flying && set.attackingTypes.Flying.length > 1) set.possibleItems.tier2.push('Sky Plate');
					
					if (set.attackingTypes.Psychic && set.attackingTypes.Psychic.length > 1) set.possibleItems.tier2.push('Twisted Spoon');
					if (set.attackingTypes.Psychic && set.attackingTypes.Psychic.length > 1) set.possibleItems.tier2.push('Mind Plate');
					if (set.attackingTypes.Psychic && set.attackingTypes.Psychic.length > 1) set.possibleItems.tier2.push('Odd Incense');
					
					if (set.attackingTypes.Bug && set.attackingTypes.Bug.length > 1) set.possibleItems.tier2.push('Silver Powder');
					if (set.attackingTypes.Bug && set.attackingTypes.Bug.length > 1) set.possibleItems.tier2.push('Insect Plate');
					
					if (set.attackingTypes.Rock && set.attackingTypes.Rock.length > 1) set.possibleItems.tier2.push('Hard Stone');
					if (set.attackingTypes.Rock && set.attackingTypes.Rock.length > 1) set.possibleItems.tier2.push('Stone Plate');
					if (set.attackingTypes.Rock && set.attackingTypes.Rock.length > 1) set.possibleItems.tier2.push('Rock Incense');
					
					if (set.attackingTypes.Ghost && set.attackingTypes.Ghost.length > 1) set.possibleItems.tier2.push('Spell Tag');
					if (set.attackingTypes.Ghost && set.attackingTypes.Ghost.length > 1) set.possibleItems.tier2.push('Spooky Plate');
					
					if (set.attackingTypes.Dragon && set.attackingTypes.Dragon.length > 1) set.possibleItems.tier2.push('Dragon Fang');
					if (set.attackingTypes.Dragon && set.attackingTypes.Dragon.length > 1) set.possibleItems.tier2.push('Draco Plate');
					
					if (set.attackingTypes.Dark && set.attackingTypes.Dark.length > 1) set.possibleItems.tier2.push('Black Glasses');
					if (set.attackingTypes.Dark && set.attackingTypes.Dark.length > 1) set.possibleItems.tier2.push('Dread Plate');
					
					if (set.attackingTypes.Steel && set.attackingTypes.Steel.length > 1) set.possibleItems.tier2.push('Metal Coat');
					if (set.attackingTypes.Steel && set.attackingTypes.Steel.length > 1) set.possibleItems.tier2.push('Iron Plate');
					
					if (set.attackingTypes.Fairy && set.attackingTypes.Fairy.length > 1) set.possibleItems.tier2.push('Fairy Feather');
					if (set.attackingTypes.Fairy && set.attackingTypes.Fairy.length > 1) set.possibleItems.tier2.push('Pixie Plate');
					
					if (set.attackingTypes.Normal && set.attackingTypes.Normal.length > 1) set.possibleItems.tier2.push('Silk Scarf');
					if (set.attackingTypes.Normal && set.attackingTypes.Normal.length > 1) set.possibleItems.tier2.push('Normal Gem');
				}

				// tier 3 - niche items
				if (set.roles.includes('physical') || set.roles.includes('special')) {
					// Expert Belt
					let attackingTypes = 0;
					for (const type in set.attackingTypes) attackingTypes++;
					if (attackingTypes > 3) set.possibleItems.tier3.push('Expert Belt');
				}
				
				// tier 4 - backup plans
				if (!['Bold', 'Modest', 'Calm', 'Timid'].includes(set.nature)) set.possibleItems.tier4.push('Figy Berry');
				if (!['Lonely', 'Mild', 'Gentle', 'Hasty'].includes(set.nature)) set.possibleItems.tier4.push('Iapapa Berry');
				if (!['Adamant', 'Impish', 'Careful', 'Jolly'].includes(set.nature)) set.possibleItems.tier4.push('Wiki Berry');
				if (!['Naughty', 'Lax', 'Rash', 'Naive'].includes(set.nature)) set.possibleItems.tier4.push('Aguav Berry');
				if (!['Brave', 'Relaxed', 'Quiet', 'Sassy'].includes(set.nature)) set.possibleItems.tier4.push('Mago Berry');
				set.possibleItems.tier4.push('Sitrus Berry');

				// FOR UNBURDEN
				if (set.ability === 'Unburden') {
					const unburdenItems = [
						'Adrenaline Orb', 'Air Balloon', 'Berry Juice', 'Blunder Policy', 'Cell Battery', 'Electric Seed', 'Focus Sash', 'Grassy Seed', 'Luminous Moss', 'Mental Herb',
						'Mirror Herb', 'Misty Seed', 'Normal Gem', 'Power Herb', 'Psychic Seed', 'Red Card', 'Snowball', 'Throat Spray', 'Weakness Policy', 'White Herb',
					];
					set.possibleItems.tier0 = set.possibleItems.tier0.filter((item) => (unburdenItems.includes(item)));
					set.possibleItems.tier1 = set.possibleItems.tier1.filter((item) => (unburdenItems.includes(item)));
					set.possibleItems.tier2 = set.possibleItems.tier2.filter((item) => (unburdenItems.includes(item)));
					set.possibleItems.tier3 = set.possibleItems.tier3.filter((item) => (unburdenItems.includes(item)));
					set.possibleItems.tier4 = set.possibleItems.tier4.filter((item) => (unburdenItems.includes(item)));
				}

				// FOR CHEEK POUCH AND BELCH
				if (
					set.roles.includes('requireberry') || set.ability === 'Cheek Pouch' || set.moves.includes('Belch')
				) {
					set.possibleItems.tier0 = set.possibleItems.tier0.filter((item) => (this.dex.items.get(item).isBerry));
					set.possibleItems.tier1 = set.possibleItems.tier1.filter((item) => (this.dex.items.get(item).isBerry));
					set.possibleItems.tier2 = set.possibleItems.tier2.filter((item) => (this.dex.items.get(item).isBerry));
					set.possibleItems.tier3 = set.possibleItems.tier3.filter((item) => (this.dex.items.get(item).isBerry));
					set.possibleItems.tier4 = set.possibleItems.tier4.filter((item) => (this.dex.items.get(item).isBerry));
				}
			}

			let forceBreak = false;
			while (setsWithoutItems.length && !forceBreak) {
				forceBreak = true; // as long as one item can be assigned, this will be set to false later
				for (const set of setsWithoutItems) {
					// filter by item clause
					set.possibleItems.tier0 = set.possibleItems.tier0.filter((item) => (!itemsAlreadyUsed.includes(item)));
					set.possibleItems.tier1 = set.possibleItems.tier1.filter((item) => (!itemsAlreadyUsed.includes(item)));
					set.possibleItems.tier2 = set.possibleItems.tier2.filter((item) => (!itemsAlreadyUsed.includes(item)));
					set.possibleItems.tier3 = set.possibleItems.tier3.filter((item) => (!itemsAlreadyUsed.includes(item)));
					set.possibleItems.tier4 = set.possibleItems.tier4.filter((item) => (!itemsAlreadyUsed.includes(item)));

					// find the highest tier possible for each set
					set.possibleItems.currentStep = [];
					if (set.possibleItems.tier0.length) set.possibleItems.currentStep = set.possibleItems.tier0;
					else if (set.possibleItems.tier1.length) set.possibleItems.currentStep = set.possibleItems.tier1;
					else if (set.possibleItems.tier2.length) set.possibleItems.currentStep = set.possibleItems.tier2;
					else if (set.possibleItems.tier3.length) set.possibleItems.currentStep = set.possibleItems.tier3;
					else if (set.possibleItems.tier4.length) set.possibleItems.currentStep = set.possibleItems.tier4;
					if (set.possibleItems.currentStep.length > 0) forceBreak = false;
				}
				
				// find which set has the smallest item pool
				let itemPoolLength = 'undefined';
				let setsThisStep = [];
				for (const set of setsWithoutItems) {
					if (
						itemPoolLength === 'undefined' || (set.possibleItems.currentStep.length && set.possibleItems.currentStep.length < itemPoolLength)
					) {
						// reset
						itemPoolLength = set.possibleItems.currentStep.length;
						setsThisStep = [];
					}
					if (set.possibleItems.currentStep.length === itemPoolLength) setsThisStep.push(set);
				}
				
				// assign it an item from that tier
				if (itemPoolLength > 0 && setsThisStep) {
					let setThisStep = this.sample(setsThisStep);
					let itemThisStep = this.sample(setThisStep.possibleItems.currentStep);
					setThisStep.item = itemThisStep;
					itemsAlreadyUsed.push(itemThisStep);
				}

				// remove anything with an item from setsWithoutItems
				setsWithoutItems = setsWithoutItems.filter((set) => (!set.item));
			}
		}

		// TODO: nickname check???
		// // - if all 6 sets are random, check the list of teamwide naming schemes; if there are any where all 6 Pokémon have an entry, there's a chance to pull from them!
		// // - check the list of small group naming schemes; if there are any groups that the random sets completely encompass, go for it!
		// // - otherwise, if the Pokémon has a set of random names defined in pokedex.ts, sample one of them
		// // - and if not, no nickname
		
		// finally, push every remaining set to the actual team!
		while (sets.filter((set) => (!team.includes(set))).length) {
			// this is done in to randomize the order of the sets
			team.push(this.sample(sets.filter((set) => (!team.includes(set)))));
		}

		if (!team || !team.length || team.length < 2) {
			// update: fare thee well Default Rootsnoot
			// I don't think you will ever be called again
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
		return team;
	},
};
