--Copyright (C) 2007 <SWGEmu>

--This File is part of Core3.

--This program is free software; you can redistribute
--it and/or modify it under the terms of the GNU Lesser
--General Public License as published by the Free Software
--Foundation; either version 2 of the License,
--or (at your option) any later version.

--This program is distributed in the hope that it will be useful,
--but WITHOUT ANY WARRANTY; without even the implied warranty of
--MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
--See the GNU Lesser General Public License for
--more details.

--You should have received a copy of the GNU Lesser General
--Public License along with this program; if not, write to
--the Free Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA

--Linking Engine3 statically or dynamically with other modules
--is making a combined work based on Engine3.
--Thus, the terms and conditions of the GNU Lesser General Public License
--cover the whole combination.

--In addition, as a special exception, the copyright holders of Engine3
--give you permission to combine Engine3 program with free software
--programs or libraries that are released under the GNU LGPL and with
--code included in the standard release of Core3 under the GNU LGPL
--license (or modified versions of such code, with unchanged license).
--You may copy and distribute such a system following the terms of the
--GNU LGPL for Engine3 and the licenses of the other code concerned,
--provided that you include the source code of that other code when
--and as the GNU LGPL requires distribution of source code.

--Note that people who make modified versions of Engine3 are not obligated
--to grant this special exception for their modified versions;
--it is their choice whether to do so. The GNU Lesser General Public License
--gives permission to release a modified version without this exception;
--this exception also makes it possible to release a modified version
--which carries forward this exception.
-- Core3 Config File
-- 0 = false, 1 = true

