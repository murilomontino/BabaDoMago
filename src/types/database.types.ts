export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

type ChampionshipPlayersRow = {
	assists: number;
	avatar_url: string | null;
	championship_id: number;
	created_at: string;
	deleted_at: string | null;
	display_name: string;
	goals: number;
	id: number;
	matches: number;
	nickname: string | null;
	rating: number;
	role: string;
	user_id: string | null;
	wins: number;
};

export type Database = {
	public: {
		Tables: {
			championship_event_attendance: {
				Row: {
					display_name: string;
					event_id: number;
					id: number;
					player_id: number;
				};
				Insert: {
					display_name: string;
					event_id: number;
					id?: number;
					player_id: number;
				};
				Update: {
					display_name?: string;
					event_id?: number;
					id?: number;
					player_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_attendance_event_id_fkey";
						columns: ["event_id"];
						isOneToOne: false;
						referencedRelation: "championship_events";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "championship_event_attendance_player_id_fkey";
						columns: ["player_id"];
						isOneToOne: false;
						referencedRelation: "championship_players";
						referencedColumns: ["id"];
					},
				];
			};
			championship_event_matches: {
				Row: {
					created_at: string;
					ended_at: string | null;
					event_id: number;
					id: number;
					team_a_id: number;
					team_b_id: number;
					winner_team_id: number | null;
				};
				Insert: {
					created_at?: string;
					ended_at?: string | null;
					event_id: number;
					id?: number;
					team_a_id: number;
					team_b_id: number;
					winner_team_id?: number | null;
				};
				Update: {
					created_at?: string;
					ended_at?: string | null;
					event_id?: number;
					id?: number;
					team_a_id?: number;
					team_b_id?: number;
					winner_team_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_matches_event_id_fkey";
						columns: ["event_id"];
						isOneToOne: false;
						referencedRelation: "championship_events";
						referencedColumns: ["id"];
					},
				];
			};
			championship_event_match_players: {
				Row: {
					display_name: string;
					event_id: number;
					id: number;
					is_goalkeeper: boolean;
					match_id: number;
					player_id: number;
					slot: number;
					team_id: number;
				};
				Insert: {
					display_name: string;
					event_id: number;
					id?: number;
					is_goalkeeper?: boolean;
					match_id: number;
					player_id: number;
					slot: number;
					team_id: number;
				};
				Update: {
					display_name?: string;
					event_id?: number;
					id?: number;
					is_goalkeeper?: boolean;
					match_id?: number;
					player_id?: number;
					slot?: number;
					team_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_match_players_match_id_event_id_fkey";
						columns: ["match_id", "event_id"];
						isOneToOne: false;
						referencedRelation: "championship_event_matches";
						referencedColumns: ["id", "event_id"];
					},
					{
						foreignKeyName: "championship_event_match_players_player_id_fkey";
						columns: ["player_id"];
						isOneToOne: false;
						referencedRelation: "championship_players";
						referencedColumns: ["id"];
					},
				];
			};
			championship_event_goals: {
				Row: {
					assist_player_id: number | null;
					created_at: string;
					event_id: number;
					id: number;
					is_own_goal: boolean;
					match_id: number;
					scorer_player_id: number;
				};
				Insert: {
					assist_player_id?: number | null;
					created_at?: string;
					event_id: number;
					id?: number;
					is_own_goal?: boolean;
					match_id: number;
					scorer_player_id: number;
				};
				Update: {
					assist_player_id?: number | null;
					created_at?: string;
					event_id?: number;
					id?: number;
					is_own_goal?: boolean;
					match_id?: number;
					scorer_player_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_goals_match_id_event_id_fkey";
						columns: ["match_id", "event_id"];
						isOneToOne: false;
						referencedRelation: "championship_event_matches";
						referencedColumns: ["id", "event_id"];
					},
				];
			};
			championship_event_team_players: {
				Row: {
					display_name: string;
					event_id: number;
					id: number;
					is_goalkeeper: boolean;
					player_id: number;
					team_id: number;
				};
				Insert: {
					display_name: string;
					event_id: number;
					id?: number;
					is_goalkeeper?: boolean;
					player_id: number;
					team_id: number;
				};
				Update: {
					display_name?: string;
					event_id?: number;
					id?: number;
					is_goalkeeper?: boolean;
					player_id?: number;
					team_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_team_players_player_id_fkey";
						columns: ["player_id"];
						isOneToOne: false;
						referencedRelation: "championship_players";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "championship_event_team_players_team_id_event_id_fkey";
						columns: ["team_id", "event_id"];
						isOneToOne: false;
						referencedRelation: "championship_event_teams";
						referencedColumns: ["id", "event_id"];
					},
				];
			};
			championship_event_teams: {
				Row: {
					color: string | null;
					event_id: number;
					id: number;
					sort_order: number;
				};
				Insert: {
					color?: string | null;
					event_id: number;
					id?: number;
					sort_order: number;
				};
				Update: {
					color?: string | null;
					event_id?: number;
					id?: number;
					sort_order?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_teams_event_id_fkey";
						columns: ["event_id"];
						isOneToOne: false;
						referencedRelation: "championship_events";
						referencedColumns: ["id"];
					},
				];
			};
			championship_events: {
				Row: {
					championship_id: number;
					created_at: string;
					created_by: string | null;
					deleted_at: string | null;
					ended_at: string | null;
					id: number;
					players_per_team: number;
					starts_at: string;
				};
				Insert: {
					championship_id: number;
					created_at?: string;
					created_by?: string | null;
					deleted_at?: string | null;
					ended_at?: string | null;
					id?: number;
					players_per_team: number;
					starts_at: string;
				};
				Update: {
					championship_id?: number;
					created_at?: string;
					created_by?: string | null;
					deleted_at?: string | null;
					ended_at?: string | null;
					id?: number;
					players_per_team?: number;
					starts_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "championship_events_championship_id_fkey";
						columns: ["championship_id"];
						isOneToOne: false;
						referencedRelation: "championships";
						referencedColumns: ["id"];
					},
				];
			};
			championship_players: {
				Row: ChampionshipPlayersRow;
				Insert: {
					assists?: number;
					avatar_url?: string | null;
					championship_id: number;
					created_at?: string;
					deleted_at?: string | null;
					display_name: string;
					goals?: number;
					id?: number;
					matches?: number;
					nickname?: string | null;
					rating?: number;
					role?: string;
					user_id?: string | null;
					wins?: number;
				};
				Update: {
					assists?: number;
					avatar_url?: string | null;
					championship_id?: number;
					created_at?: string;
					deleted_at?: string | null;
					display_name?: string;
					goals?: number;
					id?: number;
					matches?: number;
					nickname?: string | null;
					rating?: number;
					role?: string;
					user_id?: string | null;
					wins?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_players_championship_id_fkey";
						columns: ["championship_id"];
						isOneToOne: false;
						referencedRelation: "championships";
						referencedColumns: ["id"];
					},
				];
			};
			championships: {
				Row: {
					created_at: string;
					created_by: string;
					deleted_at: string | null;
					event_time: string;
					id: number;
					invite_code: string;
					is_visible: boolean;
					logo_path: string | null;
					name: string;
					players_per_team: number;
				};
				Insert: {
					created_at?: string;
					created_by?: string;
					deleted_at?: string | null;
					event_time?: string;
					id?: number;
					invite_code?: string;
					is_visible?: boolean;
					logo_path?: string | null;
					name: string;
					players_per_team?: number;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					deleted_at?: string | null;
					event_time?: string;
					id?: number;
					invite_code?: string;
					is_visible?: boolean;
					logo_path?: string | null;
					name?: string;
					players_per_team?: number;
				};
				Relationships: [];
			};
			users: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					display_name: string;
					email: string | null;
					id: string;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					display_name: string;
					email?: string | null;
					id: string;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string;
					email?: string | null;
					id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			add_championship_event_team: {
				Args: {
					event_id: number;
					team_color: string | null;
					player_ids: Json;
					goalkeeper_id: number;
				};
				Returns: Json;
			};
			add_championship_event_match: {
				Args: {
					event_id: number;
					team_a_id: number;
					team_b_id: number;
				};
				Returns: Json;
			};
			add_championship_event_goal: {
				Args: {
					match_id: number;
					scorer_player_id: number;
					assist_player_id: number | null;
					is_own_goal: boolean;
				};
				Returns: Json;
			};
			championship_actor_role: {
				Args: { championship_id: number };
				Returns: string;
			};
			championship_player_json: {
				Args: { player: ChampionshipPlayersRow };
				Returns: Json;
			};
			claim_player: {
				Args: { player_id: number };
				Returns: Json;
			};
			current_user_avatar_url: {
				Args: Record<string, never>;
				Returns: string;
			};
			current_user_display_name: {
				Args: Record<string, never>;
				Returns: string;
			};
			deactivate_player: {
				Args: { player_id: number };
				Returns: undefined;
			};
			end_championship_event: {
				Args: { event_id: number; present_player_ids?: Json | null };
				Returns: Json;
			};
			end_championship_event_match: {
				Args: { match_id: number };
				Returns: Json;
			};
			get_championship_by_invite: {
				Args: { invite_code: string };
				Returns: Json;
			};
			is_championship_member: {
				Args: { championship_id: number };
				Returns: boolean;
			};
			join_championship: {
				Args: { invite_code: string };
				Returns: Json;
			};
			owns_championship_logo_object: {
				Args: { object_name: string };
				Returns: boolean;
			};
			reactivate_player: {
				Args: { player_id: number };
				Returns: Json;
			};
			set_player_role: {
				Args: { player_id: number; role: string };
				Returns: Json;
			};
			soft_delete_championship: {
				Args: { championship_id: number };
				Returns: undefined;
			};
			soft_delete_championship_event: {
				Args: { event_id: number };
				Returns: undefined;
			};
			create_championship_event: {
				Args: {
					championship_id: number;
					event_date: string;
				};
				Returns: Json;
			};
			delete_championship_event_team: {
				Args: { team_id: number };
				Returns: Json;
			};
			delete_championship_event_match: {
				Args: { match_id: number };
				Returns: Json;
			};
			set_championship_event_match_player: {
				Args: {
					match_id: number;
					team_id: number;
					slot: number;
					player_id: number | null;
				};
				Returns: Json;
			};
			set_championship_event_match_goalkeeper: {
				Args: {
					match_id: number;
					team_id: number;
					player_id: number;
				};
				Returns: Json;
			};
			start_championship_event_match: {
				Args: {
					event_id: number;
					team_a_id: number;
					team_b_id: number;
				};
				Returns: Json;
			};
			save_championship_event_attendance: {
				Args: {
					event_id: number;
					present_player_ids: Json;
				};
				Returns: Json;
			};
			save_championship_event_teams: {
				Args: {
					event_id: number;
					present_player_ids: Json;
					teams: Json;
				};
				Returns: Json;
			};
			transfer_championship_owner: {
				Args: { player_id: number };
				Returns: Json;
			};
			unlink_player: {
				Args: { player_id: number };
				Returns: Json;
			};
			update_championship_event_team: {
				Args: {
					team_id: number;
					team_color: string | null;
					player_ids: Json;
					goalkeeper_id: number;
				};
				Returns: Json;
			};
			update_championship_event_config: {
				Args: {
					championship_id: number;
					event_time: string;
					players_per_team: number;
				};
				Returns: Json;
			};
			update_championship_name: {
				Args: { championship_id: number; name: string };
				Returns: Json;
			};
			update_championship_visibility: {
				Args: { championship_id: number; is_visible: boolean };
				Returns: Json;
			};
			update_player_nickname: {
				Args: { player_id: number; nickname: string };
				Returns: Json;
			};
			update_player_rating: {
				Args: { player_id: number; rating: number };
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};
