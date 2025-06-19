const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const top = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Cập nhật vị trí có mention')
  .addIntegerOption(o => o.setName('số').setDescription('Vị trí từ 1 đến 10').setRequired(true))
  .addStringOption(o => o.setName('tên').setDescription('Tên người chơi').setRequired(true))
  .addUserOption(o => o.setName('mention').setDescription('Người dùng').setRequired(true));

const topnomention = new SlashCommandBuilder()
  .setName('topnomention')
  .setDescription('Cập nhật vị trí không mention')
  .addIntegerOption(o => o.setName('số').setDescription('Vị trí từ 1 đến 10').setRequired(true))
  .addStringOption(o => o.setName('tên').setDescription('Tên người chơi').setRequired(true));

const topremove = new SlashCommandBuilder()
  .setName('topremove')
  .setDescription('Xoá người chơi khỏi bảng xếp hạng')
  .addIntegerOption(o => o.setName('số').setDescription('Vị trí từ 1 đến 10').setRequired(true));

const setgif = new SlashCommandBuilder()
  .setName('topsetgif')
  .setDescription('Thay ảnh gif ở dưới bảng xếp hạng')
  .addStringOption(option =>
    option.setName('url')
      .setDescription('Đường dẫn ảnh gif (.gif)')
      .setRequired(true)
  );

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🗑️ Đang xoá tất cả lệnh cũ...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log('✅ Đang đăng slash commands mới...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      {
        body: [
          top.toJSON(),
          topnomention.toJSON(),
          topremove.toJSON(),
          setgif.toJSON()
        ]
      }
    );

    console.log('✅ Slash commands đã được cập nhật thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi xử lý slash command:', err);
  }
})();
