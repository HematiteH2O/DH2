export const Scripts: {[k: string]: ModdedBattleScriptsData} = {
	inherit: 'gen8',
	gen: 8,
	teambuilderConfig: {
		excludeStandardTiers: true,
		customTiers: ['Mega', 'Kalos', 'Kalos (NFE)'],
		customDoublesTiers: ['Mega', 'Kalos', 'Kalos (NFE)'],
	},
	init() {
		for (const id in this.dataCache.Pokedex) {
			const pokemon = this.dataCache.Pokedex[id];

			if (pokemon.movepoolAdditions) {
				for (const move of pokemon.movepoolAdditions) {
					this.modData('Learnsets', this.toID(id)).learnset[this.toID(move)] = ["8M"];
				}
			}

			if (!pokemon || !pokemon.mega) continue; // weeding out Pokémon that aren't new Megas
			const newMega = this.dataCache.Pokedex[pokemon.mega] = {name: pokemon.megaName};

			pokemon.otherFormes = pokemon.otherFormes ? pokemon.otherFormes.concat([newMega.name]) : [pokemon.megaName];
			pokemon.formeOrder = pokemon.formeOrder ? pokemon.formeOrder.concat([newMega.name]) : [pokemon.name, pokemon.megaName];

			newMega.num = pokemon.num;
			newMega.baseSpecies = pokemon.name;
			newMega.forme = "Mega";

			newMega.types = pokemon.megaType || pokemon.types;
			newMega.abilities = pokemon.megaAbility || pokemon.abilities;
			newMega.baseStats = pokemon.megaStats || pokemon.baseStats;
			newMega.heightm = pokemon.megaHeightm || pokemon.heightm;
			newMega.weightkg = pokemon.megaWeightkg || pokemon.weightkg;
			newMega.eggGroups = pokemon.eggGroups;
			newMega.color = pokemon.megaColor || pokemon.color;

			newMega.creator = pokemon.megaCreator || null;
			newMega.requiredItem = pokemon.megaStone || null;
			if (!this.modData('FormatsData', pokemon.mega)) this.data.FormatsData[pokemon.mega] = {tier: "Mega"};
		}
	},
	canMegaEvo(pokemon) { // modded for forms
		const altForme = pokemon.baseSpecies.otherFormes && this.dex.species.get(pokemon.baseSpecies.otherFormes[0]);
		const item = pokemon.getItem();
		if (
			altForme?.isMega && altForme?.requiredMove &&
			pokemon.baseMoves.includes(this.toID(altForme.requiredMove)) && !item.zMove
		) {
			return altForme.name;
		}
		if (item.name === "Wormadamite" && (pokemon.baseSpecies.name === "Wormadam" || pokemon.baseSpecies.name === "Wormadam-Trash")) {
			return null;
		}
		if (item.name === "Hoopanite" && (pokemon.baseSpecies.name === "Hoopa-Unbound")) return null;
		if (item.megaEvolves !== pokemon.baseSpecies.name || item.megaStone === pokemon.species.name) {
			return null;
		}
		return item.megaStone;
	},
	pokemon: {
		ignoringItem() { // modded for Hyperspace Mayhem: even if the holder has an item, the summoned Pokémon doesn't!
			return !!(
				this.itemState.knockedOff || // Gen 3-4
				(this.battle.gen >= 5 && !this.isActive) ||
				(!this.getItem().ignoreKlutz && this.hasAbility('klutz')) ||
				this.volatiles['embargo'] || this.volatiles['hyperspacemayhem'] || this.battle.field.pseudoWeather['magicroom']
			);
		},
		formeChange( // modified for Hyperspace Mayhem
			speciesId: string | Species, source: Effect = this.battle.effect,
			isPermanent?: boolean, message?: string
		) {
			const rawSpecies = this.battle.dex.species.get(speciesId);

			const species = this.setSpecies(rawSpecies, source);
			if (!species) return false;

			if (this.battle.gen <= 2) return true;

			// The species the opponent sees
			const apparentSpecies =
				this.illusion ? this.illusion.species.name : species.baseSpecies;
			if (isPermanent) {
				this.baseSpecies = rawSpecies;
				this.details = species.name + (this.level === 100 ? '' : ', L' + this.level) +
					(this.gender === '' ? '' : ', ' + this.gender) + (this.set.shiny ? ', shiny' : '');
				let details = (this.illusion || this).details;
				if (this.terastallized) details += `, tera:${this.terastallized}`;
				this.battle.add('detailschange', this, details);
				if (source.effectType === 'Item') {
					this.canTerastallize = null; // National Dex behavior
					if (source.zMove) {
						this.battle.add('-burst', this, apparentSpecies, species.requiredItem);
						this.moveThisTurnResult = true; // Ultra Burst counts as an action for Truant
					} else if (source.onPrimal) {
						if (this.illusion) {
							this.ability = '';
							this.battle.add('-primal', this.illusion, species.requiredItem);
						} else {
							this.battle.add('-primal', this, species.requiredItem);
						}
					} else {
						// So a Mega Evolution message isn't sent while we're waiting on Ogerpon text
						if (source.megaEvolves) {
							this.battle.add('-mega', this, apparentSpecies, species.requiredItem);
						}
						this.moveThisTurnResult = true; // Mega Evolution counts as an action for Truant
					}
				} else if (source.effectType === 'Status') {
					// Shaymin-Sky -> Shaymin
					this.battle.add('-formechange', this, species.name, message);
				}
			} else {
				if (source.effectType === 'Ability') {
					this.battle.add('-formechange', this, species.name, message, `[from] ability: ${source.name}`);
				} else if (source.id === 'hyperspacemayhem') {
					this.battle.add('-formechange', this, this.illusion ? this.illusion.species.name : species.name, '[silent]');
				} else {
					this.battle.add('-formechange', this, this.illusion ? this.illusion.species.name : species.name, message);
				}
			}
			if (isPermanent && !['disguise', 'iceface'].includes(source.id)) {
				if (this.illusion) {
					this.ability = ''; // Don't allow Illusion to wear off
				}
				this.setAbility(species.abilities['0'], null, true);
				this.baseAbility = this.ability;
			}
			if (source.id === 'hyperspacemayhem') {
				if (this.volatiles['hyperspacemayhem']) this.setAbility('Hyperspace Mayhem');
				else this.setAbility(species.abilities['0'], null, true);
			}
			if (this.terastallized) {
				this.knownType = true;
				this.apparentType = this.terastallized;
			}
			return true;
		}
	},
};
