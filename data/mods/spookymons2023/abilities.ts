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
		shortDesc: "Doesn't do anything yet.",
		// doesn't do anything yet P:
		name: "Divide",
		rating: 4,
		num: -2002,
	},
};
