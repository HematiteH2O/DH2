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
			
			// randbats initialization
			if (
				this.modData('FormatsData', id) && this.modData('FormatsData', id).tier &&
				(this.modData('FormatsData', id).tier === "Evo!" || this.modData('FormatsData', id).tier === "(Prevo)")
			) {
				
				// basic structure
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
				
				if (this.modData('FormatsData', id).tier === "Evo!" || ['porygon2', 'accelgor'].includes(id)) newMon.randbats.stage = 'Evo';
				else if (newMon.evos && newMon.evos.length && !newMon.prevo && !['mareanie'].includes(id)) newMon.randbats.stage = 'LC';

				// basic information
				newMon.randbats.types.push(newMon.types[0]);
				if (newMon.types[1]) newMon.randbats.types.push(newMon.types[1]);
				newMon.randbats.abilities.push(newMon.abilities[0]);
				if (newMon.abilities[1]) newMon.randbats.abilities.push(newMon.abilities[1]);
				if (newMon.abilities['H']) newMon.randbats.abilities.push(newMon.abilities['H']);
				if (newMon.abilities['S']) newMon.randbats.abilities.push(newMon.abilities['S']);

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
						if (this.dataCache.TypeChart[type1.toLowerCase()].damageTaken[type] === 1 && !weaknesses.includes(type)) { // weakness
							weaknesses.push(type);
						} else if (this.dataCache.TypeChart[type1.toLowerCase()].damageTaken[type] === 2 && !resistances.includes(type)) { // resistance
							resistances.push(type);
						} else if (this.dataCache.TypeChart[type1.toLowerCase()].damageTaken[type] === 3 && !immunities.includes(type)) { // immunity
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
					if (['Drought', 'Storm Chaser'].includes(ability)) {
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
							if (this.dataCache.TypeChart[type.toLowerCase()].damageTaken[newMon.types[0]] === 1) {
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
								baseMove: null,
								moves: null,
								
								ability: ability,
								item: null,
								evs: {},
								teraType: null,

								offeredSupport: [],
								singles: {
									requestedSupport: [],
									acceptedSupport: [],
								},
								vgc: {
									requestedSupport: [],
									acceptedSupport: [],
								},

								moveType: null,
								moveBasePower: null,
								moveCategory: null,
								movePriority: null,
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
								baseMove: null,
								moves: null,
								
								ability: ability,
								item: null,
								evs: {},
								teraType: null,

								offeredSupport: [],
								singles: {
									requestedSupport: [],
									acceptedSupport: [],
								},
								vgc: {
									requestedSupport: [],
									acceptedSupport: [],
								},

								moveType: null,
								moveBasePower: null,
								moveCategory: null,
								movePriority: null,
							};
							newMon.randbats.offeredSupport[`${(resistance).toLowerCase()}resist`].push(fragment);
						}
					} else newMon.randbats.offeredSupport[`${(resistance).toLowerCase()}resist`] = newMon.randbats.resistances[resistance];
				}

				// then I can start iterating over the movepool!
				// but first...
				if (!newMon.randbats.stage || (newMon.randbats.singles.banned && newMon.randbats.vgc.banned)) continue;
				// ... don't bother with any more randbats data if it's not eligible to be chosen anyway!
				
				let learnset = this.dataCache.Learnsets[id].learnset;
				if (newMon.baseSpecies && newMon.baseSpecies === 'Rotom') learnset = this.dataCache.Learnsets.rotom.learnset;
				// going to handle their form-specific moves separately; this is fine for here!
				if (!learnset) continue;
				
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
					
					let move = this.dataCache.Moves[moveid];
					let basePower = move.basePower;

					// some moves like Grass Knot have misleading base powers to begin with, so
					// TODO: list and override them here
					// at a glance, ctrl + F basePowerCallback is a good way to do this
					switch (moveid) {
						case 'Grass Knot':
							basePower = 60; // some of these are gonna be arbitrary :'D
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
						switch (ability) {
							case 'Aerilate':
								if (move.type === 'Normal' && basePower && !noModifyType.includes(moveid)) {
									let modFragment = {
										ability: 'Aerilate',
										moveType: 'Flying',
										moveBasePower: basePower * 1.2,
									};
									fragments.push(modFragment);
								}
								break;
						}
					}
					
					// fill in default information
					for (const fragment of fragments) {
						if (!fragment.baseMove) fragment.baseMove = move.name;
						if (!fragment.moves) fragment.moves = [move.name];
						
						if (!fragment.ability) fragment.ability = null;
						if (!fragment.item) fragment.item = null;
						if (!fragment.evs) fragment.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
						if (!fragment.teraType) fragment.teraType = null;
						
						if (!fragment.offeredSupport) fragment.offeredSupport = [];
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

					for (const fragment of fragments) {
						
					// support requirements before any context
						if (moveid === 'risingvoltage' && fragment.ability !== 'Electric Surge') {
							fragment.moveBasePower *= 2;
							fragment.singles.requestedSupport.push('electricterrain');
							fragment.vgc.requestedSupport.push('electricterrain');
						}
						if (moveid === 'expandingforce' && fragment.ability !== 'Psychic Surge') {
							fragment.moveBasePower *= 1.5;
							fragment.singles.requestedSupport.push('psychicterrain');
							fragment.vgc.requestedSupport.push('psychicterrain');
						}
						if (moveid === 'grassyglide' && fragment.ability !== 'Grassy Surge') {
							fragment.movePriority += 1;
							fragment.singles.requestedSupport.push('grassyterrain');
							fragment.vgc.requestedSupport.push('grassyterrain');
						}
						// Misty Explosion doesn't actually want Misty Terrain support

					// general / STAB
						const viableStabs = [
							'firepunch', 'flamethrower', 'flareblitz', 'fireblast', 'overheat',
							'scald', 'liquidation', 'hydropump',
						];
						if (viableStabs.includes(moveid)) {
							// this allows for non-STAB moves if they're as strong as a STAB anyway, but I set the bar a little higher for now
							// this will sometimes be the case for moves like Shiftry's Double-Edge or Repehk's Weather Ball!
							// later on, I should be ready to check for how many unique types of "STABs" are covered;
							// if there are at least 2 types in viableStabs, then the set should try to have viableStabs of any 2 types
							
							let modFragment = Utils.deepClone(fragment);
							if (!fragment.stab && !fragment.teraType) modFragment.teraType = fragment.moveType;
							if (fragment.moveBasePower >= 90 || (fragment.stab && fragment.moveBasePower >= 80)) newMon.randbats.viableStabs.push(modFragment);
							if (fragment.moveBasePower >= 120 && !fragment.item) {
								// this will be a good threshold for choice item sets... I think
								if (!newMon.randbats.offeredSupport.choicebreaker) newMon.randbats.offeredSupport.choicebreaker = [];
								modFragment.item = (fragment.moveCategory === 'Physical' ? 'Choice Band' : 'Choice Specs');
								newMon.randbats.offeredSupport.choicebreaker.push(modFragment);
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
								newMon.randbats.offeredSupport.priority.push(fragment);
							} else if (fragment.moveBasePower && !fragment.stab && !fragment.teraType && fragment.moveType !== 'Normal') {
								// push to "spicy" for some last-pick set filler
								if (!newMon.randbats.spicy) newMon.randbats.spicy = [];
								let modFragment = Utils.deepClone(fragment);
								modFragment.teraType = fragment.moveType;
								newMon.randbats.spicy.push(modFragment);
							}
						}
						// spread
						if ((move.target === 'allAdjacentFoes' || moveid === 'expandingforce') && fragment.moveBasePower > 60 && moveid !== 'razorwind') {
							if (!newMon.randbats.offeredSupport.spread) newMon.randbats.offeredSupport.spread = [];
							newMon.randbats.offeredSupport.spread.push(fragment);
						}
						if (move.target === 'allAdjacent' && fragment.moveBasePower >= 80 && !move.selfdestruct && moveid !== 'synchronoise') {
							let modFragment = Utils.deepClone(fragment);
							modFragment.vgc.requestedSupport.push(`${(fragment.moveType).toLowerCase()}immune`); // ex. "electricimmune"
							
							if (!newMon.randbats.offeredSupport.spread) newMon.randbats.offeredSupport.spread = [];
							newMon.randbats.offeredSupport.spread.push(modFragment);

							// ex. "sideelectric"
							if (!newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}`]) newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}`] = [];
							newMon.randbats.offeredSupport[`side${(fragment.moveType).toLowerCase()}`].push(modFragment);
						}
						if ([
							'tailwind', 'trickroom', 'stickyweb', 'silktrap',
							'bulldoze', 'cottonspore', 'stringshot',
							'electroweb', 'icywind', 'glaciate',
							'thunderwave', 'nuzzle',
							'syrupbomb', 'tarshot',
						].includes(moveid) ||
							 ([
								 'lowsweep', 'mudshot', 'drumbeating', 'pounce',
							 ].includes(moveid) && fragment.moveBasePower > 80) ||
							 (moveid === 'scaryface' && fragment.movePriority > 0)
							) {
							if (!newMon.randbats.offeredSupport.speedcontrol) newMon.randbats.offeredSupport.speedcontrol = [];
							newMon.randbats.offeredSupport.speedcontrol.push(fragment);
						}
						if ([ // okay I'll revise this one in a bit but let's just see how it's going for now
							'reflect', 'lightscreen', 'auroraveil',
							// 'quickguard', 'wideguard', // should really be elsewhere
							'followme', 'ragepowder',
							'growl', 'babydolleyes', 'charm', 'tickle', 'featherdance', 'kingsshield', 'bittermalice', 'breakingswipe', 'chillingwater', 'lunge', 'strengthsap', 'tropkick',
							'captivate', 'snarl', 'strugglebug', 'mysticalfire', 'eerieimpulse',
							'memento', 'nobleroar', 'tearfullook', 'partingshot',
							'grasswhistle', 'hypnosis', 'lovelykiss', 'sing', 'sleeppowder', 'spore', 'yawn'
						].includes(moveid) && !(move.accuracy && move.accuracy < 70)) {
							if (!newMon.randbats.offeredSupport.damagereduction) newMon.randbats.offeredSupport.damagereduction = [];
							newMon.randbats.offeredSupport.damagereduction.push(fragment);
						}
						
/*
singles ['choicebreaker', 'priority', 'entryhazard', 'hazardcontrol', 'knockoff', 'contactpunish', 'electricimmune', 'groundimmune'];
*/
					// singles:
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
		if (!team.length && this.randomChance(1, 100)) shiny = true; // the whole team will be Shiny 1% of the time


		
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


		
		// now let's gather a list of eligible Pokémon to use for the rest of the process
		let eligiblePokemon = [];
		for (const id in this.dex.data.Pokedex) {
			if (
				this.dex.data.Pokedex[id].randbats && // in the format/has randbats data
				!originalTeamSpecies.includes(id) && !originalTeamNumbers.includes(this.dex.data.Pokedex[id].num) && // species clause
				!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) && // not banned
				(!monotype || this.dex.data.Pokedex[id].randbats.types.includes(monotype)) && // account for monotype
				(this.dex.data.Pokedex[id].randbats.stage && this.dex.data.Pokedex[id].randbats.stage === stage) // account for LC
			) eligiblePokemon.push(id);
		}
		if (!eligiblePokemon.length || 6 > (team.length + eligiblePokemon.length)) { // shouldn't be an issue but just in case
			monotype = null;
			for (const id in this.dex.data.Pokedex) {
				if (
					this.dex.data.Pokedex[id].randbats && // in the format/has randbats data
					!originalTeamSpecies.includes(id) && !originalTeamNumbers.includes(this.dex.data.Pokedex[id].num) && // species clause
					!(this.dex.data.Pokedex[id].randbats[format] && this.dex.data.Pokedex[id].randbats[format].banned) && // not banned
					(this.dex.data.Pokedex[id].randbats.stage && this.dex.data.Pokedex[id].randbats.stage === stage) // account for LC
				) eligiblePokemon.push(id);
			}
		}
		if (!eligiblePokemon.length) return team; // I don't think this can even happen


		
		// Okay, now we know our format, whether or not we're playing LC, a list of originalTeamSpecies, and the entire pool of eligiblePokemon and their randbats data
		// Next, we should start evaluating what we have so far and what we need for a team

		let baseRequestedSupport = [];
		// These are a kind of default checklist for each format, but there will be more specific requests as team members are evaluated
		if (format === "vgc") baseRequestedSupport = ['fakeout', 'priority', 'spread', 'speedcontrol', 'damagereduction'];
		else baseRequestedSupport = ['choicebreaker', 'priority', 'entryhazard', 'hazardcontrol', 'knockoff', 'contactpunish', 'electricimmune', 'groundimmune'];
		
		// I also definitely need to evaluate the base team members for their requestedSupport, offeredSupport and acceptedSupport, but...
		// I'm not ready to do that just yet, so I'll leave them blank for now.
		// I'll come back to this after I've gone over the main support list!
		
		if (team.length) {
			for (const pokemon of team) {
				pokemon.requestedSupport = {};
				pokemon.offeredSupport = {};
				pokemon.acceptedSupport = {};
			}
		}
		
		// Now, we can start picking a first pass of team members
		// For now, when we decide something, we should push it to selectedRandSpecies, not to the team just yet; we'll get to build sets later!
		// That said...
		const firstDraftTeam = [];
		if (team.length) for (const pokemon of team) firstDraftTeam.push(pokemon);
		// ... it's still useful to have a copy that can track everything we need right away!

		for (let i = 0; i < (6 - team.length); ++i) {
			let currentStep = [];
			// before I forget:
			// if a team started completely empty, I want the first Pokémon selected to be a completely random Evo 2 sub - never a canon Pokémon and not weighted in any way
			if (i === 0 && !team.length) {
				currentStep = eligiblePokemon.filter(id => this.dex.data.Pokedex[id].copyData);
			} else {
				let requestedSupportInGeneral = [];
				let offeredSupportInGeneral = {}; // this one is not just a list, but how many of each
				
				let requestedSupportThisStep = [];
				let offeredSupportThisStep = [];
				let acceptedSupportThisStep = [];
				
				let teamNumbersThisStep = [];
				let resistancesThisStep = [];
				if (firstDraftTeam.length) {
					for (const request of baseRequestedSupport) if (!requestedSupportInGeneral.includes(request)) requestedSupportInGeneral.push(request);
					for (const pokemon of firstDraftTeam) {
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
						}
					}

					// TODO: filter requestedSupportInGeneral - make sure at least one thing in the eligible pool is offering it, and just skip it if not?
					
					requestedSupportThisStep = requestedSupportInGeneral.filter(
						request => (!offeredSupportInGeneral[request])
					); // if it's not at all represented
					
					if (!requestedSupportThisStep.length) { // ... or if all of them are represented, but this one is one of the least represented
						/*
						let minOffer = 6;
						for (const offer in offeredSupportInGeneral) if (requestedSupportInGeneral.includes(offer) && minOffer > offeredSupportInGeneral[offer]) minOffer = offeredSupportInGeneral[offer];
						*/
						// actually, we don't need *that* many alternates - I'm just gonna say "secure 1 backup plan for each role" before other things become more important
						requestedSupportThisStep = requestedSupportInGeneral.filter(
							request => (offeredSupportInGeneral[request] === 1)
						);
					}
					
					console.log(resistancesThisStep);
					console.log(`requested this step: ` + requestedSupportThisStep);
				}
				
				// first, we want to find offeredSupport that matches our requestedSupport
				if (requestedSupportThisStep.length) {
					// score them by how many roles they can fill, up to 3
					let maxScore = 0;
					for (const id of eligiblePokemon) {
						// species clause
						if (teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num)) continue;
						
						let score = 0;
						for (const role of requestedSupportThisStep) if (this.dex.data.Pokedex[id].randbats.offeredSupport[role]) score++;
						if (score > 3) score = 3; // you need space for STABs and stuff too - let's not spread one Pokémon too thin (I might change the threshold or how I handle this later)
						if (score > maxScore) { // reset
							currentStep = [];
							maxScore = score;
						}
						if (score === maxScore) currentStep.push(id);
					}
				}
				if (!currentStep.length) currentStep = eligiblePokemon.filter(id => !teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num));
	
				// then, we'll try to look for anything with acceptedSupport that matches our offeredSupport
				if (offeredSupportThisStep.length) {
					// score them by how many roles they can fill, up to 3
					let desiredSupport = [];
					for (const id of currentStep) {
						// species clause
						if (teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num)) continue;
						
						// for now, I think just a yes or a no is fine
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
					if (teamResistScore > 5) teamResistScore = 5; // you don't need to cover *that* many every step
					
					if (teamResistScore > teamResistMaxScore) { // reset
						teamResists = [];
						teamResistMaxScore = teamResistScore;
					}
					if (teamResistScore === teamResistMaxScore) teamResists.push(id);
				}
				if (teamResists.length) currentStep = teamResists;
				
				// previously, if we had already covered an acceptedSupport, we didn't make it a priority to get it again - it's more important to narrow down by the other criteria
				// if it's still an option now, though, let's definitely take it!
				if (offeredSupportThisStep.length) {
					// score them by how many roles they can fill, up to 3
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
			}
			
			// safety nets
			if (!currentStep.length) currentStep = eligiblePokemon.filter(id => !teamNumbersThisStep.includes(this.dex.data.Pokedex[id].num));
			if (!currentStep.length) continue;
			
			// and... now we get to choose a Pokémon!
			let chosenRandomPokemon = this.sample(currentStep);
			firstDraftTeam.push({
				name: this.dex.data.Pokedex[chosenRandomPokemon].name,
				species: this.dex.data.Pokedex[chosenRandomPokemon].name,
				offeredSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats.offeredSupport,
				requestedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].requestedSupport,
				acceptedSupport: this.dex.data.Pokedex[chosenRandomPokemon].randbats[format].acceptedSupport,
				coveredStabs: [],
			});
		}
		console.log(firstDraftTeam);

		// okay, now it gets the tiniest bit more complicated
		// we're gonna do the same loop, iterating over however many species we just randomly selected, in the same order we selected them
		// but this time, we have 5 other Pokémon for context - the idea is to revisit each individual slot as if it's the last one being picked
		// this gives us a chance to maximize synergy, but also to recognize which roles came up more than we expected -
		// maybe we chose a Pokémon for having Intimidate at the time, but now we have two other Intimidators, so we can look for other roles we need more
		// the steps should be *pretty much* an exact copy of the above loop!
		// one thing: this time, we need to pay more attention to offeredSupport/acceptedSupport pairings that are already being fulfilled; those should be considered urgent to keep!





		// TODO: fill in randbats data per species based on learnsets (the fun part!)
		
		// TODO: iterate over existing team members based on the same criteria
		// // - identify which roles they already cover
		// // - identify "requested support" (top-priority: something like Grassy Surge is mandatory if a Pokémon has a Grassy Seed)
		// // - identify "accepted support" (gives bonus points when deciding between candidates for another role, but it's not its own step - something like any terrain for Aleon)
		// this should be easy, but I want to do as much of the randbats data first because there's so much overlap

		// TODO: second-pass "for" loop (almost just a copy-paste of the original at this point - just saving it for the end so I don't have to make a bunch of changes twice)

		// WIP: set constructor
		let sets = [];
		if (firstDraftTeam.length) {
			for (const set of firstDraftTeam) {
				let randomized = true;
				if (team.length) {
					for (const pokemon of team) {
						if (pokemon.species === set.species) randomized = false;
					}
				}
				if (randomized) sets.push(set);
			}
		}

		// TODO: enforce anything mandatory, including both format-specific mandatory moves and Abilities from the randbats data and. like. *actual* mandatory stuff like form items, battleOnly or required Tera Types
		
		// TEAMWIDE SET CONSTRUCTION: FRAGMENTS
		let eligibleFragments = true;
		let fragmentsList = [];
		
		for (const set of sets) {
			// push everything in viableStabs, offeredSupport, [format].requestedSupport and [format].acceptedSupport
			// note that viableStabs is intentionally not sorted by type - for instance viableStabs.flying doesn't exist; all of the fragments are in viableStabs right now
			for (const fragment of this.dex.species.get(set.species).randbats.viableStabs) {
				if (typeof fragment === 'string') continue;
				let modFragment = Utils.deepClone(fragment);
				modFragment.pokemon = set;
				modFragment.role = 'mainstab'; // actually I don't want this to specify a type either
				fragmentsList.push(modFragment);
			}
			for (const offeredSupport in this.dex.species.get(set.species).randbats.offeredSupport) {
				for (const fragment of this.dex.species.get(set.species).randbats.offeredSupport[offeredSupport]) {
					if (typeof fragment !== 'string') {
						let modFragment = Utils.deepClone(fragment);
						modFragment.pokemon = set;
						modFragment.role = offeredSupport;
						fragmentsList.push(modFragment);
					}
				}
			}
			for (const requestedSupport in this.dex.species.get(set.species).randbats[format].requestedSupport) {
				for (const fragment of this.dex.species.get(set.species).randbats[format].requestedSupport[requestedSupport]) {
					if (typeof fragment !== 'string') {
						let modFragment = Utils.deepClone(fragment);
						modFragment.pokemon = set;
						fragmentsList.push(modFragment);
					}
				}
			}
			for (const acceptedSupport in this.dex.species.get(set.species).randbats[format].acceptedSupport) {
				for (const fragment of this.dex.species.get(set.species).randbats[format].acceptedSupport[acceptedSupport]) {
					if (typeof fragment !== 'string') {
						let modFragment = Utils.deepClone(fragment);
						modFragment.pokemon = set;
						fragmentsList.push(modFragment);
					}
				}
			}
		}

		// outside the loop
		let teamOfferedSupport = [];
		let teamHighPrioRequestedSupport = [];
		
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
			}
			// TODO: leave room for STABs
			// // I thhhink it works in my favor to pick STABs last, but that also means I want to leave room for them - that means I should count how many types of viable STABs are already on the set and compare it to my target
			// // if the target isn't met, I should subtract it from the amount of space I have left for moves
			// // I do think I need to recalculate the target each step
			// // for instance, Aerilate Flying moves may be the closest Shiftry-Johto gets to a "viable STAB" in some formats, but they stop being an option at all if it commits to another Ability first

			// STEP 2: fragment eligibility
			for (const fragment of fragmentsList) {
				fragment.eligible = true;
				fragment.lowpriority = false;
				fragment.highpriority = false;
				
				if (fragment.ability && fragment.pokemon.ability) {
					if (fragment.ability === fragment.pokemon.ability) fragment.ability = null;
					else fragment.eligible = false;
				}
				if (fragment.item && fragment.pokemon.item) {
					if (fragment.item === fragment.pokemon.item) fragment.item = null;
					else fragment.eligible = false;
				}
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
				// TODO: item clause later
				
				if (
					!fragment.ability && !fragment.item && !fragment.teraType && !(fragment.moves && fragment.moves.length) && !(
						fragment.evs && (fragment.evs['hp'] > 0 || fragment.evs['atk'] > 0 || fragment.evs['def'] > 0 || fragment.evs['spa'] > 0 || fragment.evs['spd'] > 0 || fragment.evs['spe'] > 0)
					)
				) {
					// the fragment is already complete, so I should also check it off of the role tally and then delete it from the fragments list
					if (fragment.role) {
						if (fragment.role !== 'mainstab' && !teamOfferedSupport.includes(fragment.role)) teamOfferedSupport.push(fragment.role);
						else if (fragment.role === 'mainstab' && fragment.moveType && !fragment.pokemon.coveredStabs.includes(fragment.moveType)) fragment.pokemon.coveredStabs.push(fragment.moveType);
					}
					if (fragment[format].requestedSupport) for (const request of fragment[format].requestedSupport) if (!teamHighPrioRequestedSupport.includes(request)) teamHighPrioRequestedSupport.push(request);
					fragment.eligible = false;
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
			// // // ALSO IMPORTANT: for VGC, item clause starts here!!!

			// inside the loop
			let teamRequestedSupport = [];
			for (const request of baseRequestedSupport) if (!teamRequestedSupport.includes(request)) teamRequestedSupport.push(request);
			for (const fragment of fragmentsList) if (fragment[format].requestedSupport) for (const request of fragment[format].requestedSupport) if (!teamRequestedSupport.includes(request)) teamRequestedSupport.push(request);
			
			let possibleSupport = [];
			for (const support of teamOfferedSupport) if (!possibleSupport.includes(support)) possibleSupport.push(support);

			// getting priorities in order
			for (const fragment of fragmentsList) {
				if (fragment.role) {
					// prioritize roles that aren't covered
					if (teamOfferedSupport.includes(fragment.role)) fragment.lowpriority = true;
					if (fragment.role === 'mainstab') {
						// don't do multiple main STABs of the same type
						if (fragment.pokemon.coveredStabs.includes(fragment.moveType)) fragment.eligible = false;
						// and don't bother to prioritize "STABs" of more than two types
						else if (fragment.pokemon.coveredStabs.length > 1) fragment.lowpriority = true;
					} else {
						// if one half of a synergy exists, prioritize the other half
						if (teamHighPrioRequestedSupport.includes(fragment.role) && !teamOfferedSupport.includes(fragment.role)) fragment.highpriority = true;
						// if the team doesn't want the support, throw out the fragment
						if (!teamRequestedSupport.includes(fragment.role) && !teamHighPrioRequestedSupport.includes(fragment.role)) fragment.eligible = false;
						// otherwise, record that the support is still possible at this point
						else if (!possibleSupport.includes(fragment.role)) possibleSupport.push(fragment.role);
					}
				}
			}
			
			for (const fragment of fragmentsList) {
				if (fragment[format].requestedSupport) {
					for (const request of fragment[format].requestedSupport) {
						// if one half of a synergy exists, prioritize getting at least one of the other half
						if (teamOfferedSupport.includes(request) && !teamHighPrioRequestedSupport.includes(request)) fragment.highpriority = true;
						// but filter out impossible requests
						if (!possibleSupport.includes(request)) fragment.eligible = false;
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
			let fragmentsListThisStep = fragmentsList.filter((fragment) => (fragment.highpriority));
			if (!fragmentsListThisStep.length) fragmentsListThisStep = fragmentsList.filter((fragment) => (!fragment.lowpriority && !(fragment.role && fragment.role === 'mainstab')));
			if (!fragmentsListThisStep.length) {
				prioritizeRoles = false;
				fragmentsListThisStep = fragmentsList.filter((fragment) => (!fragment.lowpriority));
			}
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
					if (fragment.role && fragment.role !== 'mainstab') {
						if (!roleCount[fragment.role]) roleCount[fragment.role] = [];
						if (!roleCount[fragment.role].includes(fragment.pokemon.name)) roleCount[fragment.role].push(fragment.pokemon.name);
					}
				}
				let minRoleCount = 6;
				for (const role in roleCount) {
					if (minRoleCount > roleCount[role].length) minRoleCount = roleCount[role].length;
				}
				for (const fragment of fragmentsListThisStep) {
					if (fragment.role && fragment.role !== 'mainstab' && roleCount[fragment.role].length <= minRoleCount) reducedFragmentsListThisStep.push(fragment);
				}
				if (reducedFragmentsListThisStep.length) fragmentsListThisStep = reducedFragmentsListThisStep;
			}
			
			// if there are multiple remaining candidates for the same role (or STAB type), and any of them have a score defined, filter out all competition for that role except the highest-scoring
			// // the "score" is on a per-role basis and not standardized, so only compare fragments with the same role!!!
			
			// STEP 5: applying fragments
			// finally, pick a random fragment from the narrowed-down pool, apply it to the set, and loop
			let chosenFragment = this.sample(fragmentsListThisStep);
			if (chosenFragment) {
				if (chosenFragment.ability) chosenFragment.pokemon.ability = chosenFragment.ability;
				if (chosenFragment.item) chosenFragment.pokemon.item = chosenFragment.item;
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
					if (chosenFragment.role !== 'mainstab' && !teamOfferedSupport.includes(chosenFragment.role)) teamOfferedSupport.push(chosenFragment.role);
					else if (chosenFragment.role === 'mainstab' && chosenFragment.moveType && !chosenFragment.pokemon.coveredStabs.includes(chosenFragment.moveType)) chosenFragment.pokemon.coveredStabs.push(chosenFragment.moveType);
				}
				if (chosenFragment[format].requestedSupport) for (const request of chosenFragment[format].requestedSupport) if (!teamHighPrioRequestedSupport.includes(request)) teamHighPrioRequestedSupport.push(request);
			}
		}

		// TODO: filling empty space in sets after fragments and STABs are done
		// // double-checking if any resistance Abilities were important for resistances that aren't covered so far
		// // reasonable amount of Protect in VGC, "spicy" moves, fun items, et cetera
		// // obeying item clause was already mandatory for VGC; it's optional for singles, so the previous section doesn't enforce it... but by the time you're at this step, you should follow it anyway to get more fun sets!
		// // (EXCEPTION: not gonna push item clause on LC - if something wants Eviolite or Berry Juice or something, it can have it)
		
		for (const set of sets) {
			if (!set.item) set.item = 'Leftovers';
			if (!set.ability) set.ability = this.dex.species.get(set.species).abilities[0];
			if (!set.moves) set.moves = ["Protect"];
			if (!set.nature) set.nature = '';
			if (
				!set.evs || (
					set.evs['hp'] === 0 && set.evs['atk'] === 0  && set.evs['def'] === 0 && set.evs['spa'] === 0 && set.evs['spd'] === 0 && set.evs['spe'] === 0
				)
			) set.evs = { hp: 4, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
			if (!set.happiness) set.happiness = 255;
			if (!set.teraType) set.teraType = this.dex.species.get(set.species).types[0];
			set.level = setLevel;
			set.hasBeenRandomized = true;
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
