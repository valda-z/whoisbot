/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
const cheerio = require('cheerio');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
 * Bot Storage: This is a great spot to register the private state storage for your bot. 
 * We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
 * For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
 * ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function(session) {
    if (session.message.text.indexOf(".") !== -1) {
        var srvname = session.message.text;
        srvname = srvname.replace("https://", "");
        srvname = srvname.replace("http://", "");
        srvname = srvname.split("/")[0];
        session.send("Searching for: %s", srvname);

        https.get("https://www.iplocation.net/who-is-hosting-website?domain=" + srvname, function(res) {
            var body = '';
            var webhost = '';
            var iploc = '';
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                console.log(body);
                $ = cheerio.load(body);
                $('table.iptable tbody tr').each(function(i, row) {
                    var myrow = $(row).text();
                    if (myrow.startsWith("Web Host")) {
                        webhost = myrow.replace("Web Host", "");
                    }
                    if (myrow.startsWith("IP Location")) {
                        iploc = myrow.replace("IP Location", "");
                    }
                });
                if (webhost == '') {
                    session.send("**" + srvname + "** - Not found.");
                } else {
                    session.send("**" + srvname + "** - Web Hoster: **" + webhost + "**, IP Location: **" + iploc + "**");
                }
            });
        }).on('error', function(e) {
            session.send("Error during processing your request.");
        });

    } else {
        session.send("Hi, I am whois chatbot, I can coolect information about your website (like who is host provider). You can enter site name for example asos.uk or aevi.com.");
    }
});