import {Pokemon} from "../../../sim/pokemon";

export const Moves: {[moveid: string]: ModdedMoveData} = {
	banefultransformation: {
		num: -2001, // 2023 content
		accuracy: true,
		basePower: 0,
		category: "Status",
		shortDesc: "The user summons an ally that it has turned into a monster.",
		name: "Baneful Transformation",
		pp: 20,
		priority: 0,
		flags: {failencore: 1, failmefirst: 1, nosleeptalk: 1, noassist: 1, failcopycat: 1, failinstruct: 1, failmimic: 1},
		onTry(source) {
			let werewolf = null;
			for (let i = source.side.pokemon.length - 1; i >= 0; i--) {
				const possibleTarget = source.side.pokemon[i];
				if (possibleTarget.m.wolfsbane && possibleTarget !== source) {
					werewolf = possibleTarget;
					break;
				}
			}
			if (werewolf) {
				if (werewolf.fainted) {
					this.hint(`Your team's Baneful Transformation is ${werewolf.name}, who has already been defeated!`, true, source.side);
					return false;
				}
				if (werewolf.isActive) {
					this.hint(`Your team's Baneful Transformation is ${werewolf.name}, who is already active!`, true, source.side);
					return false;
				}
				werewolf.addVolatile('banefultransformation');
				this.runEvent('BeforeSwitchIn', werewolf);
				this.actions.switchIn(werewolf, source.position, this.effect, false);
				return null;
			}
			if (this.canSwitch(source.side)) {
				this.hint(`Select a Pokémon to become your team's Baneful Transformation!`, true, source.side);
				this.hint(`From now on, when you use Baneful Transformation, you'll only be able to switch to the Pokémon you choose now.`, true, source.side);
				this.hint(`During this battle, ${source.illusion ? source.illusion.name : source.name} will always summon the same Baneful Transformation. You should try to deduce its identity over the course of the battle!`, true, source.side.foe);
			}
			return !!this.canSwitch(source.side);
		},
		selfSwitch: true,
		onPrepareHit(target, source, move) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Black Hole Eclipse", source); // yeah I don't even know--
			this.add('-anim', source, "Moonlight", source);
		},
		condition: {
			// mechanical distinctions of the monster (not at all sure if any or all of these will be kept)
			onEffectiveness(typeMod, target, type, move) { // Neurotoxin
				if (!target || move.category === 'Status' || !target.runImmunity(move.type)) return;
				if (this.activePokemon.status === 'psn' || this.activePokemon.status === 'tox') return 0;
			},
			onSourceModifyDamage(damage, source, target, move) {
				if (!(target.getMoveHitData(move).typeMod > 0)) { // reduce damage taken
					return this.chainModify([3, 4]);
				}
			},
			onTryHeal(damage, target, source, effect) { // reduce healing
				return this.chainModify([3, 4]); // this is meant to even out with the reduced damage taken
			},
			onModifySpe(spe, pokemon) { // reduce Speed
				return this.chainModify(0.5);
			},

			// should appear as a monster
			onBeforeSwitchIn(pokemon) {
				const newPoke = new Pokemon(pokemon.set, pokemon.side);
				const doNotCarryOver = [
					'baseSpecies', 'species', 'gender', 'name',
					'fullname', 'side', 'fainted', 'status', 'hp', 'illusion',
					'transformed', 'position', 'isActive', 'faintQueued',
					'subFainted', 'getHealth', 'getDetails', 'moveSlots', 'ability',
				];
				for (const [key, value] of Object.entries(pokemon)) {
					if (doNotCarryOver.includes(key)) continue;
					// @ts-ignore
					newPoke[key] = value;
				}
				newPoke.gender = '';
				newPoke.baseSpecies = {
					id: 'banefultransformation',
					name: 'Baneful Transformation',
					forme: '',
					types: ["???"],
					baseStats: {hp: 60, atk: 60, def: 85, spa: 85, spd: 75, spe: 111},
					weightkg: 13,
				};
				newPoke.species = newPoke.baseSpecies;
				newPoke.clearVolatile();
				pokemon.illusion = newPoke;
				pokemon.illusion.name = "???";
				pokemon.illusion.set.name = "???";
			},
			onSwap(pokemon) {
				this.add('-message', `Grrrrrr...`);
				// this.add(`raw|<img src="IMAGE URL HERE" height="14" width="32">`); // would be fun to add a visual here :D (but I haven't made one yet P:)
				if (!pokemon.m.werewolfHints && pokemon.m.wolfsbane && pokemon.m.wolfsbane.name) {
					this.hint(`This must be one of ${pokemon.m.wolfsbane.name}'s allies, but which one?`);
					this.hint(`The Baneful Transformation will take less damage from moves, unless they're super effective. However, its Speed and HP recovery are also reduced.`);
					pokemon.m.werewolfHints = true;
				}
				this.add('-ability', pokemon, 'Neurotoxin');
				this.add('-message', `The Baneful Transformation won't take super-effective damage from poisoned attackers!`);
			},
			// tiny bit of backup to make sure the original Wolfsbrain's properties aren't messed with... should test to see if this matters!
			onSwitchOut(pokemon) {
				pokemon.illusion = null;
			},
			onFaint(pokemon) {
				pokemon.illusion = null;
				this.add('-end', pokemon, 'Illusion');
				this.add('-message', `The Baneful Transformation was ${pokemon.name}!`);
			},

			// moves hidden while appearing as a monster
			onModifyMove(move, source, target) {
				move.name = 'an unknown move';
			},
			onPrepareHit(target, source, move) {
				if (source === this.effectState.target) {
					this.attrLastMove('[still]');
					this.add('-anim', source, "Mist");
				}
			},
		},
		target: "normal",
		type: "Psychic",
		contestType: "Clever",
	},
};