Core3 = {
	MakeLogin = 1,
	MakeZone = 1,
	MakePing = 1,
	MakeStatus = 1,
	MakeWeb = 1,

	ORB = "",
	ORBPort = 44419,

	DBHost = "swgemu_database",
	DBPort = 3306,
	DBName = "swgemu",
	DBUser = "swgemu",
	DBPass = "swgemu-sql",
	DBInstances = 2,
	DBSecret = "swgemus3cr37!", -- Change this! This value should be unique and of reasonable length.

	LoginPort = 44453,
	LoginProcessingThreads = 1,
	LoginAllowedConnections = 3000,
	LoginRequiredVersion = "20050408-18:00",

	MantisHost = "swgemu_database",
	MantisPort = 3306,
	MantisName = "swgemu",
	MantisUser = "swgemu",
	MantisPass = "swgemu-sql",
	MantisPrfx = "mantis_", -- The prefix for your mantis tables.

	MetricsHost = "localhost",
	MetricsPort = 8125,
	MetricsPrefix = "",

	AutoReg = 1,

	ProgressMonitors = "true",

	PingPort = 44462,
	PingAllowedConnections = 3000,

	ZoneProcessingThreads = 10,
	ZoneAllowedConnections = 30000,
	
	-- Galaxy Configuration
	ZoneGalaxyID = 2, --The actual zone server's galaxyID. Should coordinate with your login server.
	ZoneGalaxyName = "Chevelle", --Name of the galaxy as it appears in the server list
	ZoneGalaxyAddress = "jedijamez.local", --Address/hostname for the galaxy
	ZoneGalaxyPort = 44463, --Main port for the galaxy
	ZoneGalaxyPingPort = 44462, --Ping port for the galaxy

	--The following zones are enabled, and will be loaded with server start.
	--To save on RAM and CPU usage, you should only enable the zones you need.
	--In order to disable a zone, all you have to do is comment it out.
	ZonesEnabled = {
		--"09",
		--"10",
		--"11",
		--"character_farm",
		--"cinco_city_test_m5",
		"corellia",
		--"creature_test",
		"dantooine",
		"dathomir",
		--"dungeon1",
		"endor",
		--"endor_asommers",
		--"floratest",
		--"godclient_test",
		"lok",
		"naboo",
		--"otoh_gunga",
		--"rivertest",
		"rori",
		--"runtimerules",
		--"simple",
		--"space_09",
		"space_corellia",
		--"space_corellia_2",
		"space_dantooine",
		"space_dathomir",
		"space_endor",
		--"space_env",
		--"space_halos",
		--"space_heavy1",
		--"space_light1",
		--"space_lok",
		"space_naboo",
		--"space_naboo_2",
		"space_tatooine",
		--"space_tatooine_2",
		"space_yavin4",
		--"taanab",
		"talus",
		"tatooine",
		--"test_wearables",
		"tutorial",
		--"umbra",
		--"watertabletest",
		"yavin4"
	},


	-- Where tre files are stored
	TrePath = "/home/swgemu/Desktop/SWGEmu",

	-- Each tre file (order is important!)
	TreFiles = {
		"dakotatest2.tre",
		"default_patch.tre",
		"patch_sku1_14_00.tre",
		"patch_14_00.tre",
		"patch_sku1_13_00.tre",
		"patch_13_00.tre",
		"patch_sku1_12_00.tre",
		"patch_12_00.tre",
		"patch_11_03.tre",
		"data_sku1_07.tre",
		"patch_11_02.tre",
		"data_sku1_06.tre",
		"patch_11_01.tre",
		"patch_11_00.tre",
		"data_sku1_05.tre",
		"data_sku1_04.tre",
		"data_sku1_03.tre",
		"data_sku1_02.tre",
		"data_sku1_01.tre",
		"data_sku1_00.tre",
		"patch_10.tre",
		"patch_09.tre",
		"patch_08.tre",
		"patch_07.tre",
		"patch_06.tre",
		"patch_05.tre",
		"patch_04.tre",
		"patch_03.tre",
		"patch_02.tre",
		"patch_01.tre",
		"patch_00.tre",
		"data_other_00.tre",
		"data_static_mesh_01.tre",
		"data_static_mesh_00.tre",
		"data_texture_07.tre",
		"data_texture_06.tre",
		"data_texture_05.tre",
		"data_texture_04.tre",
		"data_texture_03.tre",
		"data_texture_02.tre",
		"data_texture_01.tre",
		"data_texture_00.tre",
		"data_skeletal_mesh_01.tre",
		"data_skeletal_mesh_00.tre",
		"data_animation_00.tre",
		"data_sample_04.tre",
		"data_sample_03.tre",
		"data_sample_02.tre",
		"data_sample_01.tre",
		"data_sample_00.tre",
		"data_music_00.tre",
		"bottom.tre"
	},

	-- Status Server Config
	StatusPort = 44455,
	StatusAllowedConnections = 500,
	StatusInterval = 30, -- interval to check if zone is locked up (in seconds)

	-- Web Server Config
	WebPorts = 44460, -- Can be multiple ports 44460,44461
	WebAccessLog = "../log/webaccess.log",
	WebErrorLog = "../log/weberror.log",
	WebSessionTimeout = 600, -- Length that inactive web sessions expire

	DeleteCharacters = 10, -- How often in minutes to purge deleted characters
	MaxNavMeshJobs = 6,
	MaxAuctionSearchJobs = 1,
	DumpObjFiles = 1,

	UnloadContainers = 1, -- Whether to unload container contents from RAM after the container hasn't been accessed for a time

	LogFile = "log/chevelle.log",
	LogFileLevel = 4, -- -1 NONE, 0 FATAL, 1 ERROR, 2 WARNING, 3 LOG, 4 INFO, 5 DEBUG
	LogJSON = 0, -- global log output in JSON format
	LogSync = 0, -- flush global log file after each write

	LuaLogJSON = 0,
	PathfinderLogJSON = 0,

	TermsOfServiceVersion = 0,
	TermsOfService = "",

	CleanupMailCount = 25000,

	RESTServerPort = 0,

	InactiveAccountTitle = "Account Disabled",
	InactiveAccountText = "The server administrators have disabled your account.",

	CharacterBuilderEnabled = "true", -- Enable character builder terminals by default

	PlayerLogLevel = 4, -- -1 NONE, 0 FATAL, 1 ERROR, 2 WARNING, 3 LOG, 4 INFO, 5 DEBUG
	MaxLogLines = 1000000, -- how often to rotate log (currently only log/player.log rotates)
}

-- NOTE: conf/config-local.lua is parsed after this file if it exists
