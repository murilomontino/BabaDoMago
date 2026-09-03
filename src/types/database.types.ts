export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

type ChampionshipPlayersRow = {
	assists: number;
	assisted_goals: number;
	avatar_url: string | null;
	championship_id: number;
	created_at: string;
	deleted_at: string | null;
	display_name: string;
	goals: number;
	id: number;
	matches: number;
	own_goals: number;
	nickname: string | null;
	nickname_tags: string[];
	rating: number;
	removed_at: string | null;
	role: string;
	is_goalkeeper: boolean;
	is_monthly: boolean;
	user_id: string | null;
	wins: number;
	losses: number;
	draws: number;
	mvps: number;
};

export type Database = {
	public: {
		Tables: {
			championship_audit_logs: {
				Row: {
					action: string;
					actor_display_name: string;
					actor_user_id: string | null;
					after_data: Json | null;
					before_data: Json | null;
					championship_id: number;
					created_at: string;
					entity_id: number | null;
					entity_type: string;
					id: number;
				};
				Insert: {
					action: string;
					actor_display_name: string;
					actor_user_id?: string | null;
					after_data?: Json | null;
					before_data?: Json | null;
					championship_id: number;
					created_at?: string;
					entity_id?: number | null;
					entity_type: string;
					id?: number;
				};
				Update: {
					action?: string;
					actor_display_name?: string;
					actor_user_id?: string | null;
					after_data?: Json | null;
					before_data?: Json | null;
					championship_id?: number;
					created_at?: string;
					entity_id?: number | null;
					entity_type?: string;
					id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_audit_logs_championship_id_fkey";
						columns: ["championship_id"];
						isOneToOne: false;
						referencedRelation: "championships";
						referencedColumns: ["id"];
					},
				];
			};
			championship_event_attendance: {
				Row: {
					assists: number;
					assisted_goals: number;
					display_name: string;
					event_date: string;
					event_id: number;
					goals: number;
					id: number;
					is_goalkeeper: boolean;
					matches: number;
					own_goals: number;
					player_id: number;
					rating: number;
					rating_delta: number;
					vote_rating_delta: number;
					vote_rating_applied: number;
					wins: number;
					losses: number;
					draws: number;
					is_mvp: boolean;
					mvp_overridden: boolean;
				};
				Insert: {
					assists?: number;
					assisted_goals?: number;
					display_name: string;
					event_date?: string;
					event_id: number;
					goals?: number;
					id?: number;
					is_goalkeeper?: boolean;
					matches?: number;
					own_goals?: number;
					player_id: number;
					rating?: number;
					rating_delta?: number;
					vote_rating_delta?: number;
					vote_rating_applied?: number;
					wins?: number;
					losses?: number;
					draws?: number;
					is_mvp?: boolean;
					mvp_overridden?: boolean;
				};
				Update: {
					assists?: number;
					assisted_goals?: number;
					display_name?: string;
					event_date?: string;
					is_goalkeeper?: boolean;
					event_id?: number;
					goals?: number;
					id?: number;
					matches?: number;
					own_goals?: number;
					player_id?: number;
					rating?: number;
					rating_delta?: number;
					vote_rating_delta?: number;
					vote_rating_applied?: number;
					wins?: number;
					losses?: number;
					draws?: number;
					is_mvp?: boolean;
					mvp_overridden?: boolean;
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
			championship_event_player_votes: {
				Row: {
					created_at: string;
					event_id: number;
					id: number;
					target_player_id: number;
					updated_at: string;
					value: string;
					voter_player_id: number;
				};
				Insert: {
					created_at?: string;
					event_id: number;
					id?: number;
					target_player_id: number;
					updated_at?: string;
					value: string;
					voter_player_id: number;
				};
				Update: {
					created_at?: string;
					event_id?: number;
					id?: number;
					target_player_id?: number;
					updated_at?: string;
					value?: string;
					voter_player_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_player_votes_event_id_fkey";
						columns: ["event_id"];
						isOneToOne: false;
						referencedRelation: "championship_events";
						referencedColumns: ["id"];
					},
				];
			};
			championship_event_rsvp: {
				Row: {
					event_id: number;
					id: number;
					player_id: number;
					status: string;
					updated_at: string;
				};
				Insert: {
					event_id: number;
					id?: number;
					player_id: number;
					status: string;
					updated_at?: string;
				};
				Update: {
					event_id?: number;
					id?: number;
					player_id?: number;
					status?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "championship_event_rsvp_event_id_fkey";
						columns: ["event_id"];
						isOneToOne: false;
						referencedRelation: "championship_events";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "championship_event_rsvp_player_id_fkey";
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
					duration_seconds: number;
					ended_at: string | null;
					event_id: number;
					id: number;
					pause_accumulated_seconds: number;
					paused_at: string | null;
					started_at: string | null;
					team_a_id: number;
					team_b_id: number;
					winner_team_id: number | null;
				};
				Insert: {
					created_at?: string;
					duration_seconds: number;
					ended_at?: string | null;
					event_id: number;
					id?: number;
					pause_accumulated_seconds?: number;
					paused_at?: string | null;
					started_at?: string | null;
					team_a_id: number;
					team_b_id: number;
					winner_team_id?: number | null;
				};
				Update: {
					created_at?: string;
					duration_seconds?: number;
					ended_at?: string | null;
					event_id?: number;
					id?: number;
					pause_accumulated_seconds?: number;
					paused_at?: string | null;
					started_at?: string | null;
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
					include_stats: boolean;
					is_goalkeeper: boolean;
					is_substituted: boolean;
					match_id: number;
					player_id: number;
					slot: number | null;
					team_id: number;
				};
				Insert: {
					display_name: string;
					event_id: number;
					id?: number;
					include_stats?: boolean;
					is_goalkeeper?: boolean;
					is_substituted?: boolean;
					match_id: number;
					player_id: number;
					slot?: number | null;
					team_id: number;
				};
				Update: {
					display_name?: string;
					event_id?: number;
					id?: number;
					include_stats?: boolean;
					is_goalkeeper?: boolean;
					is_substituted?: boolean;
					match_id?: number;
					player_id?: number;
					slot?: number | null;
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
					elapsed_seconds: number | null;
					event_id: number;
					id: number;
					is_own_goal: boolean;
					match_id: number;
					scorer_player_id: number;
				};
				Insert: {
					assist_player_id?: number | null;
					created_at?: string;
					elapsed_seconds?: number | null;
					event_id: number;
					id?: number;
					is_own_goal?: boolean;
					match_id: number;
					scorer_player_id: number;
				};
				Update: {
					assist_player_id?: number | null;
					created_at?: string;
					elapsed_seconds?: number | null;
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
					is_active: boolean;
					sort_order: number;
					template_goalkeeper_id: number;
					template_player_ids: Json;
				};
				Insert: {
					color?: string | null;
					event_id: number;
					id?: number;
					is_active?: boolean;
					sort_order: number;
					template_goalkeeper_id?: number;
					template_player_ids?: Json;
				};
				Update: {
					color?: string | null;
					event_id?: number;
					id?: number;
					is_active?: boolean;
					sort_order?: number;
					template_goalkeeper_id?: number;
					template_player_ids?: Json;
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
					player_votes_closed_at: string | null;
					players_per_team: number;
					skip_guest_goalkeeper_matches: boolean;
					starts_at: string;
				};
				Insert: {
					championship_id: number;
					created_at?: string;
					created_by?: string | null;
					deleted_at?: string | null;
					ended_at?: string | null;
					id?: number;
					player_votes_closed_at?: string | null;
					players_per_team: number;
					skip_guest_goalkeeper_matches?: boolean;
					starts_at: string;
				};
				Update: {
					championship_id?: number;
					created_at?: string;
					created_by?: string | null;
					deleted_at?: string | null;
					ended_at?: string | null;
					id?: number;
					player_votes_closed_at?: string | null;
					players_per_team?: number;
					skip_guest_goalkeeper_matches?: boolean;
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
					assisted_goals?: number;
					avatar_url?: string | null;
					championship_id: number;
					created_at?: string;
					deleted_at?: string | null;
					display_name: string;
					goals?: number;
					id?: number;
					matches?: number;
					nickname?: string | null;
					nickname_tags?: string[];
					own_goals?: number;
					rating?: number;
					removed_at?: string | null;
					role?: string;
					is_goalkeeper?: boolean;
					is_monthly?: boolean;
					user_id?: string | null;
					wins?: number;
					losses?: number;
					draws?: number;
					mvps?: number;
				};
				Update: {
					assists?: number;
					assisted_goals?: number;
					avatar_url?: string | null;
					championship_id?: number;
					created_at?: string;
					deleted_at?: string | null;
					display_name?: string;
					goals?: number;
					id?: number;
					matches?: number;
					nickname?: string | null;
					nickname_tags?: string[];
					own_goals?: number;
					rating?: number;
					removed_at?: string | null;
					role?: string;
					is_goalkeeper?: boolean;
					is_monthly?: boolean;
					user_id?: string | null;
					wins?: number;
					losses?: number;
					draws?: number;
					mvps?: number;
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
					event_weekday: number | null;
					id: number;
					invite_code: string;
					is_visible: boolean;
					location: string | null;
					logo_path: string | null;
					name: string;
					players_per_team: number;
					rating_drop_goal_share: boolean;
					rating_drop_share_exclude_top: boolean;
					player_vote_quorum: number;
					skip_guest_goalkeeper_matches: boolean;
				};
				Insert: {
					created_at?: string;
					created_by?: string;
					deleted_at?: string | null;
					event_time?: string;
					event_weekday?: number | null;
					id?: number;
					invite_code?: string;
					is_visible?: boolean;
					location?: string | null;
					logo_path?: string | null;
					name: string;
					players_per_team?: number;
					rating_drop_goal_share?: boolean;
					rating_drop_share_exclude_top?: boolean;
					player_vote_quorum?: number;
					skip_guest_goalkeeper_matches?: boolean;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					deleted_at?: string | null;
					event_time?: string;
					event_weekday?: number | null;
					id?: number;
					invite_code?: string;
					is_visible?: boolean;
					location?: string | null;
					logo_path?: string | null;
					name?: string;
					players_per_team?: number;
					rating_drop_goal_share?: boolean;
					rating_drop_share_exclude_top?: boolean;
					player_vote_quorum?: number;
					skip_guest_goalkeeper_matches?: boolean;
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
					is_active?: boolean;
				};
				Returns: Json;
			};
			add_championship_event_match:
				| {
						Args: {
							event_id: number;
							team_a_id: number;
							team_b_id: number;
						};
						Returns: Json;
				  }
				| {
						Args: {
							event_id: number;
							team_a_id: number;
							team_b_id: number;
							duration_seconds: number;
						};
						Returns: Json;
				  };
			add_championship_event_goal: {
				Args: {
					match_id: number;
					scorer_player_id: number;
					assist_player_id: number | null;
					is_own_goal: boolean;
					elapsed_seconds?: number | null;
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
			draw_championship_event_teams: {
				Args: {
					event_id: number;
					present_player_ids: Json;
					teams: Json;
					goalkeeper_player_ids: Json;
				};
				Returns: Json;
			};
			end_championship_event: {
				Args: {
					event_id: number;
					present_player_ids?: Json | null;
					mvp_player_ids?: Json | null;
				};
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
			save_event_draw_audit: {
				Args: {
					p_event_id: number;
					p_championship_id: number;
					p_seed: number;
					p_algorithm_version: number;
					p_input_snapshot: Json;
					p_output_snapshot: Json;
					p_input_hash: string;
				};
				Returns: number;
			};
			list_championship_audit_logs: {
				Args: {
					p_championship_id: number;
					p_action?: string | null;
					p_before_id?: number | null;
					p_page_size?: number;
				};
				Returns: {
					action: string;
					actor_display_name: string;
					actor_user_id: string | null;
					after_data: Json | null;
					before_data: Json | null;
					championship_id: number;
					created_at: string;
					entity_id: number | null;
					entity_type: string;
					id: number;
				}[];
			};
			merge_championship_players: {
				Args: { keep_player_id: number; absorb_player_id: number };
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
			remove_player: {
				Args: { player_id: number };
				Returns: undefined;
			};
			set_championship_event_mvps: {
				Args: { event_id: number; player_ids: Json };
				Returns: Json;
			};
			close_championship_event_player_votes: {
				Args: { event_id: number };
				Returns: Json;
			};
			vote_championship_event_player: {
				Args: {
					event_id: number;
					target_player_id: number;
					value: string | null;
				};
				Returns: Json;
			};
			championship_event_player_vote_applied_delta: {
				Args: {
					like_count: number;
					dislike_count: number;
					maintain_count: number;
				};
				Returns: number;
			};
			set_championship_event_team_active: {
				Args: { team_id: number; is_active: boolean };
				Returns: Json;
			};
			set_player_role: {
				Args: { player_id: number; role: string };
				Returns: Json;
			};
			set_player_is_goalkeeper: {
				Args: { player_id: number; is_goalkeeper: boolean };
				Returns: Json;
			};
			set_player_is_monthly: {
				Args: { player_id: number; is_monthly: boolean };
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
					event_time?: string;
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
					include_stats?: boolean;
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
			swap_championship_event_match_team: {
				Args: {
					match_id: number;
					outgoing_team_id: number;
					incoming_team_id: number;
				};
				Returns: Json;
			};
			start_championship_event_match:
				| {
						Args: {
							event_id: number;
							team_a_id: number;
							team_b_id: number;
						};
						Returns: Json;
				  }
				| {
						Args: {
							event_id: number;
							team_a_id: number;
							team_b_id: number;
							duration_seconds: number;
						};
						Returns: Json;
				  };
			start_championship_event_clock: {
				Args: { match_id: number };
				Returns: Json;
			};
			pause_championship_event_match: {
				Args: { match_id: number };
				Returns: Json;
			};
			resume_championship_event_match: {
				Args: { match_id: number };
				Returns: Json;
			};
			save_championship_event_attendance: {
				Args: {
					event_id: number;
					present_player_ids: Json;
					goalkeeper_player_ids: Json;
				};
				Returns: Json;
			};
			ensure_championship_event_attendance_player: {
				Args: {
					event_id: number;
					player_id: number;
				};
				Returns: Json;
			};
			upsert_championship_event_rsvp: {
				Args: {
					p_event_id: number;
					p_status: string;
				};
				Returns: Json;
			};
			promote_championship_event_rsvp_going: {
				Args: {
					event_id: number;
				};
				Returns: Json;
			};
			save_championship_event_attendance_stats: {
				Args: {
					event_id: number;
					stats: Json;
				};
				Returns: Json;
			};
			save_championship_player_event_stats: {
				Args: {
					player_id: number;
					event_id: number;
					goals: number;
					assists: number;
					wins: number;
					losses: number;
					draws: number;
					matches: number;
				};
				Returns: Json;
			};
			save_championship_event_teams: {
				Args: {
					event_id: number;
					present_player_ids: Json;
					teams: Json;
					goalkeeper_player_ids: Json;
				};
				Returns: Json;
			};
			transfer_championship_owner: {
				Args: { player_id: number };
				Returns: Json;
			};
			reopen_championship_event_match: {
				Args: { match_id: number };
				Returns: Json;
			};
			undo_championship_event_goal: {
				Args: { match_id: number; goal_id: number };
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
					skip_guest_goalkeeper_matches?: boolean;
					event_weekday?: number | null;
					location?: string | null;
					rating_drop_goal_share?: boolean;
					rating_drop_share_exclude_top?: boolean;
					player_vote_quorum?: number;
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
				Args: {
					player_id: number;
					nickname: string;
					nickname_tags: string[];
				};
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
