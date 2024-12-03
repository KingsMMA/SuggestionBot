# Suggestion Bot
###### A commission developed by KingsDev

![suggestion](https://github.com/user-attachments/assets/10c93913-8533-4133-816f-85a219254607)
###### To see more of my work, including more screenshots, go to https://kingrabbit.dev/

Suggestion Bot allows users to submit suggestions easily by typing in a text channel.  The bot then converts these into a neatly formatted embed with buttons to allow other community members to vote and a thread to discuss the suggestion in.  A ratelimit can be applied to the channel to prevent users spamming suggestions.  Staff members can accept/deny these suggestions with an optional reason using the `/suggestion` command.  To keep the suggestions channel clean, staff have the option of sending accepted and denied suggestions to their own channels; however, they can keep all suggestions in the on channel if they wish.  This preference can be set using the `/suggestion set-channel` command.

## Commands
`<>` required parameter  
`[]` optional parameter

### `/suggestion`
This is the command used to manage suggestions.
- #### `/suggestion set-channel <suggestions> <accepted> <denied>`
  This is used to set which channel should convert messages into suggestions.  The accepted and denied parameters are used to specify where suggestions should be sent after they have been accepted/denied - these can be set to the same value as the suggestions parameter to store all suggestions in the same channel.
- #### `/suggestion accept <message-url> [reason]`
  This command is used by staff members to accept a suggestion, optionally providing a reason to be added to the embed.
- #### `/suggestion deny <message-url> [reason]`
  This command is used by staff members to deny a suggestion, optionally providing a reason to be added to the embed.
- #### `/suggestion remove <message-url>`
  This command can be used to delete a suggestion without sending it anywhere - i.e., if a troll/spam suggestion is submitted, this can be used to remove it.
- #### `/suggestion list`
  This lists and links all active suggestions in order of highest net vote to least net vote.

## Running the bot
The bot is built using Node.js 20.  To run the bot, install the required dependencies with `npm i` and then run the bot with `npm run start`.  
The bot requires environment variables to be set (optionally through the creation of a `.env` file):
- `BOT_ID` - The bot's user ID
- `BOT_TOKEN` - The bot token
- `MONGO_URI` - The MongoDB URI the bot should connect to.  This database will be used to store the reaction roles.
