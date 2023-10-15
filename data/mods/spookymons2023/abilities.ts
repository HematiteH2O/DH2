import {Pokemon} from "../../../sim/pokemon";

export const Abilities: {[abilityid: string]: ModdedAbilityData} = {
	neurotoxin: {
		shortDesc: "Suppresses the type advantages of moves used by poisoned attackers.",
		onStart(source) {
			this.add('-ability', source, 'Neurotoxin');
			this.add('-message', `${(source.illusion ? source.illusion.name : source.name)} won't take super-effective damage from poisoned attackers!`);
			this.field.addPseudoWeather('neurotoxin');
			// not meant to be obvious that this is a pseudoWeather; it's just for coding convenience
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target || move.category === 'Status' || !target.runImmunity(move.type)) return;
			if (this.activePokemon.status === 'psn' || this.activePokemon.status === 'tox') return 0;
		},
		name: "Neurotoxin",
		rating: 4,
		num: -2001,
	},
	divide: {
		shortDesc: "The first time the Pokémon's HP falls below half, it self-replicates...",
		onEmergencyExit(target) {
			if (this.effectState.busted) return; // only once per battle aksdjfh
			if (target.baseSpecies.name === 'Starmie-Fallen' && !target.transformed) {
				this.effectState.busted = true; // making sure right away--
				this.add('-activate', target, 'ability: Divide');
				this.add('-message', `${(target.illusion ? target.illusion.name : target.name)} cast off the injured part of its body...`);
				this.add('-anim', target, "Double Team", target);
				target.side.pokemonLeft++;
				target.side.pokemon.length++;

				const newPoke = new Pokemon(target.set, target.side);
				const newPos = target.side.pokemon.length - 1;
				const doNotCarryOver = [
					'm',
					'fullname', 'side', 'fainted', 'status', 'hp', 'illusion',
					'transformed', 'position', 'isActive', 'faintQueued',
					'subFainted', 'getHealth', 'getDetails', 'moveSlots', 'ability',
				];
				for (const [key, value] of Object.entries(target)) {
					if (doNotCarryOver.includes(key)) continue;
					// @ts-ignore
					newPoke[key] = value;
				}
				newPoke.species = this.dex.species.get('starmierisen');
				newPoke.baseSpecies = this.dex.species.get('starmierisen');
				newPoke.baseMaxhp = Math.floor(Math.floor(
				2 * newPoke.species.baseStats['hp'] + newPoke.set.ivs['hp'] + Math.floor(newPoke.set.evs['hp'] / 4) + 100
			) * newPoke.level / 100 + 10);
				newPoke.maxhp = newPoke.baseMaxhp;

				// for Gemini Laser:
				newPoke.m.complement = target;
				target.m.complement = newPoke;

				newPoke.clearVolatile();
				newPoke.position = newPos;
				target.side.pokemon[newPos] = newPoke;

				if (newPoke.position < target.side.active.length) {
					this.queue.addChoice({
						choice: 'instaswitch',
						pokemon: newPoke,
						target: newPoke,
					});
				}
				newPoke.fainted = false;
				newPoke.faintQueued = false;
				newPoke.subFainted = false;
				newPoke.status = '';
				newPoke.hp = 1; // Needed so hp functions works
				newPoke.sethp(newPoke.maxhp / 2);
				this.add('-heal', newPoke, newPoke.getHealth, '[from] move: Revival Blessing');

				this.add('poke', target.side.pokemon[newPos].side.id, target.side.pokemon[newPos].details, '');
				this.add('-message', `${newPoke.name} was added to ${newPoke.side.name}'s team!`);
			}
		},
		name: "Divide",
		rating: 4,
		num: -2002,
	},
};
