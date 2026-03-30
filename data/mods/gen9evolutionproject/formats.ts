import { FormatData } from '../../../sim/dex-formats';
import { Scripts } from './scripts';

export const Formats: FormatData[] = [
	{
		name: "[Gen 9] Evolution Project 2",
		desc: [
			`<b>Evolution Project</b>: A small group's creative exercise.`,
		],
		teambuilderFormat: "National Dex",
		ruleset: ['Standard NatDex', 'OHKO Clause', 'Evasion Moves Clause', 'Species Clause', 'Sleep Clause Mod', 'Z-Move Clause', 'Dynamax Clause', 'Data Mod'],
		banlist: [
			'Toxapex-Base', 'Noivern-Variant', 'Chandelure', 'Corviknight-Base', 'Darmanitan-Base', 'Darmanitan-Galar', 'Excadrill-Base', 'Hawlucha-Base',
			'Garchomp', 'Velocinobi', 'Dragonite',
			'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Zacian', 'Zamazenta', 'Deoxys',
			'Moody', 'Baton Pass', 'Shed Tail', 'Last Respects',
		],
		onValidateTeam(team, format) {
			/**@type {{[k: string]: true}} */
			let speciesTable = {};
			const customTiers = ['Pokémon of the Day!', 'Evo!', '(Prevo)'];
			for (const set of team) {
				let template = this.dex.species.get(set.species);
				if (!customTiers.includes(template.tier)) {
					return [set.species + ' is not legal in the Evolution Project format.'];
				}
			}
		},
		onValidateSet(set) {
			const item = this.dex.items.get(set.item);
			if (item.megaStone) return [`${set.name || set.species} is not allowed to Mega Evolve.`];
		},
		mod: 'gen9evolutionproject',
		searchShow: false,
		// accommodating randbats
		teamOptional: true,
		validateTeam(
			team: PokemonSet[] | null,
			options: {
				removeNicknames?: boolean,
				skipSets?: {[name: string]: {[key: string]: boolean}},
			} = {}
		): string[] | null {
			const format = this.format;
			const dex = this.dex;
	
			let problems: string[] = [];
			const ruleTable = this.ruleTable;
			if (!team || team.length < 6) {
				// this is when you should randbats it
				team = Scripts.randomTest(team);
				options.team = team;
			}
			
			if (!Array.isArray(team)) {
				throw new Error(`Invalid team data`);
			}
	
			if (team.length < ruleTable.minTeamSize) {
				problems.push(`You must bring at least ${ruleTable.minTeamSize} Pok\u00E9mon (your team has ${team.length}).`);
			}
			if (team.length > ruleTable.maxTeamSize) {
				return [`You may only bring up to ${ruleTable.maxTeamSize} Pok\u00E9mon (your team has ${team.length}).`];
			}
	
			// A limit is imposed here to prevent too much engine strain or
			// too much layout deformation - to be exact, this is the limit
			// allowed in Custom Game.
			if (team.length > 24) {
				problems.push(`Your team has more than than 24 Pok\u00E9mon, which the simulator can't handle.`);
				return problems;
			}
	
			const teamHas: {[k: string]: number} = {};
			let lgpeStarterCount = 0;
			let deoxysType;
			for (const set of team) {
				if (!set) return [`You sent invalid team data. If you're not using a custom client, please report this as a bug.`];
	
				let setProblems: string[] | null = null;
				if (options.skipSets && options.skipSets[set.name]) {
					for (const i in options.skipSets[set.name]) {
						teamHas[i] = (teamHas[i] || 0) + 1;
					}
				} else {
					setProblems = (format.validateSet || this.validateSet).call(this, set, teamHas);
				}
	
				if (set.species === 'Pikachu-Starter' || set.species === 'Eevee-Starter') {
					lgpeStarterCount++;
					if (lgpeStarterCount === 2 && ruleTable.isBanned('nonexistent')) {
						problems.push(`You can only have one of Pikachu-Starter or Eevee-Starter on a team.`);
					}
				}
				if (dex.gen === 3 && set.species.startsWith('Deoxys')) {
					if (!deoxysType) {
						deoxysType = set.species;
					} else if (deoxysType !== set.species && ruleTable.isBanned('nonexistent')) {
						return [
							`You cannot have more than one type of Deoxys forme.`,
							`(Each game in Gen 3 supports only one forme of Deoxys.)`,
						];
					}
				}
				if (setProblems) {
					problems = problems.concat(setProblems);
				}
				if (options.removeNicknames) {
					const useCrossSpeciesNicknames = format.name.includes('Cross Evolution') || ruleTable.has('franticfusionsmod');
					const species = dex.species.get(set.species);
					let crossSpecies: Species;
					if (useCrossSpeciesNicknames && (crossSpecies = dex.species.get(set.name)).exists) {
						set.name = crossSpecies.name;
					} else {
						set.name = species.baseSpecies;
						if (species.baseSpecies === 'Unown') set.species = 'Unown';
					}
				}
			}
	
			for (const [rule, source, limit, bans] of ruleTable.complexTeamBans) {
				let count = 0;
				for (const ban of bans) {
					if (teamHas[ban] > 0) {
						count += limit ? teamHas[ban] : 1;
					}
				}
				if (limit && count > limit) {
					const clause = source ? ` by ${source}` : ``;
					problems.push(`You are limited to ${limit} of ${rule}${clause}.`);
				} else if (!limit && count >= bans.length) {
					const clause = source ? ` by ${source}` : ``;
					problems.push(`Your team has the combination of ${rule}, which is banned${clause}.`);
				}
			}
	
			for (const rule of ruleTable.keys()) {
				if ('!+-'.includes(rule.charAt(0))) continue;
				const subformat = dex.formats.get(rule);
				if (subformat.onValidateTeam && ruleTable.has(subformat.id)) {
					problems = problems.concat(subformat.onValidateTeam.call(this, team, format, teamHas) || []);
				}
			}
			if (format.onValidateTeam) {
				problems = problems.concat(format.onValidateTeam.call(this, team, format, teamHas) || []);
			}
	
			if (!problems.length) return null;
			return problems;
		}
	},
	{
		name: "[Gen 9] Evolution Project 2 VGC",
		desc: [
			`<b>Evolution Project</b>: A small group's creative exercise. Tera Blast is universal in VGC.`,
		],
		gameType: 'doubles',
		teambuilderFormat: "National Dex",
		ruleset: ['Flat Rules', '!! Adjust Level = 50', 'VGC Timer', '+Unobtainable', '+Past', 'Open Team Sheets', 'Dynamax Clause', 'Z-Move Clause', 'Data Mod'],
		banlist: [
			'Dragonite',
			'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Zacian', 'Zamazenta', 'Deoxys',
		],
		onValidateTeam(team, format) {
			/**@type {{[k: string]: true}} */
			let speciesTable = {};
			const customTiers = ['Pokémon of the Day!', 'Evo!', '(Prevo)'];
			for (const set of team) {
				let template = this.dex.species.get(set.species);
				if (!customTiers.includes(template.tier)) {
					return [set.species + ' is not legal in the Evolution Project format.'];
				}
			}
		},
		checkCanLearn(move, species, lsetData, set) { // Tera Blast is universal in VGC, but not in singles
			const problem = this.checkCanLearn(move, this.dex.species.get(set.species));
			if (problem && move.name !== 'Tera Blast') return problem;
			return null;
		},
		onValidateSet(set) {
			const unobtainables = [
				'Eevee-Starter', 'Floette-Eternal', 'Pichu-Spiky-eared', 'Pikachu-Belle', 'Pikachu-Cosplay', 'Pikachu-Libre',
				'Pikachu-PhD', 'Pikachu-Pop-Star', 'Pikachu-Rock-Star', 'Pikachu-Starter', 'Eternatus-Eternamax',
			];
			const species = this.dex.species.get(set.species);
			if (unobtainables.includes(species.name)) {
				if (this.ruleTable.has(`+pokemon:${species.id}`)) return;
				return [`${set.name || set.species} does not exist in the National Dex.`];
			}
			if (species.tier === "Unreleased") {
				const basePokemon = this.toID(species.baseSpecies);
				if (this.ruleTable.has(`+pokemon:${species.id}`) || this.ruleTable.has(`+basepokemon:${basePokemon}`)) {
					return;
				}
				return [`${set.name || set.species} does not exist in the National Dex.`];
			}
			// Items other than Z-Crystals and Pokémon-specific items should be illegal
			if (!set.item) return;
			const item = this.dex.items.get(set.item);
			if (item.megaStone) return [`${set.name || set.species} is not allowed to Mega Evolve.`];
			if (!item.isNonstandard) return;
			if (['Past', 'Unobtainable'].includes(item.isNonstandard) && !item.zMove && !item.itemUser && !item.forcedForme) {
				if (this.ruleTable.has(`+item:${item.id}`)) return;
				return [`${set.name}'s item ${item.name} does not exist in Gen ${this.dex.gen}.`];
			}
		},
		mod: 'gen9evolutionproject',
		searchShow: false,
	}
];
