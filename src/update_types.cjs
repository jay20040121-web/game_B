const fs = require('fs');
const path = 'c:/Users/j770121/Desktop/怪獸對打機專案/game_A/src/monsterData.js';
let content = fs.readFileSync(path, 'utf8');

const newTypeSkills = `export const TYPE_SKILLS = {
    "normal": [
        "extreme_speed", "quick_attack", "fake_out", "feint", "hyper_beam", "giga_impact", "last_resort", "skull_bash", "mega_kick", "thrash", "double_edge", "swords_dance", "growth", "double_team", "harden", "minimize", "defense_curl", "egg_bomb", "sharpen", "stockpile", "judgment", "take_down", "uproar", "hyper_voice", "rock_climb", "body_slam", "mega_punch", "razor_wind", "slam", "strength", "hyper_fang", "tri_attack", "crush_claw", "headbutt", "dizzy_punch", "slash", "facade", "smelling_salts", "secret_power", "stomp"
    ],
    "flying": [
        "sky_attack", "brave_bird", "dragon_ascent", "hurricane", "aeroblast", "beak_blast", "bleakwind_storm", "fly", "floaty_fall", "bounce", "drill_peck", "oblivion_wing", "air_slash", "chatter", "wing_attack", "air_cutter", "aerial_ace", "pluck", "sky_drop", "acrobatics", "gust", "dual_wingbeat", "peck"
    ],
    "poison": [
        "gunk_shot", "belch", "acid_armor", "coil", "noxious_torque", "malignant_chain", "sludge_wave", "sludge_bomb", "shell_side_arm", "poison_jab", "dire_claw", "cross_poison", "sludge", "venoshock", "barb_barrage", "poison_fang", "poison_tail", "clear_smog", "acid", "acid_spray", "smog", "mortal_spin", "poison_sting"
    ],
    "rock": [
        "accelerock", "rock_wrecker", "head_smash", "meteor_beam", "rock_polish", "stone_edge", "diamond_storm", "mighty_cleave", "power_gem", "rock_slide", "stone_axe", "ancient_power", "rock_tomb", "rock_throw", "smack_down", "salt_cure", "rollout", "rock_blast"
    ],
    "bug": [
        "first_impression", "megahorn", "tail_glow", "defend_order", "quiver_dance", "bug_buzz", "attack_order", "pollen_puff", "leech_life", "x_scissor", "lunge", "signal_beam", "u_turn", "skitter_smack", "steamroller", "silver_wind", "bug_bite", "struggle_bug", "fell_stinger", "pounce", "fury_cutter", "twineedle", "pin_missile", "infestation"
    ],
    "ghost": [
        "shadow_sneak", "shadow_force", "astral_barrage", "poltergeist", "moongeist_beam", "phantom_force", "spectral_thief", "shadow_bone", "shadow_ball", "spirit_shackle", "bitter_malice", "shadow_claw", "hex", "shadow_punch", "ominous_wind", "infernal_parade", "last_respects", "rage_fist", "lick", "astonish"
    ],
    "fire": [
        "eruption", "blast_burn", "shell_trap", "mind_blown", "overheat", "blue_flare", "burn_up", "flare_blitz", "pyro_ball", "raging_fury", "armor_cannon", "fire_blast", "sacred_fire", "magma_storm", "inferno", "searing_shot", "fusion_flare", "heat_wave", "flamethrower", "bitter_blade", "blaze_kick", "lava_plume", "fire_pledge", "fiery_dance", "fire_lash", "torch_song", "blazing_torque", "fire_punch", "mystical_fire", "temper_flare", "flame_burst", "burning_jealousy", "fire_fang", "flame_wheel", "incinerate", "sizzly_slide", "flame_charge", "ember", "fire_spin"
    ],
    "water": [
        "jet_punch", "aqua_jet", "water_shuriken", "hydro_cannon", "water_spout", "wave_crash", "hydro_pump", "steam_eruption", "origin_pulse", "withdraw", "crabhammer", "surf", "muddy_water", "aqua_tail", "sparkling_aria", "splishy_splash", "liquidation", "fishious_rend", "waterfall", "dive", "scald", "water_pledge", "snipe_shot", "aqua_step", "hydro_steam", "razor_shell", "aqua_cutter", "bubble_beam", "octazooka", "brine", "water_pulse", "bouncy_bubble", "flip_turn", "chilling_water", "water_gun", "bubble", "clamp", "whirlpool", "triple_dive", "surging_strikes"
    ],
    "grass": [
        "frenzy_plant", "chloroblast", "leaf_storm", "solar_blade", "solar_beam", "petal_dance", "power_whip", "wood_hammer", "seed_flare", "cotton_guard", "sappy_seed", "leaf_blade", "energy_ball", "petal_blizzard", "seed_bomb", "grass_pledge", "drum_beating", "apple_acid", "grav_apple", "giga_drain", "horn_leech", "trop_kick", "flower_trick", "leaf_tornado", "needle_arm", "magical_leaf", "razor_leaf", "grassy_glide", "trailblaze", "vine_whip", "mega_drain", "leafage", "branch_poke", "snap_trap", "bullet_seed", "absorb"
    ]
};`;

const startTag = 'export const TYPE_SKILLS = {';
const endTag = '};';

const startIndex = content.indexOf(startTag);
// We need to find the FIRST endTag AFTER startIndex
const nextIndex = content.indexOf(endTag, startIndex);
// But wait, there are many '};' in TYPE_SKILLS. We need the one that matches the opening brace.
// Let's use a simpler approach: we know it's currently at line 2323 to 2876.
// Or just replace the whole section between 'export const TYPE_SKILLS = {' and '// --- 其他戰鬥與遊戲邏輯 ---'

const endMarker = '// --- 其他戰鬥與遊戲邏輯 ---';
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + newTypeSkills + '\n\n' + content.substring(endIndex);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Successfully updated TYPE_SKILLS.');
} else {
    console.error('Could not find TYPE_SKILLS section.');
}
