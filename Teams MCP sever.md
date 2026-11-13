https://github.com/adkins-amdg/teams-mcp-server

到目前为止，我说明一下我做了哪些事情，你需要帮我梳理我做的事情以及我不理解的部分的原因。
我用vscode，使用Microsoft 365 agent Toolkit创建了一个声明式代理，目前可以在copilot 中看到这个agent。
然后我想找一个可以实现预约Teams 会议功能的MCP（我并不理解为什么要用MCP，它是什么，和声明式代理中的

原始ai-plugin.json文件：
```json
{
    "$schema": "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json",
    "schema_version": "v2.4",
    "name_for_human": "My agent${{APP_NAME_SUFFIX}}",
    "description_for_human": "Action powered by MCP server",
    "contact_email": "publisher-email@example.com",
    "namespace": "localhost3",
    "functions": [],
    "runtimes": [
        {
            "type": "RemoteMCPServer",
            "spec": {
                "url": "https://localhost:3000/mcp"
            },
            "run_for_functions": [
                "*"
            ],
            "auth": {
                "type": "None"
            }
        }
    ]
}
```


Microsoft Graph (15)
Calendars.ReadWrite
Delegated
Have full access to user calendars
No
 Granted for Bamboo Technologies Limited
Channel.Create
Delegated
Create channels
Yes
 Granted for Bamboo Technologies Limited
Channel.ReadBasic.All
Delegated
Read the names and descriptions of channels
No
 Granted for Bamboo Technologies Limited
ChannelMessage.Read.All
Delegated
Read user channel messages
Yes
 Granted for Bamboo Technologies Limited
ChannelMessage.Send
Delegated
Send channel messages
No
 Granted for Bamboo Technologies Limited
Chat.ReadWrite
Delegated
Read and write user chat messages
No
 Granted for Bamboo Technologies Limited
Files.Read.All
Delegated
Read all files that user can access
No
 Granted for Bamboo Technologies Limited
offline_access
Delegated
Maintain access to data you have given it access to
No
 Granted for Bamboo Technologies Limited
OnlineMeetings.ReadWrite
Delegated
Read and create user's online meetings
No
 Granted for Bamboo Technologies Limited
Sites.Read.All
Delegated
Read items in all site collections
No
 Granted for Bamboo Technologies Limited
Team.ReadBasic.All
Delegated
Read the names and descriptions of teams
No
 Granted for Bamboo Technologies Limited
TeamMember.Read.All
Delegated
Read the members of teams
Yes
 Granted for Bamboo Technologies Limited
TeamSettings.Read.All
Delegated
Read teams' settings
Yes
 Granted for Bamboo Technologies Limited
TeamSettings.ReadWrite.All
Delegated
Read and change teams' settings
Yes
 Granted for Bamboo Technologies Limited
User.Read
Delegated
Sign in and read user profile
No