export const Scripts: {[k: string]: ModdedBattleScriptsData} = {
	teambuilderConfig: {
		excludeStandardTiers: true,
		// sorting the teambuilder by slate / prompt
		customTiers: ['Pokémon of the Day!', 'Evo!', '(Prevo)'],
		customDoublesTiers: ['Pokémon of the Day!', 'Evo!', '(Prevo)'],
	},
	init() {
		let customList = [];
		for (const id in this.dataCache.Pokedex) {
			const notm = ['terablast', 'hiddenpower']; // certain moves don't count TMs
			const gen9only = [
				'plankteenie', 'mareaniedrifter', 'toxapexglacial', 'nemesyst', 'numeldormant', 'cameruptdormant', 'dormaderupt'
			]; // certain Fakemon are based on Gen IX movepools specifically

			// movepool corrections
			if (this.dataCache.Learnsets[id]) {
				for (const moveid of notm) {
					if (this.dataCache.Learnsets[id].learnset && this.dataCache.Learnsets[id].learnset[moveid]) {
						// check if it learns the move naturally
						let learns = false;
						for (const method in this.dataCache.Learnsets[id].learnset[moveid]) {
							if (method.charAt(1) === 'L' || method.charAt(1) === 'E') learns = true;
						}
						if (!learns) delete this.modData('Learnsets', id).learnset[moveid];
					}
				}
			}

			// Fakemon creation
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

			if (!newMon.evos) customList.push(id); // only fully-evolved Pokémon of the Day!

			let copyMoves = newMon.copyData;
			if (newMon.copyMoves) copyMoves = newMon.copyMoves;
			if (copyMoves) {
				if (!this.dataCache.Learnsets[id]) this.dataCache.Learnsets[id] = {learnset: {}}; // create a blank learnset entry so we don't need a learnsets file
				const learnset = this.dataCache.Learnsets[this.toID(copyMoves)].learnset;
				for (const moveid in learnset) {
					this.modData('Learnsets', id).learnset[moveid] = learnset[moveid].filter(
						(method) => !(method.includes('S') || (notm.includes(moveid) && (method.includes('M') || method.includes('T'))) || (gen9only.includes(id) && !(method.startsWith('9'))))
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
	teams: {
		parseExportedTeamLine(line: string, isFirstLine: boolean, set: PokemonSet, aggressive?: boolean) {
			if (isFirstLine) {
				let item;
				[line, item] = line.split(' @ ');
				if (item) {
					set.item = item;
					if (toID(set.item) === 'noitem') set.item = '';
				}
				if (line.endsWith(' (M)')) {
					set.gender = 'M';
					line = line.slice(0, -4);
				}
				if (line.endsWith(' (F)')) {
					set.gender = 'F';
					line = line.slice(0, -4);
				}
				if (line.endsWith(')') && line.includes('(')) {
					const [name, species] = line.slice(0, -1).split('(');
					set.species = Dex.species.get(species).name;
					set.name = name.trim();
				} else {
					set.species = Dex.species.get(line).name;
					set.name = '';
				}
			} else if (line.startsWith('Trait: ')) {
				line = line.slice(7);
				set.ability = aggressive ? toID(line) : line;
			} else if (line.startsWith('Ability: ')) {
				line = line.slice(9);
				set.ability = aggressive ? toID(line) : line;
			} else if (line === 'Shiny: Yes') {
				set.shiny = true;
			} else if (line.startsWith('Level: ')) {
				line = line.slice(7);
				set.level = +line;
			} else if (line.startsWith('Happiness: ')) {
				line = line.slice(11);
				set.happiness = +line;
			} else if (line.startsWith('Pokeball: ')) {
				line = line.slice(10);
				set.pokeball = aggressive ? toID(line) : line;
			} else if (line.startsWith('Hidden Power: ')) {
				line = line.slice(14);
				set.hpType = aggressive ? toID(line) : line;
			} else if (line.startsWith('Tera Type: ')) {
				line = line.slice(11);
				set.teraType = aggressive ? line.replace(/[^a-zA-Z0-9]/g, '') : line;
			} else if (line === 'Gigantamax: Yes') {
				set.gigantamax = true;
			} else if (line.startsWith('EVs: ')) {
				line = line.slice(5);
				const evLines = line.split('/');
				set.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
				for (const evLine of evLines) {
					const [statValue, statName] = evLine.trim().split(' ');
					const statid = Dex.stats.getID(statName);
					if (!statid) continue;
					const value = parseInt(statValue);
					set.evs[statid] = value;
				}
			} else if (line.startsWith('IVs: ')) {
				line = line.slice(5);
				const ivLines = line.split('/');
				set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
				for (const ivLine of ivLines) {
					const [statValue, statName] = ivLine.trim().split(' ');
					const statid = Dex.stats.getID(statName);
					if (!statid) continue;
					let value = parseInt(statValue);
					if (isNaN(value)) value = 31;
					set.ivs[statid] = value;
				}
			} else if (line.startsWith('Tagline: ')) {
				line = line.slice(9);
				set.tagline = line.trim();
			} else if (/^[A-Za-z]+ (N|n)ature/.test(line)) {
				let natureIndex = line.indexOf(' Nature');
				if (natureIndex === -1) natureIndex = line.indexOf(' nature');
				if (natureIndex === -1) return;
				line = line.substr(0, natureIndex);
				if (line !== 'undefined') set.nature = aggressive ? toID(line) : line;
			} else if (line.startsWith('-') || line.startsWith('~')) {
				line = line.slice(line.charAt(1) === ' ' ? 2 : 1);
				if (line.startsWith('Hidden Power [')) {
					const hpType = line.slice(14, -1);
					line = 'Hidden Power ' + hpType;
					if (!set.ivs && Dex.types.isName(hpType)) {
						set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
						const hpIVs = Dex.types.get(hpType).HPivs || {};
						for (const statid in hpIVs) {
							set.ivs[statid as StatID] = hpIVs[statid as StatID]!;
						}
					}
				}
				if (line === 'Frustration' && set.happiness === undefined) {
					set.happiness = 0;
				}
				set.moves.push(line);
			}
		}
	},
};
