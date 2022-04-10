const { Client } = require("discord.js");
const client = new Client({ disableEveryone: true, disabledEvents: ["TYPING_START"], intents: 32767, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const config = require("./config.js");
const mongoose = require("mongoose");
let ROLES = require("./models/roles");

client.on("ready", () => {
    console.log(`${client.user.username} is connected...`);
    mongoose.connect(config.mongodb, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err) => {
        if (err) return console.error(err);
        console.log("Database is connected...")
    });

    let guild = client.guilds.cache.get(config.guildID);

    (guild ? guild.commands : client.application?.commands)?.create({
        name: "set",
        description: "Add roles",
        options: [{
            name: "messageid",
            description: "Message ID",
            required: true,
            type: "STRING"
        },
        {
            name: "emote",
            description: "Emote for give/remove actions",
            required: true,
            type: "STRING"
        },
        {
            name: "givenrole",
            description: "Given role when they press the emote",
            type: "ROLE"
        },
        {
            name: "removedrole",
            description: "Taken role when they press the emote",
            type: "ROLE"
        }
        ]
    });
});

client.on("interactionCreate", interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName == "set") {
        let id = interaction.options.getString("messageid");
        let emote = interaction.options.getString("emote");
        let givenrole = interaction.options.getRole("givenrole");
        let removedrole = interaction.options.getRole("removedrole");
        let emotes = (str) => str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);

        interaction.channel.messages.fetch(id)
            .then(async msg => {
                if (!emotes(emote)) interaction.reply({ content: "Choose a valid emote", ephemeral: true })
                else if (!removedrole && !givenrole) interaction.reply({ content: "Provide at least one role to give/remove", ephemeral: true })
                else {
                    await new ROLES({
                        messageid: id,
                        emote: emote?.split("<:")?.join("")?.split(":")[1]?.split(">")?.join("") ?? emote,
                        givenrole: givenrole?.id ?? "",
                        removedrole: removedrole?.id ?? ""
                    }).save();

                    msg?.react(emote);
                    interaction.reply({ content: "Reaction roles has been assigned to the message", ephemeral: true });
                }
            })
            .catch(() => {
                interaction.reply({ content: "Couldn't find the message, make sure you are running the command in the right channel of the message", ephemeral: true })
            })
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    let emote = await ROLES.findOne({ messageid: reaction.message.id, emote: reaction.emoji?.id ?? reaction.emoji.name })
    if (emote) {
        if(emote.removedrole) client.guilds.cache.get(config.guildID).members.cache.get(user.id).roles.remove(emote.removedrole);
        if(emote.givenrole) client.guilds.cache.get(config.guildID).members.cache.get(user.id).roles.add(emote.givenrole);
    }
});
client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;
    let emote = await ROLES.findOne({ messageid: reaction.message.id, emote: reaction.emoji?.id ?? reaction.emoji.name })
    if (emote) {
        if(emote.removedrole) client.guilds.cache.get(config.guildID).members.cache.get(user.id).roles.add(emote.removedrole);
        if(emote.givenrole) client.guilds.cache.get(config.guildID).members.cache.get(user.id).roles.remove(emote.givenrole);
    }
});
client.login(config.token);