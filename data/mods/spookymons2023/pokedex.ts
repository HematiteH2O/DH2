export const Pokedex: {[speciesid: string]: ModdedSpeciesData} = {

	// TEST CONTENT

	wolfsbrain: {
		copyData: "Oddish", // arbitrary for testing
		name: "Wolfsbrain",
		types: ["Grass", "Psychic"],
		baseStats: {hp: 60, atk: 60, def: 85, spa: 85, spd: 75, spe: 111},
		abilities: {0: "Neurotoxin"},
		//movepoolAdditions: ["banefultransformation"], // for testing (i edited learnsets anyway cause im not allergic to it like someone i know)
		heightm: 0.9,
		weightkg: 13,
		color: "Purple",
		creator: "Hematite",
	},

	calyrex: {
		inherit: true,
		otherFormes: ["Calyrex-Ice", "Calyrex-Shadow", "Calyrex-Unova"],
		formeOrder: ["Calyrex", "Calyrex-Ice", "Calyrex-Shadow", "Calyrex-Unova"],
	},
	calyrexunova: {
		name: "Calyrex-Unova",
		baseSpecies: "Calyrex",
		forme: "Unova",
		copyData: "Calyrex",
		types: ["Fire", "Ghost"],
		baseStats: {hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 100},
		abilities: {0: "Intimidate"},
		movepoolAdditions: [ // a bit haphazard sorry
			"pumpkinspicemix", "poltergeist", "ragepowder",
			"fireblast", "firespin", "flamecharge", "flamethrower", "heatwave", "overheat", "willowisp",
			"confuseray", "hex", "nightshade", "shadowball"
		],
		movepoolDeletions: ["agility", "calmmind", "growth", "imprison", "storedpower", "synthesis"],
		heightm: 1.1,
		weightkg: 7.7,
		color: "Brown",
		creator: "Hematite",
		requiredItem: "Weird Pumpkin",
	},

	starmie: {
		inherit: true,
		otherFormes: ["Starmie-Fallen", "Starmie-Risen"],
		formeOrder: ["Starmie", "Starmie-Fallen", "Starmie-Risen"],
	},
	starmiegemini: {
		name: "Starmie-Gemini",
		baseSpecies: "Starmie",
		forme: "Gemini",
		copyData: "Starmie",
		baseStats: {hp: 115, atk: 100, def: 85, spa: 100, spd: 85, spe: 60},
		abilities: {0: "Mitosis"}, // illegal
		movepoolAdditions: ["geminilaser", "painsplit"],
		movepoolDeletions: ["recover"],
		heightm: 1.1,
		weightkg: 80,
		color: "Purple",
		creator: "Hematite",
	},
	starmiegeminirisen: {
		name: "Starmie-Gemini-Risen",
		baseSpecies: "Starmie",
		forme: "Gemini-Risen",
		copyData: "Starmie",
		types: ["Water", "Ghost"],
		baseStats: {hp: 60, atk: 100, def: 85, spa: 100, spd: 85, spe: 115},
		abilities: {0: "Mitosis"},
		movepoolAdditions: ["geminilaser", "painsplit"],
		movepoolDeletions: ["recover"],
		heightm: 1.1,
		weightkg: 40,
		color: "Purple",
		battleOnly: "Starmie-Gemini",
		creator: "Hematite",
	},

};
