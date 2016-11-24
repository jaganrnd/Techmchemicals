"use strict";

let request = require('request'),
    salesforce = require('./salesforce'),
    formatter = require('./formatter-messenger');

let nforce = require('nforce'),

    SF_CLIENT_ID = process.env.SF_CLIENT_ID,
    SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET,
    SF_USER_NAME = process.env.SF_USER_NAME,
    SF_PASSWORD = process.env.SF_PASSWORD;

let org = nforce.createConnection({
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    mode: 'single',
    autoRefresh: true
});


let login = () => {
    org.authenticate({username: SF_USER_NAME, password: SF_PASSWORD}, err => {
        if (err) {
            console.error("Authentication error");
            console.error(err);
        } else {          
            console.log("Authentication successful" + org.oauth.access_token );
            //console.log(org.accessToken);
            //console.log(org.instanceUrl);
        }
    });
};


//SEARCH REST API - START
let getArticles = (incomingtext) => {	
  return new Promise((resolve, reject) => {   
	console.log("123*"+org.oauth.access_token);
        request({
            url: 'https://ap2.salesforce.com/services/data/v36.0/parameterizedSearch/?q%3Di+need+to+know+my+balance+%26sobject%3DKnowledgeArticleVersion+%26KnowledgeArticleVersion.fields%3DTitle%2CSummary+%26KnowledgeArticleVersion.where+publishstatus%3D%27online%27+and+language%3D%27en_US%27',
            
		Authorization : 'OAuth '+org.oauth.access_token,
	        method: 'GET',		
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
		console.log('Req body**' + request.body);    
                reject(error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
		console.log('Req body1**' + request.body);  
            } else {
                console.log(response.body);
                resolve(JSON.parse(response.body));
            }    
        });    
    });      
};
//SEARCH REST API = END


let findAccount = name => {
    return new Promise((resolve, reject) => {
        let q = "SELECT Id, Name,Description,BillingStreet, BillingCity, BillingState, Picture_URL__c, Phone FROM Account WHERE Type = 'Title Card' ";
        org.query({query: q}, (err, resp) => {
            if (err) {
                reject("An error as occurred");
            } else if (resp.records && resp.records.length>0) {
                let accounts = resp.records;
                resolve(accounts);
            }
        });
    });

};

let findContact = name => {

    return new Promise((resolve, reject) => {
        let q = "SELECT Id, Name, Title, Account.Name, Phone, MobilePhone, Email, Picture_URL__c FROM Contact WHERE Name LIKE '%" + name + "%' LIMIT 5";
        org.query({query: q}, (err, resp) => {
            if (err) {
                reject("An error as occurred");
            } else if (resp.records && resp.records.length>0) {
                let contacts = resp.records;
                resolve(contacts);
            }
        });
    });

};

let findContactsByAccount = accountId => {

    return new Promise((resolve, reject) => {
        let q = "SELECT Id, Name, Title, Account.Name, Phone, MobilePhone, Email, Picture_URL__c FROM Contact WHERE Account.Id = '" + accountId + "' LIMIT 5";
        org.query({query: q}, (err, resp) => {
            if (err) {
                reject("An error as occurred");
            } else if (resp.records && resp.records.length>0) {
                let contacts = resp.records;
                resolve(contacts);
            }
        });
    });

};

let getTopOpportunities = count => {

    count = count || 5;

    return new Promise((resolve, reject) => {
        let q = "SELECT Id, Name, Amount, Probability, StageName, CloseDate, Account.Name, Account.Picture_URL__c FROM Opportunity WHERE isClosed=false ORDER BY amount DESC LIMIT " + count;
        org.query({query: q}, (err, resp) => {
            if (err) {
                console.error(err);
                reject("An error as occurred");
            } else {
                resolve(resp.records);
            }
        });
    });

};

login();

exports.org = org;
exports.findAccount = findAccount;
exports.findContact = findContact;
exports.findContactsByAccount = findContactsByAccount;
exports.getTopOpportunities = getTopOpportunities;
exports.getArticles = getArticles;
