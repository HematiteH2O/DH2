import { Teams } from '../../../sim/teams';

export const Rulesets: {[k: string]: ModdedFormatData} = {
	datamod: {
		effectType: 'Rule',
		name: 'Data Mod',
		desc: 'When a new Pokémon switches in for the first time, information about its types, stats and Abilities is displayed to both players.',
		
		onBegin() {
			// messages can be displayed here, such as if we ever have a banner
			
			// initializing battle stats for fun
			this.funStats = { // report the record-holder in each category only if conditions are met
				damage: {}, // always report
				damageMethod: {},
				allyDamage: {}, // only report if more than any opponent damaged its team
				allyDamageMethod: {},
				
				heal: {}, // only report if more than 100%?
				healMethod: {}, // only report if more than 100%?
				foeHeal: {}, // only report if more than it healed its own team
				foeHealMethod: {}, // only report if more than 100%?
				
				overkill: {}, // only report if more than 100%?
			};
			// hits taken are already recorded (see Rage Fist)
		},

		// actual Data Mod feature
		
		onTeamPreview() {
			// OKAY HEADS-UP:
			// the below is for *my personal convenience* for randbats set generation - it should be *commented out* in any patch that actually gets loaded to DH
			// I'm keeping it around so I can run it the same way every time I add a new slate
			// don't forget to comment it out!!!
			let randomizerData = `raw|<div class="infobox" open><details class ="details"><summary>Randomizer set summary exports</summary>`;
			for (const id in this.dex.data.Pokedex) {
				if (this.dex.data.Pokedex[id] && this.dex.data.Pokedex[id].randomizerInfo) randomizerData += this.dex.data.Pokedex[id].randomizerInfo;
			}
			randomizerData += `</details></div>`;
			this.add(`${randomizerData}`);
			// end commented-out section
			
			this.add('clearpoke');
			for (const side of this.sides) {
				for (const pokemon of side.pokemon) {
					let details = pokemon.details;
					this.add('poke', pokemon.side.id, details, '');
				}
			}
			for (const side of this.sides) {
				let showFakemon = false;
				let extraLineBreak = false;
				let hideBox = `raw|<div class="infobox" open><details class ="details"><summary>Fakemon on ${side.name}'s team</summary>`;
				for (const pokemon of side.pokemon) {
					// add one more line between each Fakemon
					if (extraLineBreak) hideBox += `<br>`;
					else extraLineBreak = true;
					
					let species = this.dex.species.get(pokemon.species.name);
					if (species.copyData) { // all modded things in Evo have this
						showFakemon = true;
						let abilities = species.abilities[0];
						if (species.abilities[1]) abilities += ` / ${species.abilities[1]}`;
						if (species.abilities['H']) abilities += ` // ${species.abilities['H']}`;
						if (species.abilities['S']) abilities += ` // <em>(${species.abilities['S']})</em>`;
						const baseStats = species.baseStats;
						hideBox += `<div class="message"><ul class="utilichart"><li class="result"><span class="col pokemonnamecol" style="white-space: nowrap">` + species.name + `</span> <span class="col typecol"><img src="http://play.pokemonshowdown.com/sprites/types/${species.types[0]}.png" alt="${species.types[0]}" height="14" width="32">`;
						if (species.types[1]) hideBox += `<img src="http://play.pokemonshowdown.com/sprites/types/${species.types[1]}.png" alt="${species.types[1]}" height="14" width="32">`;
						hideBox += `</span></li><br><li class="result"><span style="float: left ; min-height: 26px"><span class="col abilitycol">` + abilities + `</span><span class="col abilitycol"></span></span></li><br><li class="result"><span style="float: left ; min-height: 26px"><span class="col statcol"><em>HP</em><br>` + baseStats.hp + `</span> <span class="col statcol"><em>Atk</em><br>` + baseStats.atk + `</span> <span class="col statcol"><em>Def</em><br>` + baseStats.def + `</span> <span class="col statcol"><em>SpA</em><br>` + baseStats.spa + `</span> <span class="col statcol"><em>SpD</em><br>` + baseStats.spd + `</span> <span class="col statcol"><em>Spe</em><br>` + baseStats.spe + `</span> </span></li><li style="clear: both"></li></ul></div>`;
						
						let customGuide = `<br><div class="infobox" open><details class ="details"><summary>More details on ${species.name}</summary>`;
						
						// creator
						if (species.creator) {
							customGuide += `<div class="hint"><br>${species.name} was created by ${species.creator}!</div>`;
						}
						
						// movepool changes
						const gen9only = [
							'Plankteenie', 'Mareanie-Drifter', 'Toxapex-Glacial', 'Nemesyst', 'Numel-Dormant', 'Dormedary', 'Dormaderupt',
							'Uraxys', 'Cytoxys', 'Adexys', 'Guaxys', 'Riboxys-U', 'Riboxys-C', 'Riboxys-A', 'Riboxys-G',
						];
						customGuide += `<br><div class="hint">Its movepool is based on ${species.copyMoves ? species.copyMoves : species.copyData}'s`;
						if (gen9only.includes(species.name)) customGuide += ` <strong>Gen IX</strong> movepool`;
						if (species.movepoolAdditions) {
							customGuide += `,<br>and it <strong>gained</strong> the move`;
							if (species.movepoolAdditions.length > 1) customGuide += `s`;
							let order = 0;
							for (const moveid of species.movepoolAdditions) {
								order++;
								let move = this.dex.moves.get(moveid);
								if (order < species.movepoolAdditions.length) {
									customGuide += ` ${move.name}`;
									if (order + 1 < species.movepoolAdditions.length) customGuide += `,`;
								}
								else {
									if (species.movepoolAdditions.length !== 1) customGuide += ` and`;
									customGuide += ` ${move.name}`;
								}
							}
						}
						if (species.movepoolDeletions) {
							customGuide += `,<br>but it <strong>lost</strong> the move`;
							if (species.movepoolDeletions.length > 1) customGuide += `s`;
							let order = 0;
							for (const moveid of species.movepoolDeletions) {
								order++;
								let move = this.dex.moves.get(moveid);
								if (order < species.movepoolDeletions.length) {
									customGuide += ` ${move.name}`;
									if (order + 1 < species.movepoolDeletions.length) customGuide += `,`;
								}
								else {
									if (species.movepoolDeletions.length !== 1) customGuide += ` and`;
									customGuide += ` ${move.name}`;
								}
							}
						}
						if (!species.movepoolAdditions && !species.movepoolDeletions) customGuide += ` with no changes`;
						customGuide += `.</div>`;
						
						// custom Abilities
						if (species.abilities[0]) {
							let ability = this.dex.abilities.get(species.abilities[0]);
							if (ability.num && ability.num < 0) { // report custom Abilities only
								customGuide += `<br><div class="message"><li class="result"><span class="col namecol"><strong>${ability.name}</strong></span>`;
								if (ability.longDesc) {
										customGuide += `<br><font color="#686868">${ability.longDesc}</font>`;
								} else if (ability.shortDesc) {
										customGuide += `<br><font color="#686868">${ability.shortDesc}</font>`;
								}
								customGuide += `</li></div>`;
							}
						}
						if (species.abilities[1]) {
							let ability = this.dex.abilities.get(species.abilities[1]);
							if (ability.num && ability.num < 0) { // report custom Abilities only
								customGuide += `<br><div class="message"><li class="result"><span class="col namecol"><strong>${ability.name}</strong></span>`;
								if (ability.longDesc) {
										customGuide += `<br><font color="#686868">${ability.longDesc}</font>`;
								} else if (ability.shortDesc) {
										customGuide += `<br><font color="#686868">${ability.shortDesc}</font>`;
								}
								customGuide += `</li></div>`;
							}
						}
						if (species.abilities['H']) {
							let ability = this.dex.abilities.get(species.abilities['H']);
							if (ability.num && ability.num < 0) { // report custom Abilities only
								customGuide += `<br><div class="message"><li class="result"><span class="col namecol"><strong>${ability.name}</strong></span>`;
								if (ability.longDesc) {
										customGuide += `<br><font color="#686868">${ability.longDesc}</font>`;
								} else if (ability.shortDesc) {
										customGuide += `<br><font color="#686868">${ability.shortDesc}</font>`;
								}
								customGuide += `</li></div>`;
							}
						}
						if (species.abilities['S']) {
							let ability = this.dex.abilities.get(species.abilities['S']);
							if (ability.num && ability.num < 0) { // report custom Abilities only
								customGuide += `<br><div class="message"><li class="result"><span class="col namecol"><strong>${ability.name}</strong></span>`;
								if (ability.longDesc) {
										customGuide += `<br><font color="#686868">${ability.longDesc}</font>`;
								} else if (ability.shortDesc) {
										customGuide += `<br><font color="#686868">${ability.shortDesc}</font>`;
								}
								customGuide += `</li></div>`;
							}
						}
						
						// custom moves
						if (species.movepoolAdditions) {
							for (const moveid of species.movepoolAdditions) {
								let move = this.dex.moves.get(moveid);
								if (move.num < 0) { // report custom moves only
									let power = move.basePower;
									if (power < 2) power = "—";
									let acc = move.accuracy;
									if (acc === true) acc = "—";
									customGuide += `<br><div class="message"><ul class="utilichart"><li class="result"><span class="col movenamecol"><strong>${move.name}</strong></span><span class="col typecol"><img src="https://play.pokemonshowdown.com/sprites/types/${move.type}.png" alt="${move.type} width="32" height="14"><img src="https://play.pokemonshowdown.com/sprites/categories/${move.category}.png" alt="${move.category}" width="32" height="14"></span><span class="col labelcol"><em>Power</em><br>${power}</span><span class="col widelabelcol"><em>Accuracy</em><br>${acc}</span><span class="col pplabelcol"><em>PP</em><br>${Math.floor(move.pp * 8 / 5)}</span></li></ul></div>`;
									if (move.longDesc) {
										customGuide += `<br><font color="#686868">${move.longDesc}</font>`;
									} else if (move.shortDesc) {
										customGuide += `<br><font color="#686868">${move.shortDesc}</font>`;
									}
								}
							}
						}

						// other info
						if (species.description) customGuide += `<br><div class="hint"><br>${species.description}</div>`;
						
						customGuide += `<br></details></div>`;
						hideBox += customGuide;
					}
				}
				hideBox += 	`</details></div>`;
				if (showFakemon) this.add(`${hideBox}`);
			}
		},
		onDataMod(pokemon) {
			let species = this.dex.species.get(pokemon.species.name);
			if (species.copyData) { // all modded things in Evo have this
				this.add('-start', pokemon, 'typechange', pokemon.getTypes(true).join('/'), '[silent]');
				let abilities = species.abilities[0];
				if (species.abilities[1]) abilities += ` / ${species.abilities[1]}`;
				if (species.abilities['H']) abilities += ` // ${species.abilities['H']}`;
				if (species.abilities['S']) abilities += ` // <em>${species.abilities['S']}</em>`;
				const baseStats = species.baseStats;
				const type = species.types[0];
				if (species.types[1]) {
					const type2 = species.types[1];
					this.add(`raw|<ul class="utilichart"><li class="result"><span class="col pokemonnamecol" style="white-space: nowrap">` + species.name + `</span> <span class="col typecol"><img src="http://play.pokemonshowdown.com/sprites/types/${type}.png" alt="${type}" height="14" width="32"><img src="http://play.pokemonshowdown.com/sprites/types/${type2}.png" alt="${type2}" height="14" width="32"></span> <span style="float: left ; min-height: 26px"><span class="col abilitycol">` + abilities + `</span><span class="col abilitycol"></span></span><br><span style="float: left ; min-height: 26px"><span class="col statcol"><em>HP</em><br>` + baseStats.hp + `</span> <span class="col statcol"><em>Atk</em><br>` + baseStats.atk + `</span> <span class="col statcol"><em>Def</em><br>` + baseStats.def + `</span> <span class="col statcol"><em>SpA</em><br>` + baseStats.spa + `</span> <span class="col statcol"><em>SpD</em><br>` + baseStats.spd + `</span> <span class="col statcol"><em>Spe</em><br>` + baseStats.spe + `</span> </span></li><li style="clear: both"></li></ul>`);
				} else {
					this.add(`raw|<ul class="utilichart"><li class="result"><span class="col pokemonnamecol" style="white-space: nowrap">` + species.name + `</span> <span class="col typecol"><img src="http://play.pokemonshowdown.com/sprites/types/${type}.png" alt="${type}" height="14" width="32"></span> <span style="float: left ; min-height: 26px"><span class="col abilitycol">` + abilities + `</span><span class="col abilitycol"></span></span><br><span style="float: left ; min-height: 26px"><span class="col statcol"><em>HP</em><br>` + baseStats.hp + `</span> <span class="col statcol"><em>Atk</em><br>` + baseStats.atk + `</span> <span class="col statcol"><em>Def</em><br>` + baseStats.def + `</span> <span class="col statcol"><em>SpA</em><br>` + baseStats.spa + `</span> <span class="col statcol"><em>SpD</em><br>` + baseStats.spd + `</span> <span class="col statcol"><em>Spe</em><br>` + baseStats.spe + `</span> </span></li><li style="clear: both"></li></ul>`);
				}
				if (species.creator) this.hint(`${species.name} was created by ${species.creator}!`);
				// might add movepool additions?
				// this.hint(`text goes here.`, true);
			}
		},
		onSwitchIn(pokemon) {
			if (pokemon.illusion) {
				this.add('-start', pokemon, 'typechange', pokemon.illusion.getTypes(true).join('/'), '[silent]');
			} else {
				this.add('-start', pokemon, 'typechange', pokemon.getTypes(true).join('/'), '[silent]');
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (target.hasAbility('illusion')) { // making sure the correct information is given when an Illusion breaks
				if (this.dex.species.get(target.species.name).copyData) { // if the target is modded
					this.add('-start', target, 'typechange', target.getTypes(true).join('/'), '[silent]');
				} else {
					const types = target.baseSpecies.types;
					if (target.getTypes().join() === types.join()) {
						this.add('-end', target, 'typechange', '[silent]');
					}
				}
			}
			// super-effective move count
			if (!move.damage && !move.damageCallback && target.getMoveHitData(move).typeMod > 0) {
				if (source.m.superEffectiveHits) {
					source.m.superEffectiveHits++;
				} else source.m.superEffectiveHits = 1;
			}
		},

		// battle stats feature
		
		// HARD-CODING TO DO:
		// Destiny Bond, Perish Body/Perish Song, self-KO moves (damage)
		// Revival Blessing (heal) + *maybe* Power Construct, Tera Shift, special Terastallized states
		// Pain Split (both)
		
		onHealPriority: -200,
		onHeal(damage, target, source, effect) {
			if (!damage) return;

			console.log(`HEAL NOTES`);
			console.log(`target:`);
			console.log(((target && target.fullname) ? target.fullname : target) + (target.hp ? ` with HP ` + target.hp : ` `));
			console.log(`source:`);
			console.log((source && source.fullname) ? source.fullname : source);
			console.log(`effect:`);
			console.log(((effect && effect.name) ? effect.name : effect) + (effect.effectType ? ` of type ` + effect.effectType : ` `));
			console.log(`damage:`);
			console.log(damage);

			// attribute the source of the healing
			let credit = null;
			
			if (effect && effect.effectType) {
				switch (effect.effectType) {
					case 'Condition':
						if (effect.id) {
							if (target.volatiles && target.volatiles[effect.id] && target.volatiles[effect.id].source) credit = target.volatiles[effect.id].source;
							if (target.side.sideConditions && target.side.sideConditions[effect.id] && target.side.sideConditions[effect.id].source) credit = target.side.sideConditions[effect.id].source;
							if (target.side.slotConditions && target.side.slotConditions[target.position] && target.side.slotConditions[target.position][effect.id] && target.side.slotConditions[target.position][effect.id].source) credit = target.side.slotConditions[target.position][effect.id].source;
							if (this.field.getWeather && this.field.getWeather().id === effect.id && this.field.weatherState && this.field.weatherState.source) credit = this.field.weatherState.source;
							if (this.field.getTerrain && this.field.getTerrain().id === effect.id && this.field.terrainState && this.field.terrainState.source) credit = this.field.terrainState.source;
						}
						if (effect.name) {
							if (target.volatiles && target.volatiles[effect.name] && target.volatiles[effect.name].source) credit = target.volatiles[effect.name].source;
							if (target.side.sideConditions && target.side.sideConditions[effect.name] && target.side.sideConditions[effect.name].source) credit = target.side.sideConditions[effect.name].source;
							if (target.side.slotConditions && target.side.slotConditions[target.position] && target.side.slotConditions[target.position][effect.name] && target.side.slotConditions[target.position][effect.name].source) credit = target.side.slotConditions[target.position][effect.name].source;
							if (this.field.getWeather && this.field.getWeather().id === effect.name && this.field.weatherState && this.field.weatherState.source) credit = this.field.weatherState.source;
							if (this.field.getTerrain && this.field.getTerrain().id === effect.name && this.field.terrainState && this.field.terrainState.source) credit = this.field.terrainState.source;
						}
						break;
					// case 'Pokemon':
					case 'Move':
						if (this.activePokemon) credit = this.activePokemon;
						break;
					case 'Item':
						// TODO: in case of items that affect the holder, I might track the original holder of the item,
						// as well as the reason it ended up on a different Pokémon?
						// For damage, that's only Sticky Barb, Black Sludge and Life Orb;
						// for healing, any item should count
						// Otherwise, the default attribution is good enough as-is
						break;
					case 'Ability':
						if (effect.name) {
							if (["Dry Skin", "Frigid Focus", "Ice Body", "Rain Dish", "Solar Power"].includes(effect.name)) { // weather Abilities
								if (this.field.getWeather() && this.field.weatherState && this.field.weatherState.source) credit = this.field.weatherState.source;
							}
							if (["Dry Skin", "Earth Eater", "Volt Absorb", "Water Absorb"].includes(effect.name)) { // type immunity Abilities
								if (this.activeMove && this.activePokemon) credit = this.activePokemon;
							}
							// Dry Skin is in both lists, but the activeMove one is second so it overwrites the weather credit (in case it gets hit with a Water move while it's raining)
							
							// Abilities like Hospitality, Bad Dreams and Aftermath already provide proper credit
							
							// Poison Heal should credit the status source, buuut...
							if (["Poison Heal"].includes(effect.name) && target.statusState) credit = target.statusState.source;
							// TODO: hard-coding for Toxic Spikes!
						}
						// if it's a weather Ability like Dry Skin, credit the field effect setter if possible
						// if it's Poison Heal, credit the one who inflicted the poison if possible
						// if it's Hospitality, credit the Hospitality ally
						// any other edge cases? double-check customs
						break;
					// case 'Format':
					// case 'Nature':
					// case 'Ruleset':
					case 'Terrain':
						// credit the terrain setter
						if (this.field.getTerrain() && this.field.getTerrain().source) credit = this.field.getTerrain().source;
						break;
					case 'Weather':
						// credit the weather setter
						if (this.field.getWeather() && this.field.getWeather().source) credit = this.field.getWeather().source;
						break;
					case 'Status':
						// TODO: hard-coding for Blown Fuse and Toxic Spikes
						// in general, credit the status setter
						if (effect.id && target.status && target.status === effect.id && target.statusState) credit = target.statusState.source;
						if (effect.name && target.status && target.status === effect.name && target.statusState) credit = target.statusState.source;
						break;
					// case 'Terastal':
					// case 'Rule':
					// case 'ValidatorRule':
				}
			}
			
			if (!credit && source) credit = source;
			if (!credit && target) credit = target;
			
			if (credit) {
				
				let healPercent = (damage / target.maxhp * 100);
				let foeHealPercent = 0;

				// unlike with damage, healing is already calculated into HP by this point, so accounting for overheal is never correct
				/*
				if (damage > (target.maxhp - target.hp)) { // no overheal
					console.log(`perceived overheal: ` + damage + ` damage is greater than ` + (target.maxhp - target.hp) + ` lost HP`);
					console.log(`heal percent reduced from ` + healPercent);
					healPercent = ((target.maxhp - target.hp) / target.maxhp * 100);
					console.log(`to ` + healPercent);
				}
				*/

				console.log(`Attributed ` + (effect.name ? effect.name : effect) + ` to ` + (credit.fullname ? credit.fullname : credit));
				if (credit.side) console.log(`Credit's side is ` + credit.side);
				if (target.side) console.log(`Target's side is ` + target.side);
				if (credit.side !== target.side) console.log(`These are different, so this *should* be foeHeal`);

				let method = null;
				if (effect && effect.name) method = effect.name;
				else if (effect && effect.id) method = effect.id;
				// if I don't like how certain statuses are labeled (for instance, if I want to replace "brn" with "burn damage" or "Sandstorm" with "sand chip"),
				// I can manually overwrite them here
				switch (method) {
					case 'brn':
						method = 'burn damage';
						break;
					case 'psn':
						method = 'poison damage';
						break;
					case 'tox':
						method = 'Toxic damage';
						break;
					case 'Sandstorm':
						method = 'sand chip';
						break;
					case 'Hail':
						method = 'hail chip';
						break;
					case 'confused':
						method = 'confusion damage';
						break;
					case 'partiallytrapped':
						if (target.volatiles && target.volatiles.partiallytrapped && target.volatiles.partiallytrapped.sourceEffect) {
							method = target.volatiles.partiallytrapped.sourceEffect;
						} else method = 'residual damage from a trapping move';
						break;
				}
				
				if (credit && target && credit.side && target.side) {
					if (credit.side !== target.side) { // it's a foeHeal if you heal the other team
						foeHealPercent = healPercent;
						healPercent = 0;

						// adding method:
						credit = `${credit.side.name}'s <strong>${credit.name}</strong>`;
						
						if (method) {
							if (!this.funStats.foeHealMethod[credit]) this.funStats.foeHealMethod[credit] = [];
							if (!this.funStats.foeHealMethod[credit].includes(method)) this.funStats.foeHealMethod[credit].push(method);
						}
					} else {
						// adding method:
						credit = `${credit.side.name}'s <strong>${credit.name}</strong>`;
						
						if (method) {
							if (!this.funStats.healMethod[credit]) this.funStats.healMethod[credit] = [];
							if (!this.funStats.healMethod[credit].includes(method)) this.funStats.healMethod[credit].push(method);
						}
					}
				}
				
				if (this.funStats.heal[credit]) {
					this.funStats.heal[credit] += healPercent;
				} else this.funStats.heal[credit] = healPercent;
				
				if (this.funStats.foeHeal[credit]) {
					this.funStats.foeHeal[credit] += foeHealPercent;
				} else this.funStats.foeHeal[credit] = foeHealPercent;
				
			}
			
			console.log(this.funStats);
		},
		onDamagePriority: -200,
		onDamage(damage, target, source, effect) {
			if (!damage) return;

			console.log(`DAMAGE NOTES`);
			console.log(`target:`);
			console.log(((target && target.fullname) ? target.fullname : target) + (target.hp ? ` with HP ` + target.hp : ` `));
			console.log(`source:`);
			console.log((source && source.fullname) ? source.fullname : source);
			console.log(`effect:`);
			console.log(((effect && effect.name) ? effect.name : effect) + (effect.effectType ? ` of type ` + effect.effectType : ` `));
			console.log(`damage:`);
			console.log(damage);

			// attribute the source of the damage
			let credit = null;
			
			if (effect && effect.effectType) {
				switch (effect.effectType) {
					case 'Condition':
						if (effect.id) {
							if (target.volatiles && target.volatiles[effect.id] && target.volatiles[effect.id].source) credit = target.volatiles[effect.id].source;
							if (target.side.sideConditions && target.side.sideConditions[effect.id] && target.side.sideConditions[effect.id].source) credit = target.side.sideConditions[effect.id].source;
							if (target.side.slotConditions && target.side.slotConditions[target.position] && target.side.slotConditions[target.position][effect.id] && target.side.slotConditions[target.position][effect.id].source) credit = target.side.slotConditions[target.position][effect.id].source;
							if (this.field.getWeather && this.field.getWeather().id === effect.id && this.field.weatherState && this.field.weatherState.source) credit = this.field.weatherState.source;
							if (this.field.getTerrain && this.field.getTerrain().id === effect.id && this.field.terrainState && this.field.terrainState.source) credit = this.field.terrainState.source;
						}
						if (effect.name) {
							if (target.volatiles && target.volatiles[effect.name] && target.volatiles[effect.name].source) credit = target.volatiles[effect.name].source;
							if (target.side.sideConditions && target.side.sideConditions[effect.name] && target.side.sideConditions[effect.name].source) credit = target.side.sideConditions[effect.name].source;
							if (target.side.slotConditions && target.side.slotConditions[target.position] && target.side.slotConditions[target.position][effect.name] && target.side.slotConditions[target.position][effect.name].source) credit = target.side.slotConditions[target.position][effect.name].source;
							if (this.field.getWeather && this.field.getWeather().id === effect.name && this.field.weatherState && this.field.weatherState.source) credit = this.field.weatherState.source;
							if (this.field.getTerrain && this.field.getTerrain().id === effect.name && this.field.terrainState && this.field.terrainState.source) credit = this.field.terrainState.source;
						}
						break;
					// case 'Pokemon':
					case 'Move':
						if (this.activePokemon) credit = this.activePokemon;
						break;
					case 'Item':
						// TODO: in case of items that affect the holder, I might track the original holder of the item,
						// as well as the reason it ended up on a different Pokémon?
						// For damage, that's only Sticky Barb, Black Sludge and Life Orb;
						// for healing, any item should count
						// Otherwise, the default attribution is good enough as-is
						break;
					case 'Ability':
						if (effect.name) {
							if (["Dry Skin", "Frigid Focus", "Ice Body", "Rain Dish", "Solar Power"].includes(effect.name)) { // weather Abilities
								if (this.field.getWeather() && this.field.weatherState && this.field.weatherState.source) credit = this.field.weatherState.source;
							}
							if (["Dry Skin", "Earth Eater", "Volt Absorb", "Water Absorb"].includes(effect.name)) { // type immunity Abilities
								if (this.activeMove && this.activePokemon) credit = this.activePokemon;
							}
							// Dry Skin is in both lists, but the activeMove one is second so it overwrites the weather credit (in case it gets hit with a Water move while it's raining)
							
							// Abilities like Hospitality, Bad Dreams and Aftermath already provide proper credit
							
							// Poison Heal should credit the status source, buuut...
							if (["Poison Heal"].includes(effect.name) && target.statusState) credit = target.statusState.source;
							// TODO: hard-coding for Toxic Spikes!
						}
						// if it's a weather Ability like Dry Skin, credit the field effect setter if possible
						// if it's Poison Heal, credit the one who inflicted the poison if possible
						// if it's Hospitality, credit the Hospitality ally
						// any other edge cases? double-check customs
						break;
					// case 'Format':
					// case 'Nature':
					// case 'Ruleset':
					case 'Terrain':
						// credit the terrain setter
						if (this.field.getTerrain() && this.field.getTerrain().source) credit = this.field.getTerrain().source;
						break;
					case 'Weather':
						// credit the weather setter
						if (this.field.getWeather() && this.field.getWeather().source) credit = this.field.getWeather().source;
						break;
					case 'Status':
						// TODO: hard-coding for Blown Fuse and Toxic Spikes
						// in general, credit the status setter
						if (effect.id && target.status && target.status === effect.id && target.statusState) credit = target.statusState.source;
						if (effect.name && target.status && target.status === effect.name && target.statusState) credit = target.statusState.source;
						break;
					// case 'Terastal':
					// case 'Rule':
					// case 'ValidatorRule':
				}
			}
			
			if (!credit && source) credit = source;
			if (!credit && target) credit = target;
			
			if (credit) {
				
				let damagePercent = (damage / target.maxhp * 100);
				let allyDamage = 0;
				let overkill = 0;
				
				if (damage > target.hp) {
					damagePercent = (target.hp / target.maxhp * 100);
					overkill = ((damage - target.hp) / target.maxhp * 100);
				}

				console.log(`Attributed ` + (effect.name ? effect.name : effect) + ` to ` + (credit.fullname ? credit.fullname : credit));
				if (credit.side) console.log(`Credit's side is ` + credit.side);
				if (target.side) console.log(`Target's side is ` + target.side);
				if (credit.side === target.side) console.log(`These are the same, so this *should* be allyDamage`);
				
				let method = null;
				if (effect && effect.name) method = effect.name;
				else if (effect && effect.id) method = effect.id;
				// if I don't like how certain statuses are labeled (for instance, if I want to replace "brn" with "burn damage" or "Sandstorm" with "sand chip"),
				// I can manually overwrite them here
				switch (method) {
					case 'brn':
						method = 'burn damage';
						break;
					case 'psn':
						method = 'poison damage';
						break;
					case 'tox':
						method = 'Toxic damage';
						break;
					case 'Sandstorm':
						method = 'sand chip';
						break;
					case 'Hail':
						method = 'hail chip';
						break;
					case 'confused':
						method = 'confusion damage';
						break;
					case 'partiallytrapped':
						if (target.volatiles && target.volatiles.partiallytrapped && target.volatiles.partiallytrapped.sourceEffect) {
							method = target.volatiles.partiallytrapped.sourceEffect;
						} else method = 'residual damage from a trapping move';
						break;
				}

				// overkill
				if (!this.funStats.overkill.damage || overkill > this.funStats.overkill.damage) {
					this.funStats.overkill.damage = overkill;
					this.funStats.overkill.highlights = [];
					// "The biggest overkill was..."
					this.funStats.overkill.highlights.push(`when ${credit.side.name}'s <strong>${credit.name}</strong> damaged ${target.side.name}'s <strong>${target.name}</strong> with ${method}`);
					// "... which did ${this.funStats.overkill.damage}% more damage than necessary!"
				} else if (overkill === this.funStats.overkill.damage) {
					if (!this.funStats.overkill.highlights) this.funStats.overkill.highlights = [];
					this.funStats.overkill.highlights.push(`when ${credit.side.name}'s <strong>${credit.name}</strong> damaged ${target.side.name}'s <strong>${target.name}</strong> with ${method}`);
				}
				
				if (credit && target && credit.side && target.side) {
					if (credit.side === target.side) { // it's an allyDamage if you hurt the same team
						allyDamage = damagePercent;
						damagePercent = 0;
						
						// adding method:
						credit = `${credit.side.name}'s <strong>${credit.name}</strong>`;
						
						if (method) {
							if (!this.funStats.allyDamageMethod[credit]) this.funStats.allyDamageMethod[credit] = [];
							if (!this.funStats.allyDamageMethod[credit].includes(method)) this.funStats.allyDamageMethod[credit].push(method);
						}
					} else {
						// adding method
						credit = `${credit.side.name}'s <strong>${credit.name}</strong>`;
						
						if (method) {
							// for damage, you should also generalize damaging moves
							if (effect && effect.effectType && effect.effectType === "Move") method = "attacks";
							
							if (!this.funStats.damageMethod[credit]) this.funStats.damageMethod[credit] = [];
							if (!this.funStats.damageMethod[credit].includes(method)) this.funStats.damageMethod[credit].push(method);
						}
					}
				}
				
				// damage
				if (this.funStats.damage[credit]) {
					this.funStats.damage[credit] += damagePercent;
				} else this.funStats.damage[credit] = damagePercent;

				// ally damage
				if (this.funStats.allyDamage[credit]) {
					this.funStats.allyDamage[credit] += allyDamage;
				} else this.funStats.allyDamage[credit] = allyDamage;
				
			}
			
			console.log(this.funStats);
		},
		onBattleFinished() {
			// I think I have everything I want for now set up, but I can add more over time
			// this.funStats
			// pokemon.m.superEffectiveHits (what landed the most SE hits)
			// pokemon.m.movesMissed (what missed the most moves)
			// pokemon.timesAttacked (what took the most attacks)
			// pokemon.set.hasBeenRandomized is also something I can check
			this.add(`raw|<hr>`);
			
			// report randomizer teams
			for (const side of this.sides) {
				let randomized = 0;
				for (const pokemon of side.pokemon) if (pokemon.set && pokemon.set.hasBeenRandomized) randomized++;
				if (randomized === side.team.length) {
					this.add(`raw|${side.name}'s team was randomly generated!<br>If you want to use it again, you can copy it from here:`);
					this.add('showteam', side.id, Teams.pack(side.team));
					this.add(`raw|<hr>`);
				} else if (randomized > 0) {
					this.add(`raw|Part of ${side.name}'s team was randomly generated!<br>If you want to use it again, you can copy it from here:`);
					let partialTeam = [];
					for (const set of side.team) if (set && set.hasBeenRandomized) partialTeam.push(set);
					this.add('showteam', side.id, Teams.pack(partialTeam));
					this.add(`raw|<hr>`);
				}
			}

			// report stats
			let statsReveal = `raw|<div class="hint">`;

			// max damage
			let maxDamage = 0;
			let damageRecordHolder = null;
			let damageRecordMethod = null;
			let damageRecordTie = false; // not implemented yet!
			if (this.funStats.damage) {
				console.log(`it does exist`);
				console.log(this.funStats.damage.length);
				for (const i in this.funStats.damage) {
					console.log(i);
					console.log(this.funStats.damage[i]);
					console.log(maxDamage);
					if (this.funStats.damage[i] > maxDamage) {
						maxDamage = this.funStats.damage[i];
						damageRecordHolder = i;
						console.log(this.funStats.damageMethod[i]);
						if (this.funStats.damageMethod[i]) damageRecordMethod = this.funStats.damageMethod[i];
						else damageRecordMethod = null;
					}
				}
			}
			if (maxDamage > 0 && damageRecordHolder) {
				let damageReport = `The Pokémon that did the most damage was ${damageRecordHolder}.<br>`;
				if (damageRecordMethod) {
					if (damageRecordMethod.length && damageRecordMethod.length > 1) {
						damageReport += `Between `;
						let order = 0;
						for (const damageMethod of damageRecordMethod) {
							order++;
							if (order < damageRecordMethod.length) {
								damageReport += ` ${damageMethod}`;
								if (order + 1 < damageRecordMethod.length) damageReport += `,`;
							}
							else damageReport += ` and ${damageMethod}`;
						}
					} else {
						damageReport += `With ${damageRecordMethod[0]}`;
					}
					damageReport += `, i`;
				} else damageReport += `I`;
				damageReport += `t dealt <strong>${Math.round(maxDamage*10)/10}</strong>% in total damage to the opposing team!<br>`;
				statsReveal += damageReport;
			}

			// overkill
			console.log(`Overkill troubleshooting:`);
			console.log(this.funStats.overkill);
			console.log(this.funStats.overkill.damage);
			console.log(this.funStats.overkill.highlights);
			console.log(this.funStats.overkill.highlights.length);
			if (
				this.funStats.overkill && this.funStats.overkill.damage && this.funStats.overkill.damage > 0 &&
				this.funStats.overkill.highlights && this.funStats.overkill.highlights.length
			) {
				let overkillReport = `<br>The biggest overkill was `;
				if (this.funStats.overkill.highlights.length > 1) {
					overkillReport += `a tie between `;
					let order = 0;
					for (const overkillHighlight of this.funStats.overkill.highlights) {
						order++;
						if (order < this.funStats.overkill.highlights.length) {
							overkillReport += ` ${overkillHighlight}`;
							if (order + 1 < this.funStats.overkill.highlights.length) overkillReport += `,`;
						}
						else overkillReport += ` and ${overkillHighlight}`;
					}
				} else overkillReport += `${this.funStats.overkill.highlights[0]}`;
				overkillReport += `, which did <strong>${Math.round(this.funStats.overkill.damage*10)/10}</strong>% more damage than necessary!<br>`;
				statsReveal += overkillReport;
			}

			if (statsReveal !== `raw|<div class="hint">`) {
				statsReveal += `<br></div><hr>`;
				this.add(statsReveal);
			}
			/*
			this.funStats = { // report the record-holder in each category only if conditions are met
				damage: {}, // always report
				damageMethod: {},
				allyDamage: {}, // only report if more than any opponent damaged its team
				allyDamageMethod: {},
				
				heal: {}, // only report if more than 100%?
				healMethod: {}, // only report if more than 100%?
				foeHeal: {}, // only report if more than it healed its own team
				foeHealMethod: {}, // only report if more than 100%?
				
				overkill: {}, // only report if more than 100%?
			};
			*/
		},
	},
};
