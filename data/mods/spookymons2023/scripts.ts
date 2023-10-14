export const Scripts: {[k: string]: ModdedBattleScriptsData} = {
	teambuilderConfig: {
		excludeStandardTiers: true,
		customTiers: ['Spooky!', 'Spooky (NFE)'],
		customDoublesTiers: ['Spooky!', 'Spooky (NFE)'],
	},
	init() {
		for (const id in this.dataCache.Pokedex) {
			const newMon = this.dataCache.Pokedex[id];
			if (!newMon || !newMon.copyData) continue; // weeding out Pokémon that aren't new
			const copyData = this.dataCache.Pokedex[this.toID(newMon.copyData)];

			if (!newMon.types && copyData.types) newMon.types = copyData.types;
			if (!newMon.baseStats && copyData.baseStats) newMon.baseStats = copyData.baseStats;
			if (!newMon.abilities && copyData.abilities) newMon.abilities = copyData.abilities;
			if (!newMon.num && copyData.num) newMon.num = copyData.num * -1; // inverting the original's dex number
			if (!newMon.genderRatio && copyData.genderRatio) newMon.genderRatio = copyData.genderRatio;
			if (!newMon.heightm && copyData.heightm) newMon.heightm = copyData.heightm;
			if (!newMon.weightkg && copyData.weightkg) newMon.weightkg = copyData.weightkg;
			if (!newMon.color && copyData.color) newMon.color = copyData.color;
			if (!newMon.eggGroups && copyData.eggGroups) newMon.eggGroups = copyData.eggGroups;

			let copyMoves = newMon.copyData;
			if (newMon.copyMoves) copyMoves = newMon.copyMoves;
			if (copyMoves) {
				if (!this.dataCache.Learnsets[id]) this.dataCache.Learnsets[id] = {learnset: {}}; // create a blank learnset entry so we don't need a learnsets file (thank you ink)
				const learnset = this.dataCache.Learnsets[this.toID(copyMoves)].learnset;
				for (const moveid in learnset) {
					this.modData('Learnsets', id).learnset[moveid] = learnset[moveid].filter(
						(method) => !method.includes('S')
					);
				}
				if (newMon.movepoolAdditions) {
					for (const move of newMon.movepoolAdditions) {
						this.modData('Learnsets', this.toID(id)).learnset[this.toID(move)] = ["8M"];
					}
				}
				if (newMon.movepoolDeletions) {
					for (const move of newMon.movepoolDeletions) {
						delete this.modData('Learnsets', this.toID(id)).learnset[this.toID(move)];
					}
				}
				// hard-coding a bit for Eclipseroid specifically (may rework if we get more fusions later but kinda doubt)
				if (newMon.name === 'Eclipseroid') {
					for (const moveid in this.dataCache.Learnsets[this.toID("Lunatone")].learnset) {
						this.modData('Learnsets', id).learnset[moveid] = this.dataCache.Learnsets[this.toID("Lunatone")].learnset[moveid].filter(
							(method) => !method.includes('S')
						);
					}
				}
			}
		}
	},
/*
	pokemon: {
		getHealth() { // modded for Baneful Transformation
			if (!this.hp) return {side: this.side.id, secret: '0 fnt', shared: '0 fnt'};
			let secret = `${this.hp}/${this.maxhp}`;
			let shared;
			const ratio = this.hp / this.maxhp;
			if (this.battle.reportExactHP) {
				shared = secret;
			} else if (this.battle.reportPercentages || this.battle.gen >= 8) {
				// HP Percentage Mod mechanics
				let percentage = Math.ceil(ratio * 100);
				if ((percentage === 100) && (ratio < 1.0)) {
					percentage = 99;
				}
				shared = `${percentage}/100`;
			} else {
				// In-game accurate pixel health mechanics
				const pixels = Math.floor(ratio * 48) || 1;
				shared = `${pixels}/48`;
				if ((pixels === 9) && (ratio > 0.2)) {
					shared += 'y'; // force yellow HP bar
				} else if ((pixels === 24) && (ratio > 0.5)) {
					shared += 'g'; // force green HP bar
				}
			}
			if ('banefultransformation' in this.volatiles) shared = `100/100g`; // only modded line
			if (this.status) {
				secret += ` ${this.status}`;
				shared += ` ${this.status}`;
			}
			return {side: this.side.id, secret, shared};
		},
	},
*/
	actions: {

	switchIn(pokemon: Pokemon, pos: number, sourceEffect: Effect | null = null, isDrag?: boolean) { // modded for Baneful Transformation
		if (!pokemon || pokemon.isActive) {
			this.battle.hint("A switch failed because the Pokémon trying to switch in is already in.");
			return false;
		}
		let banefulTransformation = null; // these two lines modded for Baneful Transformation
		if (sourceEffect && (sourceEffect as Move).name === 'Baneful Transformation') banefulTransformation = true;

		const side = pokemon.side;
		if (pos >= side.active.length) {
			throw new Error(`Invalid switch position ${pos} / ${side.active.length}`);
		}
		const oldActive = side.active[pos];
		const unfaintedActive = oldActive?.hp ? oldActive : null;
		if (unfaintedActive) {
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
			if (banefulTransformation) { // this section modded for Baneful Transformation
				if (!pokemon.m.wolfsbane) pokemon.m.wolfsbane = oldActive;
				pokemon.addVolatile('banefultransformation');
				this.battle.runEvent('BeforeSwitchIn', pokemon); // do this before it becomes active
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

		if (isDrag && this.battle.gen >= 5) {
			// runSwitch happens immediately so that Mold Breaker can make hazards bypass Clear Body and Levitate
			this.battle.singleEvent('PreStart', pokemon.getAbility(), pokemon.abilityState, pokemon);
			this.runSwitch(pokemon);
		} else {
			this.battle.queue.insertChoice({choice: 'runUnnerve', pokemon});
			this.battle.queue.insertChoice({choice: 'runSwitch', pokemon});
		}

		return true;
	}

	},
};
