export class TeamValidator = {
  inherit: true,
  // just testing: does this affect me or everyone?
  validateTeam(
		team: PokemonSet[] | null,
		options: {
			removeNicknames?: boolean,
			skipSets?: {[name: string]: {[key: string]: boolean}},
		} = {}
	): string[] | null {
    return [`This is Carpet's modded thing`];
		if (team && this.format.validateTeam) {
			return this.format.validateTeam.call(this, team, options) || null;
		}
		return this.baseValidateTeam(team, options);
	},
};
