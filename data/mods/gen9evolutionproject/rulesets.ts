export const Rulesets: {[k: string]: ModdedFormatData} = {
	datamod: {
		effectType: 'Rule',
		name: 'Data Mod',
		desc: 'When a new Pokémon switches in for the first time, information about its types, stats and Abilities is displayed to both players.',
		onTeamPreview() {
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
					if (extraLineBreak) hideBox += `<br><br>`;
					else extraLineBreak = true;
					
					let species = this.dex.species.get(pokemon.species.name);
					if (species.copyData) { // all modded things in Evo have this
						showFakemon = true;
						let abilities = species.abilities[0];
						if (species.abilities[1]) abilities += ` / ${species.abilities[1]}`;
						if (species.abilities['H']) abilities += ` // ${species.abilities['H']}`;
						if (species.abilities['S']) abilities += ` // (${species.abilities['S']})`;
						const baseStats = species.baseStats;
						hideBox += `<div class="message"><ul class="utilichart"><li class="result"><span class="col pokemonnamecol" style="white-space: nowrap">` + species.name + `</span> <span class="col typecol"><img src="http://play.pokemonshowdown.com/sprites/types/${species.types[0]}.png" alt="${species.types[0]}" height="14" width="32">`;
						if (species.types[1]) hideBox += `<img src="http://play.pokemonshowdown.com/sprites/types/${species.types[1]}.png" alt="${species.types[1]}" height="14" width="32">`;
						hideBox += `</span></li><br><li class="result"><span style="float: left ; min-height: 26px"><span class="col abilitycol">` + abilities + `</span><span class="col abilitycol"></span></span></li><br><li class="result"><span style="float: left ; min-height: 26px"><span class="col statcol"><em>HP</em><br>` + baseStats.hp + `</span> <span class="col statcol"><em>Atk</em><br>` + baseStats.atk + `</span> <span class="col statcol"><em>Def</em><br>` + baseStats.def + `</span> <span class="col statcol"><em>SpA</em><br>` + baseStats.spa + `</span> <span class="col statcol"><em>SpD</em><br>` + baseStats.spd + `</span> <span class="col statcol"><em>Spe</em><br>` + baseStats.spe + `</span> </span></li><li style="clear: both"></li></ul></div>`;
						
						let customGuide = `raw|<div class="infobox" open><details class ="details"><summary>More details on ${species.name}</summary>`;
						// creator
						if (species.creator) {
							customGuide += `<div class="hint"><br>${species.name} was created by ${species.creator}!</div><br>`;
						}
						// movepool changes
						const gen9only = [
							'Plankteenie', 'Mareanie-Drifter', 'Toxapex-Glacial', 'Nemesyst', 'Numel-Dormant', 'Dormedary', 'Dormaderupt',
							'Uraxys', 'Cytoxys', 'Adexys', 'Guaxys', 'Riboxys-U', 'Riboxys-C', 'Riboxys-A', 'Riboxys-G',
						];
						customGuide += `<br><div class="hint">Its movepool is based on ${species.copyMoves ? species.copyMoves : species.copyData}'s`;
						if (gen9only.includes(species.name)) customGuide += ` <strong>Gen IX</strong> movepool`;
						if (species.movepoolAdditions) {
							customGuide += `,<br>and it gained the move`;
							if (species.movepoolAdditions.length > 1) customGuide += `s`;
							let order = 0;
							for (const moveid of species.movepoolAdditions) {
								order++;
								let move = this.dex.moves.get(moveid);
								if (order < movepoolAdditions.length) {
									customGuide += ` ${move.name}`;
									if (order + 1 < movepoolAdditions.length) customGuide += `,`;
								}
								else {
									if (movepoolAdditions.length !== 1) customGuide += ` and`;
									customGuide += ` ${move.name}`;
								}
							}
						}
						if (species.movepoolDeletions) {
							customGuide += `,<br>but it lost the move`;
							if (species.movepoolDeletions.length > 1) customGuide += `s`;
							let order = 0;
							for (const moveid of species.movepoolDeletions) {
								order++;
								let move = this.dex.moves.get(moveid);
								if (order < movepoolDeletions.length) {
									customGuide += ` ${move.name}`;
									if (order + 1 < movepoolDeletions.length) customGuide += `,`;
								}
								else {
									if (movepoolDeletions.length !== 1) customGuide += ` and`;
									customGuide += ` ${move.name}`;
								}
							}
						}
						if (!species.movepoolAdditions && !species.movepoolDeletions) customGuide += ` with no changes`;
						customGuide += `.</div><br>`;
						// custom Abilities
						// each should start with <br> and end with <br> for spacing
						// custom moves
						// each should start with <br> and end with <br> for spacing
						let customGuide += `</details></div>`;
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
				if (species.abilities['H']) abilities += ` / ${species.abilities['H']}`;
				if (species.abilities['S']) abilities += ` / ${species.abilities['S']}`;
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
		},
	},
};
