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
				if (possibleTarget.wolfsbane && possibleTarget !== source) {
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
				return !!this.switchIn(werewolf, source.position, 'banefultransformation', true);
			}
			if (this.canSwitch(source.side)) {
				this.hint(`Select a Pokémon to become your team's Baneful Transformation!`, true, source.side);
				this.hint(`From now on, when you use Baneful Transformation, you'll only be able to switch to the Pokémon you choose now.`, true, source.side);
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
					return this.chainModify([2, 3]); // this might be too extreme, but we can come back to it
				}
			},
			onTryHeal(damage, target, source, effect) { // reduce healing
				return this.chainModify([2, 3]); // this is meant to even out with the reducted damage taken
			},
			onModifySpe(spe, pokemon) { // reduce Speed
				return this.chainModify(0.5);
			},

			// should appear as a monster
			onBeforeSwitchIn(pokemon) {
				const newPoke = new Pokemon(pokemon.set, pokemon.side);
				const doNotCarryOver = [
					'fullname', 'side', 'fainted', 'status', 'hp', 'illusion',
					'transformed', 'position', 'isActive', 'faintQueued',
					'subFainted', 'getHealth', 'getDetails', 'moveSlots', 'ability',
					'species', 'gender', 'name',
				];
				for (const [key, value] of Object.entries(pokemon)) {
					if (doNotCarryOver.includes(key)) continue;
					// @ts-ignore
					newPoke[key] = value;
				}
				newPoke.name = '???';
				newPoke.gender = '';
				newPoke.species = {
					id: 'banefultransformation',
					name: 'Baneful Transformation',
					forme: '',
					types: ["???"],
				};
				newPoke.clearVolatile();
				pokemon.illusion = newPoke;
			},
			onStart(pokemon) {
				if (pokemon.illusion) pokemon.illusion.name = 'The Baneful Transformation'; // should still appear as ??? on the health bar, I hope!
				this.add('-message', `Grrrrrr...`);
				// this.add(`raw|<img src="IMAGE URL HERE" height="14" width="32">`); // would be fun to add a visual here :D (but I haven't made one yet P:)
				if (!pokemon.m.werewolfHints && pokemon.m.wolfsbane && pokemon.m.wolfsbane.name) {
					this.hint(`This must be one of ${pokemon.m.wolfsbane.name}'s allies, but which one?`);
					this.hint(`The Baneful Transformation's identity is a secret. It's impossible to tell what moves it uses—or even how much HP it has left!`);
					this.hint(`The Baneful Transformation will take less damage from moves, unless they're super effective. However, its Speed and HP recovery are also reduced.`);
					this.hint(`During this battle, ${pokemon.m.wolfsbane.name} will always summon the same Baneful Transformation. You should try to deduce its identity over the course of the battle!`);
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
					this.add('-anim', source, "Mist", source);
				}
			},
		},
		target: "normal",
		type: "Psychic",
		contestType: "Clever",
	},
};
