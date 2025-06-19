const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const TOP_CHANNEL_ID = '1378214394521194526';
const LEADER_ROLE_ID = process.env.LEADER_ROLE_ID;
const DATA_FILE = './top-data.json';

let topList = Array(10).fill({ name: 'Chưa có ai', mention: '...' });
let messageId = null;
let gifUrl = 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnkwMjdpMzdrZWYydXBsY2I1OTNtbmE1NDl6ejhubjI1aXppd2VyZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zwPRprvrP4Lm0/giphy.gif';

if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  topList = data.topList || topList;
  messageId = data.messageId || null;
  gifUrl = data.gifUrl || gifUrl;
}

client.once('ready', async () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
  const channel = await client.channels.fetch(TOP_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return console.error('❌ Kênh không hợp lệ.');

  try {
    await channel.messages.fetch(messageId);
    console.log('✅ Tìm thấy message cũ');
  } catch {
    console.warn('⚠️ Không tìm thấy message cũ. Tạo mới.');
    const newEmbed = buildTopEmbed();
    const sent = await channel.send({ embeds: [newEmbed] });
    messageId = sent.id;
    saveData();
  }

  setInterval(async () => {
    try {
      const msg = await channel.messages.fetch(messageId);
      if (!msg.embeds.length || !msg.embeds[0].description.includes('1.')) {
        console.warn('⚠️ Mất embed, tạo lại.');
        const newEmbed = buildTopEmbed();
        const sent = await channel.send({ embeds: [newEmbed] });
        messageId = sent.id;
        saveData();
      }
    } catch (err) {
      console.error('❌ Kiểm tra lỗi:', err);
    }
  }, 10000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (!member.roles.cache.has(LEADER_ROLE_ID)) {
    return interaction.reply({ content: '❌ Chỉ Leader mới được dùng.', flags: 1 << 6 });
  }

  const channel = await client.channels.fetch(TOP_CHANNEL_ID);

  if (interaction.commandName === 'top') {
    const index = interaction.options.getInteger('số');
    const username = interaction.options.getString('tên');
    const mentionUser = interaction.options.getUser('mention');
    if (index < 1 || index > 10) return interaction.reply({ content: '❌ Chỉ từ 1 đến 10.', flags: 1 << 6 });

    topList[index - 1] = {
      name: username,
      mention: `<@${mentionUser.id}>`
    };

  } else if (interaction.commandName === 'topnomention') {
    const index = interaction.options.getInteger('số');
    const username = interaction.options.getString('tên');
    if (index < 1 || index > 10) return interaction.reply({ content: '❌ Chỉ từ 1 đến 10.', flags: 1 << 6 });

    topList[index - 1] = {
      name: username,
      mention: 'Không đề cập'
    };

  } else if (interaction.commandName === 'topremove') {
    const index = interaction.options.getInteger('số');
    if (index < 1 || index > 10) return interaction.reply({ content: '❌ Chỉ từ 1 đến 10.', flags: 1 << 6 });

    topList[index - 1] = {
      name: 'Chưa có ai',
      mention: '...'
    };

  } else if (interaction.commandName === 'topsetgif') {
    const url = interaction.options.getString('url');
    if (!url.endsWith('.gif')) {
      return interaction.reply({ content: '❌ Link phải kết thúc bằng `.gif`.', flags: 1 << 6 });
    }

    gifUrl = url;
    try {
      const msg = await channel.messages.fetch(messageId);
      const newEmbed = buildTopEmbed();
      await msg.edit({ embeds: [newEmbed] });
      saveData();
      return interaction.reply({ content: '✅ Đã đổi ảnh gif!', flags: 1 << 6 });
    } catch {
      return interaction.reply({ content: '❌ Lỗi khi đổi ảnh gif.', flags: 1 << 6 });
    }
  }

  // Sau mỗi lệnh, cập nhật lại bảng
  try {
    const msg = await channel.messages.fetch(messageId);
    const newEmbed = buildTopEmbed();
    await msg.edit({ embeds: [newEmbed] });
    saveData();

    return interaction.reply({ content: '✅ Cập nhật thành công!', flags: 1 << 6 });
  } catch (error) {
    if (error.code === 10008) {
      const newEmbed = buildTopEmbed();
      const sent = await channel.send({ embeds: [newEmbed] });
      messageId = sent.id;
      saveData();

      return interaction.reply({ content: '📩 Message cũ đã bị xoá. Tạo lại mới.', flags: 1 << 6 });
    } else {
      console.error('❌ Lỗi không xác định:', error);
      return interaction.reply({ content: '❌ Lỗi khi cập nhật.', flags: 1 << 6 });
    }
  }
});

client.on('messageDelete', async deletedMessage => {
  if (deletedMessage.id !== messageId) return;
  console.log('⚠️ Embed bị xoá, tạo lại.');

  const channel = await client.channels.fetch(TOP_CHANNEL_ID);
  const newEmbed = buildTopEmbed();
  const sent = await channel.send({ embeds: [newEmbed] });
  messageId = sent.id;
  saveData();
});

function buildTopEmbed() {
  return new EmbedBuilder()
    .setTitle('Top Players Paradise')
    .setColor('#00FF9C')
    .setDescription(
      topList.map((user, i) => `**${i + 1}. ${user.name} || ${user.mention}**`).join('\n') +
      '\n\n`━━━━━━━━━━━━━━━━━━━━━━━`\n'
    )
    .setImage(gifUrl)
    .setFooter({ text: 'Mesubeso' });
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ topList, messageId, gifUrl }, null, 2));
}

client.login(process.env.TOKEN);

process.on('unhandledRejection', error => {
  console.error('❌ Lỗi không bắt được:', error);
});

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Bot is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server đang chạy tại cổng ${PORT}`);
});
