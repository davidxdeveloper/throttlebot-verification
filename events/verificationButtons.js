const { MessageEmbed, MessageActionRow, MessageButton, ButtonInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { obtainGuildProfile, defaultEmbedColor, obtainAllUserVehicles, obtainOneOpenUserApplication, obtainUserProfile } = require('../modules/database.js');
const garageSchema = require('../mongodb_schema/garageSchema.js');
const verificationSchema = require('../mongodb_schema/verificationApplicationSchema.js');
const userProfileSchema = require('../mongodb_schema/userProfileSchema.js');
const { botIcon, greenIndicator, redIndicator, greenColor, redColor, errorEmbed, removeNonIntegers, isValidHttpUrl, embedColor } = require('../modules/utility.js');
const wait = require('node:timers/promises').setTimeout;
const moment = require('moment');
const mongoose = require('mongoose');
let cooldownStatus = false;

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
        if (!interaction.isButton()) return;
        const bulkId = interaction.customId;
        const ids = bulkId.split('+')
        const buttonId = ids[0]
        const buttonUserId = ids[1]
        if(['confirmApplication','denyApplication','denyReadGuide'].includes(buttonId)){
           await interaction.deferUpdate();
           //Guild information
            const guildId = interaction.guild.id;
            const guildName = interaction.guild.name;
            const guildIcon = interaction.guild.iconURL({ dynamic: true });
            //Guild Profile
            const guildProfile = await obtainGuildProfile(guildId);
            if(!guildProfile){
                await interaction.followUp({
                    embeds: [errorEmbed('Server profile not setup, please kick the bot and invite it again.', initiatorAvatar)]
                });
                return;
            };
            const verificationChannelId = guildProfile.verificationChannelId;
            const guideChannelId = guildProfile.guideChannelId;
            const loggingChannelId = guildProfile.loggingChannelId;
            const syncEnabled = guildProfile.syncEnabled;
            const syncedGuildId = guildProfile.syncedGuildId;
            const syncedGuildData = interaction.client.guilds.cache.get(syncedGuildId);
            const roleToGive = guildProfile.verifiedVehicleRoleId;
            const footerIcon = guildProfile.customFooterIcon || guildIcon;
            const footerText = `${guildName} • Vehicle Verification`
            //Defining the initiating user details.
            const initiatorId = interaction.user.id;
            const initiatorUsername = interaction.user.username;
            const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
            const initiatorTag = interaction.user.tag
            //Verificaton application embed
            const vApplicationEmbed = interaction.message.embeds[0]
            const applicantId = buttonUserId
            const vehicleName = vApplicationEmbed.fields[0].value;
            const applicationData = await obtainOneOpenUserApplication(applicantId, guildId, vehicleName);
            if(!applicationData){
                await interaction.followUp({
                    embeds: [errorEmbed('The verification application could not be found.', initiatorAvatar)]
                });
                return;
            };
            //Verification application details.
            const vehicleImageURL = applicationData.vehicleImageURL;
            const vehicleImageProxyURL = applicationData.vehicleImageProxyURL
            //Applicant Details
            const userProfile = await obtainUserProfile(applicantId);
            const applicantData = await interaction.member.guild.members.fetch(applicantId).catch(async e => {
                //Since the member cannot be found, deny the application.
                const denialReason = `User left/banned. Unable to fetch data.`

                await verificationSchema.updateOne({userId: applicantId, vehicle: vehicleName, status: 'open'}, {$set: { status: 'closed', decision: `denied | ${denialReason}`, decidedBy: initiatorId, decidedOn: todaysDate }})
                .catch(async err => {
                    await interaction.followUp({
                        embeds: [errorEmbed(`Failed to update application information. - ${err}`, initiatorAvatar)]
                    })
                    return;
                });

                vApplicationEmbed.fields[3].value = `Verification Denied | Reason: ${denialReason}`;
                vApplicationEmbed.color = redColor
                vApplicationEmbed.addField('Decided By', `${initiatorTag} | <@${initiatorId}>`);
                
                const denideButton = new MessageButton()
                .setCustomId('disabled')
                .setLabel('Denied - Read The Guide')
                .setStyle('DANGER')
                .setDisabled(true);
                const row = new MessageActionRow()
                .addComponents(denideButton)
                await interaction.editReply({
                    embeds: [vApplicationEmbed],
                    components: [row]
                });

                const logEmbed = new MessageEmbed()
                .setAuthor({
                    name: 'Vehicle Verification Processed',
                    iconURL: applicantAvatar
                })
                .addField('Vehicle', vehicleName, true)
                .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                .addField('Decision',`Denied Verification | Reason: ${denialReason}`)
                .addField('Decided By', `${initiatorTag} | <@${initiatorId}>`)
                .setThumbnail(vehicleImageURL)
                .setColor(redColor)
                .setFooter({
                    text: footerText,   
                    iconURL: footerIcon
                });

                logChannel.send({
                    embeds: [logEmbed],
                    components: []
                });

                
                await interaction.followUp({
                    embeds: [errorEmbed(`Failed to obtain the applicant details\nThey may have left the server.\n\nThe verification application has been denied automatically.`, initiatorAvatar)],
                });
                return;
            })
            const applicantAvatar = applicantData.user.displayAvatarURL({ dynamic: true });
            const applicantTag = applicantData.user.tag;
            //Misc
            const verificationChannel = await interaction.member.guild.channels.fetch(verificationChannelId);
            if(!verificationChannel){
                await interaction.editReply({
                    embeds: [errorEmbed(`Failed to obtain the verification channel where the applications will be sent.\nPlease ask the staff to make sure the verification channel is setup properly.`, initiatorAvatar)],
                });
                return;
            };
            const logChannel = await interaction.member.guild.channels.fetch(loggingChannelId);
            if(!logChannel){
                await interaction.editReply({
                    embeds: [errorEmbed(`Failed to obtain the log channel where the logs are sent.\nPlease ask the staff to make sure the log channel is setup properly.`, initiatorAvatar)],
                });
                return;
            };
            const todaysDate = moment.utc();
            switch(buttonId){
                case 'approveApplication':
                    async function approveApplication(){
                        await verificationSchema.updateOne({userId: applicantId, vehicle: vehicleName, status: 'open'}, {$set: { status: 'closed', decision: 'approved', decidedBy: initiatorId, decidedOn: todaysDate }})
                        .catch(async err => {
                            await interaction.followUp({
                                embeds: [errorEmbed(`Failed to update application information. - ${err}`, initiatorAvatar)]
                            })
                            return;
                        });

                        const newVerifiedRide = new garageSchema({
                            _id: mongoose.Types.ObjectId(),
                            guildId: guildId,
                            userId: applicantId,
                            vehicle: vehicleName,
                            vehicleImages: [],
                            vehicleDescription: null,
                            vehicleAddedDate: todaysDate,
                            verificationImageLink: vehicleImageProxyURL,
                            embedColor: null,
                        })
                        await newVerifiedRide.save()
                        .catch(async err => {
                            await interaction.followUp({
                                embeds: [errorEmbed(`Failed to create the new verified ride. - ${err}`, initiatorAvatar)]
                            })
                            return;
                        });

                        if(!userProfile){
                            //Creating the user profile for the new verified vehicle owner.
                            const newUserProfile = new userProfileSchema({
                                _id: mongoose.Types.ObjectId(),
                                userId: applicantId,
                                premiumUser: false,
                                premiumTier: 0,
                                embedColor: '',
                                garageThumbnail: ''
                            });
                            await newUserProfile.save()
                            .catch(async err => {
                                console.log(err);
                            });
                        };

                        vApplicationEmbed.fields[3].value = 'Verified Successfully';
                        vApplicationEmbed.color = greenColor
                        vApplicationEmbed.addField('Decided By', `${initiatorTag} | <@${initiatorId}>`);
                        
                        const confirmedButton = new MessageButton()
                        .setCustomId('disabled')
                        .setLabel('Approved')
                        .setStyle('SUCCESS')
                        .setDisabled(true);
                        const row = new MessageActionRow()
                        .addComponents(confirmedButton)
                        await interaction.editReply({
                            embeds: [vApplicationEmbed],
                            components: [row]
                        });

                        //Giving the verified vehicles role if configured.
                        if(roleToGive){
                            await interaction.member.roles.add(roleToGive)
                            .catch(async err => {
                                await interaction.followUp({
                                    embeds: [errorEmbed(`I was unable to give the <@&${roleToGive}> to ${applicantTag}. - ${err}`, initiatorAvatar)]
                                });
                            });
                        };

                        //Dm notification to the applicant.
                        const dmNotification = new MessageEmbed()
                        .setAuthor({
                            name: 'Vehicle Verification Processed',
                            iconURL: applicantAvatar
                        })
                        .setDescription("Your vehicle verification application has been successfully processed. You can find the details down below.")
                        .addField('Vehicle', vehicleName, true)
                        .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                        .addField('Decision','Approved Verification | You can check out your vehicle in your garage now using the `/garage` command.')
                        .addField('Note','You can now keep images to your rides, configure your garage using the `/settings` command.')
                        .setThumbnail(vehicleImageURL)
                        .setColor(greenColor)
                        .setFooter({
                            text: footerText,
                            iconURL: footerIcon
                        });
                        applicantData.send({
                            embeds:[dmNotification],
                            components: []
                        })
                        .catch(async err => {
                            //if the dms are disabled.
                            await interaction.followUp({
                                embeds: [errorEmbed(`I was unable to notify ${applicantTag} via DMs - ${err}`, initiatorAvatar)]
                            });
                        });

                        //Log it
                        const logEmbed = new MessageEmbed()
                        .setAuthor({
                            name: 'Vehicle Verification Processed',
                            iconURL: applicantAvatar
                        })
                        .addField('Vehicle', vehicleName, true)
                        .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                        .addField('Decision','Approved Verification')
                        .addField('Decided By', `${initiatorTag} | <@${initiatorId}>`)
                        .setThumbnail(vehicleImageURL)
                        .setColor(greenColor)
                        .setFooter({
                            text: footerText,   
                            iconURL: footerIcon
                        });

                        logChannel.send({
                            embeds: [logEmbed],
                            components: []
                        });

                        await interaction.followUp({
                            content: `Verification carried out successfully on **${vehicleName}**`,
                            ephemeral: true
                        });
                    };
                    approveApplication();
                    break
                case 'denyApplication':
                    async function denyApplication(){

                        if(cooldownStatus){
                            await interaction.followUp({
                                content: 'The deny button is currently being used by another user.',
                                ephemeral: true
                            });
                            return;
                        };
                        cooldownStatus = true;

                        await interaction.followUp({
                            content: `What is the reason for denial for **${vehicleName}?**`,
                            ephemeral: true
                        });

                        const msg_filter = (m) => m.author.id === initiatorId;
                        const collected = await interaction.channel.awaitMessages({ filter: msg_filter, max: 1, time: 60000 })
                        if(!collected.first()){
                            cooldownStatus = false;
                            await interaction.followUp({
                                content: 'No reason for denial was provided, ending operation.',
                                ephemeral: true
                            });
                            return;
                        };
                        cooldownStatus = false;
                        const denialReason = collected.first().content;
                        collected.first().delete();

                        await verificationSchema.updateOne({userId: applicantId, vehicle: vehicleName, status: 'open'}, {$set: { status: 'closed', decision: `denied | ${denialReason}`, decidedBy: initiatorId, decidedOn: todaysDate }})
                        .catch(async err => {
                            await interaction.followUp({
                                embeds: [errorEmbed(`Failed to update application information. - ${err}`, initiatorAvatar)]
                            })
                            return;
                        });

                        vApplicationEmbed.fields[3].value = `Verification Denied | Reason: ${denialReason}`;
                        vApplicationEmbed.color = redColor
                        vApplicationEmbed.addField('Decided By', `${initiatorTag} | <@${initiatorId}>`);
                        
                        const denideButton = new MessageButton()
                        .setCustomId('disabled')
                        .setLabel('Denied')
                        .setStyle('DANGER')
                        .setDisabled(true);
                        const row = new MessageActionRow()
                        .addComponents(denideButton)
                        await interaction.editReply({
                            embeds: [vApplicationEmbed],
                            components: [row]
                        });

                        //Dm notification to the applicant.
                        const dmNotification = new MessageEmbed()
                        .setAuthor({
                            name: 'Vehicle Verification Processed',
                            iconURL: applicantAvatar
                        })
                        .setDescription("Your vehicle verification application has been successfully processed. You can find the details down below.")
                        .addField('Vehicle', vehicleName, true)
                        .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                        .addField('Decision',`Denied Verification | Reason: ${denialReason}`)
                        .setThumbnail(vehicleImageURL)
                        .setColor(redColor)
                        .setFooter({
                            text: footerText,
                            iconURL: footerIcon
                        });
                        applicantData.send({
                            embeds:[dmNotification],
                            components: []
                        })
                        .catch(async err => {
                            //if the dms are disabled.
                            await interaction.followUp({
                                embeds: [errorEmbed(`I was unable to notify ${applicantTag} via DMs - ${err}`, initiatorAvatar)]
                            });
                        });
                        
                         //Log it
                         const logEmbed = new MessageEmbed()
                         .setAuthor({
                             name: 'Vehicle Verification Processed',
                             iconURL: applicantAvatar
                         })
                         .addField('Vehicle', vehicleName, true)
                         .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                         .addField('Decision',`Denied Verification | Reason: ${denialReason}`)
                         .addField('Decided By', `${initiatorTag} | <@${initiatorId}>`)
                         .setThumbnail(vehicleImageURL)
                         .setColor(redColor)
                         .setFooter({
                             text: footerText,   
                             iconURL: footerIcon
                         });
 
                         logChannel.send({
                             embeds: [logEmbed],
                             components: []
                         })
                         .catch(async err => {
                            //if the dms are disabled.
                            await interaction.followUp({
                                embeds: [errorEmbed(`I was unable to log the verification for **${vehicleName}** via DMs - ${err}`, initiatorAvatar)]
                            });
                        });

                        await interaction.followUp({
                            content: `Denied the verification application for **${vehicleName}** successfully.`,
                            ephemeral: true
                        });

                    };
                    denyApplication();
                    break
                case 'denyReadGuide':
                    async function denyReadGuide(){
                        const denialReason = `Please follow the procedures as listed in the channel <#${guideChannelId}>\nApply for verification again after making sure you have met all the requirements!`

                        await verificationSchema.updateOne({userId: applicantId, vehicle: vehicleName, status: 'open'}, {$set: { status: 'closed', decision: `denied | ${denialReason}`, decidedBy: initiatorId, decidedOn: todaysDate }})
                        .catch(async err => {
                            await interaction.followUp({
                                embeds: [errorEmbed(`Failed to update application information. - ${err}`, initiatorAvatar)]
                            })
                            return;
                        });

                        vApplicationEmbed.fields[3].value = `Verification Denied | Reason: ${denialReason}`;
                        vApplicationEmbed.color = redColor
                        vApplicationEmbed.addField('Decided By', `${initiatorTag} | <@${initiatorId}>`);
                        
                        const denideButton = new MessageButton()
                        .setCustomId('disabled')
                        .setLabel('Denied - Read The Guide')
                        .setStyle('DANGER')
                        .setDisabled(true);
                        const row = new MessageActionRow()
                        .addComponents(denideButton)
                        await interaction.editReply({
                            embeds: [vApplicationEmbed],
                            components: [row]
                        });

                        //Dm notification to the applicant.
                        const dmNotification = new MessageEmbed()
                        .setAuthor({
                            name: 'Vehicle Verification Processed',
                            iconURL: applicantAvatar
                        })
                        .setDescription("Your vehicle verification application has been successfully processed. You can find the details down below.")
                        .addField('Vehicle', vehicleName, true)
                        .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                        .addField('Decision',`Denied Verification | Reason: ${denialReason}`)
                        .setThumbnail(vehicleImageURL)
                        .setColor(redColor)
                        .setFooter({
                            text: footerText,
                            iconURL: footerIcon
                        });
                        applicantData.send({
                            embeds:[dmNotification],
                            components: []
                        })
                        .catch(async err => {
                            //if the dms are disabled.
                            await interaction.followUp({
                                embeds: [errorEmbed(`I was unable to notify ${applicantTag} via DMs - ${err}`, initiatorAvatar)]
                            });
                        });
                        
                         //Log it
                         const logEmbed = new MessageEmbed()
                         .setAuthor({
                             name: 'Vehicle Verification Processed',
                             iconURL: applicantAvatar
                         })
                         .addField('Vehicle', vehicleName, true)
                         .addField('Owner', `${applicantTag} | <@${applicantId}>`,true)
                         .addField('Decision',`Denied Verification | Reason: ${denialReason}`)
                         .addField('Decided By', `${initiatorTag} | <@${initiatorId}>`)
                         .setThumbnail(vehicleImageURL)
                         .setColor(redColor)
                         .setFooter({
                             text: footerText,   
                             iconURL: footerIcon
                         });
 
                        logChannel.send({
                            embeds: [logEmbed],
                            components: []
                        }).catch(async err => {
                            //if the dms are disabled.
                            await interaction.followUp({
                                embeds: [errorEmbed(`I was unable to log the verification for **${vehicleName}** via DMs - ${err}`, initiatorAvatar)]
                            });
                        });

                        await interaction.followUp({
                            content: `Denied the verification application for **${vehicleName}** successfully.`,
                            ephemeral: true
                        });
                    };
                    denyReadGuide();
                    break
            };

        };
    }
};