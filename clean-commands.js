const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

(async () => {
  try {
    console.log('🧹 Đang xoá toàn bộ lệnh GUILD...');
    const guildCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
    for (const command of guildCommands) {
      await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
      console.log(`❌ Đã xoá GUILD command: ${command.name}`);
    }

    console.log('🧹 Đang xoá toàn bộ lệnh GLOBAL...');
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
    for (const command of globalCommands) {
      await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
      console.log(`❌ Đã xoá GLOBAL command: ${command.name}`);
    }

    console.log('✅ Đã xoá xong toàn bộ slash commands');
  } catch (error) {
    console.error('❌ Lỗi khi xoá slash commands:', error);
  }
})();
