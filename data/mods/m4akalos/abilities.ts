export const Abilities: {[abilityid: string]: ModdedAbilityData} = {
	managate: {
		desc: "When using a Psychic-type move, this Pokémon moves last among Pokémon using the same or greater priority moves, then switches out to a chosen ally.",
		shortDesc: "Psychic moves: move last in priority bracket, pivot the user out.",
		onFractionalPriorityPriority: -1,
		onFractionalPriority(priority, pokemon, target, move) {
			if (move.category === "Status" && move.type === "Psychic") return -0.1;
		},
		onModifyMove(move) {
			if (move.category === "Status" && move.type === "Psychic" && !move.selfSwitch) move.selfSwitch = true;
		},
		onSourceHit(target, source, move) {
			if (move.category === "Status" && move.type === "Psychic" && move.selfSwitch && this.canSwitch(source.side)) {
				this.add('-ability', source, 'Mana Gate');
				this.add('-message', `${source.name} switches out using Mana Gate!`);
			}
		},
		name: "Mana Gate",
		rating: 3,
		num: -1001,
	},
	partialeclipse: {
		desc: "Causes all adjacent Pokémon to lose 1/8 of their maximum HP, rounded down, at the end of each turn if this Pokémon has 1/2 or less of its maximum HP.",
		shortDesc: "When HP is 1/2 or less, adjacent Pokémon lose 1/8 of their max HP each turn.",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (!pokemon.hp || pokemon.hp > pokemon.maxhp / 2) return;
			for (const target of pokemon.side.foe.active) {
				if (target && target.hp) this.damage(target.baseMaxhp / 8, target, pokemon);
			}
		},
		name: "Partial Eclipse",
		rating: 3,
		num: -1002,
	},
	marshlandlord: {
		shortDesc: "On switch-in, summons Water Sport and Mud Sport.",
		onStart(source) {
			this.add('-ability', source, 'Marshland Lord');
			this.field.addPseudoWeather('watersport');
			this.field.addPseudoWeather('mudsport');
		},
		name: "Marshland Lord",
		rating: 3.5,
		num: -1003,
	},
	badinfluence: {
		shortDesc: "If this Pokémon has a stat stage lowered, all Pokémon on the field have the same stat stage lowered.",
		onBoost(boost, target, source, effect) {
			if (!boost || effect.id === 'mirrorarmor' || effect.id === 'badinfluence') return;
			let b: BoostName;
			const negativeBoost: SparseBoostsTable = {};
			for (b in boost) {
				if (boost[b]! < 0) {
					if (target.boosts[b] === -6) continue;
					negativeBoost[b] = boost[b];
				}
			}
			let activated = false;
			for (const pokemon of this.getAllActive()) {
				if (pokemon === target || pokemon.fainted) continue;
				if (!activated) {
					this.add('-ability', target, 'Bad Influence');
					activated = true;
				}
				this.boost(negativeBoost, pokemon, target, null, true);
			}
		},
		name: "Bad Influence",
		rating: 4,
		num: -1004,
	},
	petrification: {
		shortDesc: "Ice immunity; adds Rock to this Pokémon when hit with an Ice move.",
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ice') {
				move.accuracy = true;
				if (target.hasType('Rock') || !target.addType('Rock')) {
					this.add('-immune', target, '[from] ability: Petrification');
				}
				return null;
			}
		},
		isBreakable: true,
		name: "Petrification",
		rating: 3,
		num: -1005,
	},
	repulsive: {
		shortDesc: "When lowering a target's stats, also lowers target's Defense by 1 stage.",
		onAnyAfterEachBoost(boost, target, source, effect) {
			if (!source || source !== this.effectData.target || effect.name === 'Repulsive') return;
			let statsLowered = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered && target.hp) {
				this.boost({def: -1}, target, source, null, true);
			}
		},
		name: "Repulsive",
		rating: 3,
		num: -1006,
	},

	// crossover Megas

	alluring: {
		shortDesc: "This Pokémon removes the pivoting effect of opposing Pokémon's moves.",
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Alluring');
			this.add('-message', `Pokémon opposing ${pokemon.name} can't pivot out of battle!`);
		},
		onAnyModifyMove(move, pokemon) {
			if (pokemon.side === this.effectState.target.side) return;
			if (move.selfSwitch && !move.ignoreAbility) delete move.selfSwitch;
		},
		name: "Alluring",
		rating: 4,
		num: -73,
	},
	redlicorice: {
		desc: "This Pokémon's Fairy-type attacks cause the target to become sticky and flammable. When a Fire-type attack is used against a target that is sticky and flammable, its power is multiplied by 1.5, and the target is burned but is no longer sticky and flammable. When a Fire-type attack is used by an attacker that is sticky and flammable, the user takes recoil damage equal to 50% the HP lost by the target (rounded half up, but not less than 1 HP), and the user is burned but is no longer sticky and flammable.",
		shortDesc: "Fairy attacks make target sticky; Fire attacks: burn, 50% more damage to sticky Pokémon.",
		onSourceHit(target, source, move) {
			if (move.category !== 'Status' && move.type === 'Fairy') {
				target.addVolatile('redlicorice');
			}
		},
		condition: {
			onStart(pokemon, source, effect) {
				this.add('-start', pokemon, 'Sticky Gel', '[from] ability: Red Licorice', '[of] ' + source);
			},
			onAnyDamage(damage, target, source, effect) {
				if (effect && effect.effectType === 'Move' && effect.type === 'Fire' && source === this.effectState.target) {
					if (this.effectState.damage) {
						if (target.hp <= damage) {
							this.effectState.damage += target.hp;
						} else {
							this.effectState.damage += damage;
						}
					} else {
						if (target.hp <= damage) {
							this.effectState.damage = target.hp;
						} else {
							this.effectState.damage = damage;
						}
					}
					this.effectState.lit = true;
				} else if (effect && effect.effectType === 'Move' && effect.type === 'Fire' && target === this.effectState.target) {
					this.effectState.lit = true;
					return damage * 1.5;
				}
			},
			onUpdate(pokemon) {
				if (this.effectState.lit) {
					pokemon.removeVolatile('redlicorice');
					this.add('-end', pokemon, 'Sticky Gel', '[silent]');
					this.hint("The sticky gel ignited!");
					if (this.effectState.damage) {
						this.damage(this.effectState.damage / 2, this.effectState.target);
					}
					pokemon.trySetStatus('brn', this.effectState.source);
				}
			},
		},
		name: "Red Licorice",
		rating: 3,
		num: -56,
	},
	diamonddust: {
		desc: "On switch-in, this Pokémon summons Diamond Dust for 5 turns. During the effect, Pokémon are immune to all Rock-type attacks and Stealth Rock; Weather Ball becomes an Ice-type move, and its base power is 100; and other weather-related moves and Abilities behave as they do in Hail.",
		shortDesc: "5 turns: all Pokémon are immune to Rock; counts as hail.",
		onStart(source) {
			this.field.setWeather('diamonddust');
		},
		name: "Diamond Dust",
		rating: 3,
		num: -27,
	},
	// Diamond Dust modded into other Abilities
	forecast: {
		onUpdate(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Castform' || pokemon.transformed) return;
			let forme = null;
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				if (pokemon.species.id !== 'castformsunny') forme = 'Castform-Sunny';
				break;
			case 'raindance':
			case 'primordialsea':
				if (pokemon.species.id !== 'castformrainy') forme = 'Castform-Rainy';
				break;
			case 'hail':
			case 'diamonddust':
				if (pokemon.species.id !== 'castformsnowy') forme = 'Castform-Snowy';
				break;
			default:
				if (pokemon.species.id !== 'castform') forme = 'Castform';
				break;
			}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
			}
		},
		name: "Forecast",
		rating: 2,
		num: 59,
	},
	icebody: {
		desc: "If Hail or Diamond Dust is active, this Pokémon restores 1/16 of its maximum HP, rounded down, at the end of each turn. This Pokémon takes no damage from Hail.",
		shortDesc: "If Hail or Diamond Dust is active, heals 1/16 of its max HP each turn; immunity to Hail.",
		onWeather(target, source, effect) {
			if (effect.id === 'hail' || effect.id === 'diamonddust') {
				this.heal(target.baseMaxhp / 16);
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'hail') return false;
		},
		name: "Ice Body",
		rating: 1,
		num: 115,
	},
	iceface: {
		desc: "If this Pokémon is an Eiscue, the first physical hit it takes in battle deals 0 neutral damage. Its ice face is then broken and it changes forme to Noice Face. Eiscue regains its Ice Face forme when Hail or Diamond Dust begins or when Eiscue switches in while Hail or Diamond Dust is active. Confusion damage also breaks the ice face.",
		shortDesc: "If Eiscue, the first physical hit it takes deals 0 damage. Effect restored in Hail, Diamond Dust.",
		onStart(pokemon) {
			if (
				(this.field.isWeather('hail') || this.field.isWeather('diamonddust')) &&
				pokemon.species.id === 'eiscuenoice' && !pokemon.transformed
			) {
				this.add('-activate', pokemon, 'ability: Ice Face');
				this.effectState.busted = false;
				pokemon.formeChange('Eiscue', this.effect, true);
			}
		},
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (
				effect && effect.effectType === 'Move' && effect.category === 'Physical' &&
				target.species.id === 'eiscue' && !target.transformed
			) {
				this.add('-activate', target, 'ability: Ice Face');
				this.effectState.busted = true;
				return 0;
			}
		},
		onCriticalHit(target, type, move) {
			if (!target) return;
			if (move.category !== 'Physical' || target.species.id !== 'eiscue' || target.transformed) return;
			if (target.volatiles['substitute'] && !(move.flags['authentic'] || move.infiltrates)) return;
			if (!target.runImmunity(move.type)) return;
			return false;
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target) return;
			if (move.category !== 'Physical' || target.species.id !== 'eiscue' || target.transformed) return;
			if (target.volatiles['substitute'] && !(move.flags['authentic'] || move.infiltrates)) return;
			if (!target.runImmunity(move.type)) return;
			return 0;
		},
		onUpdate(pokemon) {
			if (pokemon.species.id === 'eiscue' && this.effectState.busted) {
				pokemon.formeChange('Eiscue-Noice', this.effect, true);
			}
		},
		onAnyWeatherStart() {
			const pokemon = this.effectState.target;
			if (
				(this.field.isWeather('hail') || this.field.isWeather('diamonddust')) &&
				pokemon.species.id === 'eiscuenoice' && !pokemon.transformed
			) {
				this.add('-activate', pokemon, 'ability: Ice Face');
				this.effectState.busted = false;
				pokemon.formeChange('Eiscue', this.effect, true);
			}
		},
		isPermanent: true,
		name: "Ice Face",
		rating: 3,
		num: 248,
	},
	slushrush: {
		shortDesc: "If Hail or Diamond Dust is active, this Pokémon's Speed is doubled.",
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('hail') || this.field.isWeather('diamonddust')) {
				return this.chainModify(2);
			}
		},
		name: "Slush Rush",
		rating: 3,
		num: 202,
	},
	snowcloak: {
		desc: "If Hail or Diamond Dust is active, this Pokémon's evasiveness is multiplied by 1.25. This Pokémon takes no damage from Hail.",
		shortDesc: "If Hail or Diamond Dust is active, evasiveness is 1.25x; immunity to Hail.",
		onImmunity(type, pokemon) {
			if (type === 'hail') return false;
		},
		onModifyAccuracyPriority: 8,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.field.isWeather('hail') || this.field.isWeather('diamonddust')) {
				this.debug('Snow Cloak - decreasing accuracy');
				return accuracy * 0.8;
			}
		},
		name: "Snow Cloak",
		rating: 1.5,
		num: 81,
	},
};
