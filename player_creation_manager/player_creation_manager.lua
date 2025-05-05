--Should all created players start with God Mode? 1 = yes, 0 = no
freeGodMode = 0;
--How many cash credits new characters start with after creating a character (changed during test phase, normal value is 100)
startingCash = 10000
--startingCash = 100000
--How many bank credits new characters start with after creating a character (changed during test phase, normal value is 1000)
startingBank = 50000
--startingBank = 100000
--How many skill points a new characters start with
skillPoints = 250

professions = {
	"combat_brawler",
	"combat_marksman",
	"crafting_artisan",
	"jedi",
	"outdoors_scout",
	"science_medic",
	"social_entertainer"
}

marksmanPistol = "object/weapon/ranged/pistol/pistol_cdef.iff"
	
marksmanRifle = "object/weapon/ranged/rifle/rifle_cdef.iff"

marksmanCarbine = "object/weapon/ranged/carbine/carbine_cdef.iff"

brawlerOneHander = "object/weapon/melee/knife/knife_stone.iff"

brawlerTwoHander = "object/weapon/melee/axe/axe_heavy_duty.iff"

brawlerPolearm = "object/weapon/melee/polearm/lance_staff_wood_s1.iff"

survivalKnife = "object/weapon/melee/knife/knife_survival.iff"

genericTool = "object/tangible/crafting/station/generic_tool.iff"

foodTool = "object/tangible/crafting/station/food_tool.iff"

mineralTool = "object/tangible/survey_tool/survey_tool_mineral.iff"

chemicalTool = "object/tangible/survey_tool/survey_tool_liquid.iff"

slitherhorn = "object/tangible/instrument/slitherhorn.iff"

marojMelon = "object/tangible/food/foraged/foraged_fruit_s1.iff"

x31Speeder = "object/tangible/deed/vehicle_deed/landspeeder_x31_deed.iff"

-- Additional Armor Items
compositeArmorBoots = "object/tangible/wearables/armor/composite/armor_composite_boots.iff"
compositeArmorHelmet = "object/tangible/wearables/armor/composite/armor_composite_helmet.iff"
compositeArmorChest = "object/tangible/wearables/armor/composite/armor_composite_chest_plate.iff"
compositeArmorGloves = "object/tangible/wearables/armor/composite/armor_composite_gloves.iff"
compositeArmorLeggings = "object/tangible/wearables/armor/composite/armor_composite_leggings.iff"
compositeBicep_l = "object/tangible/wearables/armor/composite/armor_composite_bicep_l.iff"
compositeBicep_r = "object/tangible/wearables/armor/composite/armor_composite_bicep_r.iff"
compositeArmor_bracer_l = "object/tangible/wearables/armor/composite/armor_composite_bracer_l.iff"
compositeArmor_bracer_r = "object/tangible/wearables/armor/composite/armor_composite_bracer_r.iff"

-- Additional Vehicle Deeds
x34Speeder = "object/tangible/deed/vehicle_deed/landspeeder_x34_deed.iff"
flashSpeeder = "object/tangible/deed/vehicle_deed/speederbike_flash_deed.iff"
barc = "object/tangible/deed/vehicle_deed/barc_speeder_deed.iff"
swoop = "object/tangible/deed/vehicle_deed/speederbike_swoop_deed.iff"
speederbike = "object/tangible/deed/vehicle_deed/speederbike_deed.iff"
jetpack = "object/tangible/deed/vehicle_deed/jetpack_deed.iff"

-- Character Builder Terminal
characterBuilderTerminal = "object/tangible/terminal/terminal_character_builder.iff"

professionSpecificItems = {
	combat_brawler = { brawlerOneHander, brawlerTwoHander, brawlerPolearm },
	combat_marksman = { marksmanPistol, marksmanCarbine, marksmanRifle },
	crafting_artisan = { genericTool, mineralTool, chemicalTool },
	jedi = { },
	outdoors_scout = { genericTool },
	science_medic = { foodTool },
	social_entertainer = { slitherhorn }
}

commonStartingItems = { 
    marojMelon, 
    survivalKnife, 
    speederbike,
    
    -- Armor
		-- compositeArmorBoots,
		-- compositeArmorHelmet,
		-- compositeArmorChest,
		-- compositeArmorGloves,
		-- compositeArmorLeggings,
		-- compositeBicep_l,
		-- compositeBicep_r,
		-- compositeArmor_bracer_l,
		-- compositeArmor_bracer_r,
    
    -- Additional Vehicles
    	-- x34Speeder,
    	-- flashSpeeder,
    	-- barc,
    	-- swoop,
    	-- speederbike,
    	-- jetpack,
    
    -- Character Builder Terminal
    	-- characterBuilderTerminal
}
