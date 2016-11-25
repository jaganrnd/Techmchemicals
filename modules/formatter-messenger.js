"use strict";

let formatAccounts = accounts => {
    let elements = [];
    accounts.forEach(account =>
        elements.push({
            title: account.get("Name"),
            subtitle: account.get("Description") ,
            "image_url": account.get("Picture_URL__c"),
            "buttons": [{
                    "type":"postback",
                    "title":"View",
                    "payload": "list_articletype," + account.getId() + "," + account.get("Name") + "," + account.get("Type")
                    }/*,{
                    "type": "web_url",
                    "url": "https://login.salesforce.com/" + account.getId(),
                    "title": "Open in Salesforce"
                    },*/
            ]
        })
    );
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};

let formatarticletitles = KnowledgeArticleVersions => {
    let elements = [];   
    KnowledgeArticleVersions.forEach(KnowledgeArticleVersion => {
     var obj = { 'PrevMenuSelection': KnowledgeArticleVersion.get("Id") };	
     var shouldSend = JSON.stringify(obj);
     console.log( 'After Stringify**' +  shouldSend );  
           elements.push({
                    "content_type":"text",
                    "title": KnowledgeArticleVersion.get("Title"),
                    //"payload":"Save_Order," + SelectedMenu[0].get("Product__c") + "," + SelectedMenu[0].get("Quantity__c") + "," + SelectedMenu[0].get("Price__c")		
                    "payload":shouldSend 		
                
           });
    });
    return {
        "text": "Please choose your related issue",    
         "quick_replies": elements
    };
};



let formatarticlesummary = KnowledgeArticleSummary => {
  
    KnowledgeArticleSummary.forEach(KnowledgeArticleVersion => { 
    
    return {
        "text": KnowledgeArticleVersion.get("Summary") 
    };
    });    
};

let formatOpportunities = opportunities => {
    let elements = [];
    opportunities.forEach(opportunity =>
        elements.push({
            title: opportunity.get("Name"),
            subtitle: opportunity.get("Account").Name + " · $" + opportunity.get("Amount"),
            "image_url": "https://s3-us-west-1.amazonaws.com/sfdc-demo/messenger/opportunity500x260.png",
            "buttons": [
                {
                    "type":"postback",
                    "title":"Close Won",
                    "payload": "close_won," + opportunity.getId() + "," + opportunity.get("Name")
                },
                {
                    "type":"postback",
                    "title":"Close Lost",
                    "payload": "close_lost," + opportunity.getId() + "," + opportunity.get("Name")
                },
                {
                    "type": "web_url",
                    "url": "https://login.salesforce.com/" + opportunity.getId(),
                    "title": "Open in Salesforce"
                }]
        })
    );
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};

exports.formatAccounts = formatAccounts;
exports.formatarticletitles = formatarticletitles;
exports.formatarticlesummary = formatarticlesummary;
exports.formatOpportunities = formatOpportunities;
