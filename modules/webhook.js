"use strict";

let request = require('request'),
    salesforce = require('./salesforce'),
    formatter = require('./formatter-messenger');

let sendMessage = (message, recipient) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.FB_PAGE_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipient},
            message: message
        }
    }, (error, response) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};



let getUserInfo = (userId) => {
  
  return new Promise((resolve, reject) => {       
    
        request({
            url: `https://graph.facebook.com/v2.6/${userId}`,
            qs: {fields:"first_name,last_name,profile_pic", access_token: process.env.FB_PAGE_TOKEN},
            method: 'GET',
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
                reject(error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            } else {
                console.log(response.body);
                resolve(JSON.parse(response.body));
            }    
        });
    
    });  
    
};

let processText = (text, sender)  => {
    let match;
    match = text.match(/help/i);
    if (match) {
        getUserInfo(sender).then(response => { 
            
	    sendMessage({attachment:{
                            "type": "image",
                            "payload": {                                
                                "url":"https://www.chevron.com/-/media/chevron/shared/images/chevron-hallmark-facebook.jpg"                                
                            }
                        }
            }, sender);
		
            sendMessage({text:
                `Hey ${response.first_name} ! Welcome to Chevron Support Center..
                 How can i help you today ?                 
            `}, sender);
		
            salesforce.findAccount(match[1]).then(accounts => {
                sendMessage({text: `Please find below the topics for which i can provide solutions:`}, sender);
                sendMessage(formatter.formatAccounts(accounts), sender)
            });
            
        });         
        return;
    }

    match = text.match(/search account (.*)/i);
    if (match) {
        salesforce.findAccount(match[1]).then(accounts => {
            sendMessage({text: `Here are the accounts I found matching "${match[1]}":`}, sender);
            sendMessage(formatter.formatAccounts(accounts), sender)
        });
        return;
    }

    match = text.match(/search (.*) in accounts/i);
    if (match) {
        salesforce.findAccount(match[1]).then(accounts => {
            sendMessage({text: `Here are the accounts I found matching "${match[1]}":`}, sender);
            sendMessage(formatter.formatAccounts(accounts), sender)
        });
        return;
    }

    match = text.match(/search contact (.*)/i);
    if (match) {
        salesforce.findContact(match[1]).then(contacts => {
            sendMessage({text: `Here are the contacts I found matching "${match[1]}":`}, sender);
            sendMessage(formatter.formatContacts(contacts), sender)
        });
        return;
    }

    match = text.match(/top (.*) opportunities/i);
    if (match) {
        salesforce.getTopOpportunities(match[1]).then(opportunities => {
            sendMessage({text: `Here are your top ${match[1]} opportunities:`}, sender);
            sendMessage(formatter.formatOpportunities(opportunities), sender)
        });
        return;
    }
};

let handleGet = (req, res) => {
    if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
};

let handlePost = (req, res) => {
    let events = req.body.entry[0].messaging;
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        let sender = event.sender.id;
        if (process.env.MAINTENANCE_MODE && ((event.message && event.message.text) || event.postback)) {
            sendMessage({text: `Sorry I'm taking a break right now.`}, sender);
        } else if (event.message && event.message.text) {
            processText(event.message.text, sender);
            
           //var incomingtext = event.message.text;		

	   if (event.message.quick_reply){	
		   
		console.log('inside q r payload**');
		var quickpayload1 =JSON.parse(event.message.quick_reply.payload);    
		console.log('Quick Replies payload KEY PARSING12**' + quickpayload1.PrevMenuSelection);		   
		   
		var prevProduct = quickpayload1.PrevMenuSelection;
		console.log('Quick Reply Payload PRODUCTID**' + prevProduct); 
		
		//Based on title ,display corresponding summary..   
		salesforce.findParticularArticleSummary(prevProduct).then(KnowledgeArticleSummary => {    
                            sendMessage(formatter.formatarticlesummary(KnowledgeArticleSummary), sender);  
                }); 
		   
	   }			                          
            
        }else if (event.postback) {
            let payload = event.postback.payload.split(",");
            if (payload[0] === "list_articletype") {
		    
                sendMessage({text: "Ok, lisiting down list of solutions related to <- " + payload[2] + "->"}, sender);
		    
		console.log('payload[2]**' + payload[2]);    
	
		    
                salesforce.findArticlesByType(payload[2]).then(KnowledgeArticleVersions => 
			sendMessage(formatter.formatarticletitles(KnowledgeArticleVersions), sender)
		);
		    
            } else if (payload[0] === "close_won") {
                sendMessage({text: `OK, I closed the opportunity "${payload[2]}" as "Close Won". Way to go Christophe!`}, sender);
            } else if (payload[0] === "close_lost") {
                sendMessage({text: `I'm sorry to hear that. I closed the opportunity "${payload[2]}" as "Close Lost".`}, sender);
            }
        }
    }
    res.sendStatus(200);
};

exports.handleGet = handleGet;
exports.handlePost = handlePost;
exports.getUserInfo = getUserInfo;
