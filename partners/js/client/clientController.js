(function(){
    'use strict';

    angular
        .module('partner')
        .controller('ClientController', ClientController);

    function ClientController($rootScope, $scope, $firebaseAuth, userService, $state, $firebaseArray){
                
        //Set initial information
        var vm = this;
        var ref = new Firebase($rootScope.fbUrl);
        
        //Get current User's ID to find organization's information
        var orgRef = ref.child('organizations').child($rootScope.currentUser.profile.key);       
        var clientRef = orgRef.child("clients");
        
        //Output current Users information
        console.log($rootScope.currentUser);
        
        //Check current authorization status
        vm.authObj = $firebaseAuth(ref);
         
        //Load clients that have been saved from Firebase
        $scope.clients = $firebaseArray(orgRef.child('clients'));

        // Initialize functions within this folder
        vm.saveClient = saveClient;
        vm.logOut = logOut;
        vm.initDummyData = initDummyData;
        vm.addRecordItem = addRecordItem;
        vm.checkEligibility = checkEligibility;
        vm.findDConvictions = findDConvictions;
        vm.findConvictionDate = findConvictionDate;
        
        vm.initDummyData();

        //Function saveClient - Save client form information as a new item
        function saveClient(newClient){
             
            //TESTING: Output information related to client
            console.log("about to save client ");
            console.log(newClient);
            
            //Checks to see if any records have been added for the current client 
            if($scope.records)
                newClient.records = $scope.records;
            else
                newClient.records = [];
               
            //Ensure each object has a valid value   
              if(newClient.determination === undefined)
                newClient.determination = "N/A";
               if(newClient.clientID === undefined)
                newClient.clientID = "N/A";
               if(newClient.status === undefined)
                newClient.status = "N/A";
               
                
            //Create new firebase reference for the client
            var newclientRef = clientRef.push();
            var today = new Date();
            newclientRef.set({
                clientID: newClient.clientID,
                determination: newClient.determination,
                status: newClient.status
            });
            
            //Save each item in record 
            var recordRef = ref.child('recordItems');
            angular.forEach(newClient.records, function(recordItem) {
              
                //Get whether the item is on list of eligible or ineligible items
                if(recordItem.itemType == 'Felony')
                    recordItem.eligibilityStatus = recordItem.FelonyType;
                else 
                    recordItem.eligibilityStatus = recordItem.MisdemeanorType;

                //Ensure all fields have values before save
                if(recordItem.papered === undefined)
                    recordItem.papered = "N/A";


                //Create new firebase reference for the item on a clients record
                var newRecordItemRef =  recordRef.push();
                
                //Add information to new item in firebase             
                newRecordItemRef.set({
                    clientID: newClient.clientID,
                    organizationID: $rootScope.currentUser.profile.key,
                    itemType: recordItem.itemType,
                    itemEligibilityStatus: recordItem.eligibilityStatus,
                    convictionStatus: recordItem.convictionStatus,
                    dateOffPapers: recordItem.fullDate,
                    sealingEligibility: recordItem.eligibility,
                    itemPapered: recordItem.papered
                });
            });
            
            
            
        };
        
        //Function logOut - Remove firebase login token and logout 
        function logOut(){
            console.log(vm.authObj);
               vm.authObj.$logout();
        };
        
        //Function initDummyData - Load basic information for a test person.
        function initDummyData(){
            //Initialize form with basic data for person
                $scope.person = {};
                $scope.person.first = "John";
                $scope.person.middle = "Jay";
                $scope.person.last = "Smith";
                $scope.person.phone = "2022225555";
                $scope.person.email = "test@email.com";
                $scope.person.address1 = "1600 pennsylvania ave NW";
                $scope.person.address2 = "Washington, DC, 20002";
                $scope.person.dobMonth = "10";
                $scope.person.dobDay = "05";
                $scope.person.dobYear = "2015";
                $scope.person.pendingCase = false;    //Client level fields since it relates to every charge
                $scope.records = []; // Initialize list of items on record
                $scope.convictions = []; //Will store convictions only, this is because condivctions may make waiting period longer
                $scope.hasMDQconvictions = false; //Will store whether person has a disqualifying misdemeanor.
        };
        
        //Function addRecordItem - add a new item to criminal record then check eligibility for all items.
        function addRecordItem(){
            //This function will add a new item to criminal record then check eligibility

                //Ensure new row is not expanded
                $scope.newRecord.expanded = false;
            
                //Check to see if disposition date is fully set
                if(!($scope.newRecord.dispDate.month == null) && !($scope.newRecord.dispDate.day == null) && !($scope.newRecord.dispDate.year == null))
                {   
                    $scope.newRecord.dispDate.full = $scope.newRecord.dispDate.month + "/" + $scope.newRecord.dispDate.day + "/" + $scope.newRecord.dispDate.year;
                    //Set FullDate as combined itsems
                    $scope.newRecord.fullDate = new Date($scope.newRecord.dispDate.full);
                }
                
                //Create new conviction_record based          
                if($scope.newRecord.convictionStatus === 'Conviction')
                {
                    //Create new conviction_record based 
                    var newConviction = {};
                    newConviction.itemType = $scope.newRecord.itemType;
                    newConviction.convictionStatus = $scope.newRecord.convictionStatus;
                    newConviction.offDate = $scope.newRecord.dispDate;
                    newConviction.eligibilityDate = $scope.newRecord.dispDate;
                    
                    //Determine which kind of conviction this is. Misdemeanor vs Felony 
                    if($scope.newRecord.itemType === 'Felony' && $scope.newRecord.felonyType === 'Ineligible')
                    {
                        //Set the the eligibility date for 10 years after this case was resolved.
                        newConviction.eligibilityDate.year = (parseInt($scope.newRecord.dispDate.year) + 10).toString();
                        
                        //Information scope that Disqualifying Convictions are present. 
                        $scope.hasMDQconvictions = true;
                    }
                    else if($scope.newRecord.itemType === 'Misdemeanor')
                    {
                        //Set the the eligibility date for 5 years after this case was resolved.
                        newConviction.eligibilityDate.year = (parseInt($scope.newRecord.dispDate.year) + 5).toString();
                    
                        //Information scope that Disqualifying Convictions are present. 
                        if($scope.newRecord.MisdemeanorType === 'Ineligible')
                            $scope.hasMDQconvictions = true;
                    }
                    
                    //TESTING: output new conviction before saving to allow verificated
                    console.log(newConviction);
                    
                    //Add current conviction to convictions list
                    $scope.convictions.push(newConviction);
                }
            
                //Add current item to list of items on screen.
                $scope.records.push($scope.newRecord);
                
                //Run eligibility Check
                this.checkEligibility();
                
                console.log($scope.newRecord);
                
                $scope.newRecord = {};
        };
        
        function findDConvictions(){
        //This function will search the convictions array looking for a disquailifying convictions for 16-803c2
            var disqualified = false;

            //Go through all items on the criminal record convictions list to determine if convictions may disqualify the item.  
            angular.forEach($scope.convictions, function(item)
                {
                    //Compare each item with the giving issues
                    if(parseInt(item.offDate.year) > parseInt(startDate.year))
                        disqualified = true;  
                    else if(parseInt(item.offDate.year) === parseInt(startDate.year) 
                            && parseInt(item.offDate.month) > parseInt(startDate.month))
                        disqualified = true;  
                });
                
                return disqualified;
    
        };
        
        function findConvictionsAfterDate(checkDate){
        //This function will search the convictions array looking for any convictions occuring after the checkDate parameter
            var subsequent = false;

            //Go through all items on the criminal record convictions list to determine if convictions may disqualify the item.  
            angular.forEach($scope.convictions, function(item)
                {
                    //Compare each item with the input date. If date is before, then this is a subsequent conviction
                    if(parseInt(item.offDate.year) > parseInt(checkDate.year))
                        subsequent = true;  
                    else if(parseInt(item.offDate.year) === parseInt(checkDate.year) 
                            && parseInt(item.offDate.month) > parseInt(checkDate.month))
                        subsequent = true;  
                });
                
                //Return result of true or false
                return subsequent;    
        };
        
        function findConvictionDate() {
        //This function will search the convictions array looking for the most recent expiration date
            var expirationDate = {};

            //Go through all items on the criminal record convictions list to determine if convictions may disqualify the item.  
            angular.forEach($scope.convictions, function(item)
            {
                
                if(expirationDate === {}) //use current item's eligibilty date to get current Eligibility Date. 
                {                    
                    expirationDate = item.eligibilityDate;
                }
                else if(parseInt(expirationDate.year) > parseInt(item.eligibilityDate.year)) //Compare current item's eligibilty date to get current Eligibility Date.
                {
                    expirationDate = item.eligibilityDate;
                }
                else if(parseInt(expirationDate.year) === parseInt(item.eligibilityDate.year) //Compare current item's eligibilty date to get current Eligibility Date if they match
                && parseInt(expirationDate.month) < parseInt(item.eligibilityDate.year))
                {
                    expirationDate = item.eligibilityDate;
                }
            });

            //Save date for current item
            return expirationDate;
        };
        
        function checkEligibility() {
        //This function will determine eligibility for all items added to the record for this client
    
            //This variable will hold the earliest date for eligibility sealing
            var convictionEligibilityDate = {}; 
            
            //Find the earliest year(date) based on convictions if necessary
            if($scope.convictions.length > 0);
                convictionEligibilityDate = this.findConvictionDate();
            
            //Go through each item in the records list and determine its eligibility
            angular.forEach($scope.records, function(item)
            {
                //set eligibilityDate as current item's disposition Date
                var eligibilityDate = item.dispDate;
                var eligibilityYear = parseInt(item.dispDate.year);
                /* angular.copy(item.dispDate, eligibilityDate); 
                */
                
                //Set default fields for record checker`
                item.eligibility = '';
                item.justifications = [];
                        
                //Pending Cases automatically prevent any items from having eligibilty 
                if($scope.person.pendingCase === true)
                {
                    //Update eligibility results
                    item.eligibility = 'Ineligible - Due to Pending Case';
                    eligibilityYear = 0;
                    
                    //Create justification item to explain why it is ineligible 
                    var newJustifications = {};
                    newJustifications.explanation = "Your pending case must be completed before you can seal.";
                    newJustifications.lawCode = "16-801(5)(B)";
                    newJustifications.exception = "N/A";
                    
                    //Add justifications to current justifications list for this item.
                    item.justifications.push(newJustifications);
                }
                
                if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Felony' &&  item.FelonyType === 'Ineligible')
                {
                    //Update eligibility results
                    item.eligibility = 'Ineligible - Felony Conviction';
                    eligibilityYear = 0;
                    
                    //Create justification item to explain why it is ineligible 
                    var newJustifications = {};
                    newJustifications.explanation = "Ineligible Felonies are never eligible unless Bail Reform Act.";
                    newJustifications.lawCode = "N/A";
                    newJustifications.exception = "N/A";
                    
                    //Add justifications to current justifications list for this item.
                    item.justifications.push(newJustifications);
            
                }
                else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Felony')
                {
                    //Eligibility checker for Non-Conviction Felonies                    
                    if(item.papered === 'No') //Eligibility for "No Papered"
                    {
                        //Set earliest eligibility date: 3 years later 
                        eligibilityYear = (parseInt(item.dispDate.year) + 3);
 
                        //Create justification item to explain why it is eligible 
                        var newJustifications = {};
                        newJustifications.explanation = "You can seal this crime three years since off papers";
                        newJustifications.lawCode = "16-803(b)(1)(A)";
                        newJustifications.exception = "N/A";   
                        item.justifications.push(newJustifications);
                    }
                    else if(item.papered === 'Yes') //Eligibility for "Papered"
                    {
                        //Set earliest eligibility date: 4 years later
                        eligibilityYear = (parseInt(item.dispDate.year) + 4);
                                         
                        //Create justification item to explain why it is ineligible                   
                        var newJustifications = {};
                        newJustifications.explanation = "You can seal this crime four years since off papers";
                        newJustifications.lawCode = "16-803(b)(1)(A)";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }
                    
                    //Next, check list for any convictions and conviction eligibility dates that may alter the eligibility result 
                    if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityYear))
                    {
                        //Update eligibility date  
                        eligibilityDate = convictionEligibilityDate;       
                         
                        //Create justification item to explain why it is eligible 
                        var newJustifications = {};
                        newJustifications.explanation = "Your conviction adds 5 - 10 years to waiting period.";
                        newJustifications.lawCode = "16-803(b)(2)(A)/(B)";
                        newJustifications.exception = "N/A";
                        
                        //Add justifications to current justifications list for this item.
                        item.justifications.push(newJustifications);
                    }               
                }
                
                else if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Misdemeanor' && item.MisdemeanorType === 'Ineligible')
                {
                    //Eligibility checker for Conviction Misdeameanors - Ineligible 
                    
                    //Update eligibility results
                    item.eligibility = 'Ineligible - Misemeanor Conviction';
                    eligibilityYear = 0;
            
                    //Create justification item to explain why it is ineligible                   
                    var newJustifications = {};
                    newJustifications.explanation = "Ineligible Misdemeanor Convictions are never eligible for sealing.";
                    newJustifications.lawCode = "16-803(c)";
                    newJustifications.exception = "N/A";
                    
                    //Add justifications to current justifications list for this item.
                    item.justifications.push(newJustifications);
                }
                else if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Misdemeanor' && item.MisdemeanorType === 'Eligible')
                {
                    //Eligibility checker for Conviction Misdeameanors - Eligible 

                    if($scope.hasMDQconvictions) //Check for any convictions
                    {  
                        //Update eligibility results
                        item.eligibility = 'Ineligible due to another Conviction';
                        eligibilityYear = 0;
                        
                        //Create justification item to explain why it is ineligible                   
                        var newJustifications = {};
                        newJustifications.explanation = "This can never be sealed due to another conviction on your record.";
                        newJustifications.lawCode = "16-801(5)(c)";
                        newJustifications.exception = "N/A";
                        
                        //Add justifications to current justifications list for this item.
                        item.justifications.push(newJustifications);
                    }
                    else if ($scope.hasMDQconvictions && findConvictionsAfterDate(item.fullDate)) //Check for subsequent convictions
                    {
                        //Update eligibility results
                        item.eligibility = 'Ineligible due to another Conviction';
                        eligibilityYear = 0;
                        
                        //Create justification item to explain why it is ineligible                   
                        var newJustifications = {};
                        newJustifications.explanation = "This can never be sealed due to a subsequent conviction on your record.";
                        newJustifications.lawCode = "16-803(c)(2); 16-801(5)(A) ";
                        newJustifications.exception = "N/A";
                        
                        //Add justifications to current justifications list for this item.
                        item.justifications.push(newJustifications);
                    }
                    else
                    {                        
                        //Set earliest eligibility date: 8 years later 
                        eligibilityYear = (parseInt(item.dispDate.year) + 8);

                        //Create justification item to explain why it is eligible
                        var newJustifications = {};
                        newJustifications.explanation = "This can be sealed after an 8 year waiting period.";
                        newJustifications.lawCode = "16-801(5)(c)";
                        newJustifications.exception = "N/A";
                        
                        //Add justifications to current justifications list for this item.
                        item.justifications.push(newJustifications);
                    }
                }
                
                else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Misdemeanor' &&  item.MisdemeanorType === 'Eligible')
                { 
                    //Eligibility checker for Non-Conviction Misdeameanors - Eligible 
                    if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityYear))
                    {
                        //Check to ensure waiting periods for convictions on current record have not passed
                        eligibilityDate = convictionEligibilityDate;  
                    
                        //Create justification item to explain why it is ineligible                                 
                        var newJustifications = {};
                        newJustifications.explanation = "Your other conviction will add 5-10 years to the waiting period.";
                        newJustifications.lawCode = "16-803(a)(2)(A) ; 16-803(a)(2)(B)";
                        newJustifications.exception = "N/A";
                        
                        //Add justifications to current justifications list for this item.
                        item.justifications.push(newJustifications);
                    } 
                    else
                    {
                        //Set earliest eligibility date: 2 years later 
                        eligibilityYear = (parseInt(item.dispDate.year) + 2);
                    
                        //Create justification item to explain why it is ineligible                                 
                        var newJustifications = {};
                        newJustifications.explanation = "Your eligible misdemeanor conviction can be sealed after a 2 year waiting period.";
                        newJustifications.lawCode = "16-803(a)(1)(A)";
                        newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";  
                     
                        //Add justifications to current justifications list for this item.                     
                        item.justifications.push(newJustifications);        
                    } 
                }              
                else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Misdemeanor' &&  item.MisdemeanorType === 'Ineligible')
                {
                    //Eligibility checker for Non-Conviction Misdeameanors - Ineligible 
                    if(item.papered === 'No')
                    {                    
                        if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityYear))
                        {
                            //Check to ensure waiting periods for convictions on current record have not passed
                            eligibilityDate = convictionEligibilityDate;     
                            
                            //Create justification item to explain why it is ineligible                                 
                            var newJustifications = {};
                            newJustifications.explanation = "Your other conviction will add 5-10 years to the waiting period.";
                            newJustifications.lawCode = "16-803(a)(2)(A) ; 16-803(a)(2)(B)";
                            newJustifications.exception = "N/A";
                            
                            //Add justifications to current justifications list for this item.                     
                            item.justifications.push(newJustifications);
                        }
                        else
                        {
                            //Set earliest eligibility date: 3 years later                      
                            eligibilityYear = (parseInt(item.dispDate.year) + 3);
                            
                            //Create justification item to explain why it is ineligible                                 
                            var newJustifications = {};
                            newJustifications.explanation = "This misdemeanor can be sealed after a 3 year waiting period.";
                            newJustifications.lawCode = "16-803(b)(1)(A)";
                            newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";
                    
                            //Add justifications to current justifications list for this item.                     
                            item.justifications.push(newJustifications);
                        }
                    }
                    else if(item.papered === 'Yes')
                    {
                        
                        if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityYear))
                        {   
                            //Check to ensure waiting periods for convictions on current record have not passed
                      	    eligibilityDate = convictionEligibilityDate;
                            
                            //Create justification item to explain why it is ineligible                                 
                            var newJustifications = {};
                            newJustifications.explanation = "Your other conviction will add 5-10 years to the waiting period.";
                            newJustifications.lawCode = "16-803(a)(2)(A) ; 16-803(a)(2)(B)";
                            newJustifications.exception = "N/A";
                            
                            //Add justifications to current justifications list for this item.                     
                            item.justifications.push(newJustifications);           
                        } 
                        else
                        {
                            //Set earliest eligibility date: 4 years later                      
                            eligibilityYear = (parseInt(item.dispDate.year) + 4);
                            
                            //Create justification item to explain why it is ineligible                                 
                            var newJustifications = {};
                            newJustifications.explanation = "This misdemeanor can be sealed after a 4 year waiting period.";
                            newJustifications.lawCode = "16-803(b)(1)(A)";
                            newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";
                    
                            //Add justifications to current justifications list for this item.                     
                            item.justifications.push(newJustifications);                         
                        }   
                    }
                }                               
                
                
                if(item.eligibility === '' && parseInt(eligibilityYear) > 0)
                {
                    //Show final results for record item
                    item.eligibility = 'Eligible for sealing in ' + eligibilityYear;                    
                    
                    //Check to see if final date has passed
                    if(new Date().getFullYear() >= parseInt(eligibilityYear) )
                        item.resultClass = "success";
                    else
                        item.resultClass = "warning";
              
                  }
                else //If item is never eligible
                {
                    //Display the current item Red /Danger based on item eligibility date and information 
                    item.resultClass = "danger";
                }
                
                //TESTING - Output final record item before saving 
                console.log(item);
            });
            
            //TESTING - Output final list of record items 
            console.log($scope.records);
        };
        
        $scope.dispositionOptions = [
            { title: 'No Papered', description: 'After an arrest, but before presentment (for felonies) or arraignment on the information (for misdemeanors), the United States Attorney\'s Office of the District of Columbia or the Office of the Attorney General for the District of Columbia has declined to proceed with the prosecution. This means that your a1Test has been NO PAPERED. However, the Government can proceed with prosecution at a later date.","There is no PUBLIC record of your arrest in the Court\'s database, although there is an arrest record. An arrest record is a record in the law enforcement database that contains your name, date of your arrest, the charges for which you were arrested, and other personal information such as your date of birth. An arrest record is not a conviction. However, if you apply for a job the arrest information may be disclosed to potential employees.', papered: false},
            { title: 'Acquitted', description: 'The legal and formal certification of the innocence of a person who has been charged with a crime. A finding of not guilty.', papered: false },
            { title: 'Dismissed for Want of Prosecution', description: 'An order or judgment disposing of the charge(s) without a trial. An involuntary dismissal accomplished on the Court\'s own motion for lack of prosecution or on motion from the defendant for Jack of prosecution or fai lure to introduce evidence of facts on which relief may be granted. The dismissal is without prejudice which allows the prosecutor the right to rebring the charge(s) at a later date.', 
            papered: false },
            { title: 'Dismissal', description: 'The United States Attorney\'s Office of the District of Columbia or the Office of the Attorney General for the District of Columbia filed a Dismissal for the incident that lead to the arrest. This means that after an indictment was returned, the court entered a dismissal at the request of the Government prior to commencement of the trial, or the court entered a dismissal after making its own finding that there was an unnecessary delay by the Government in presenting the case. Dismissals are without prejudice unless  otherwise stated.', papered: false },
            { title: 'Found Guilty - Plea', description: 'Formal admission in court as to guilt of having committed the criminal act(s) charged, which a defendant may make if he or she does so intell igently and voluntarily. It is binding and is equivalent to a conviction after trial. A guilty plea has the same effect as a verdict of guilty and authorizes imposition of the punishment prescribed by law.', 
            papered: true },
            { title: 'Non Jury Trial Guilty', description: 'Trial was held before a Judge, without a jury. At the conclusion of trial, the Judge found that the Government has met its burden of proof and it is beyond a reasonable doubt that the defendant is guilty of the offense(s) charged.', papered: true },
            { title: 'Non Jury Trial Not Guilty', description: 'Trial was held before a Judge, without a jury. At the conclusion of trial, the Judge found that the Government has failed to meet its burden of proof to show that the defendant was guilty of the offense(s) charged beyond a reasonable doubt.', papered: false },
            { title: 'Jury Trial Not Guilty', description: 'Formal pronouncement by a jury that they find the defendant not guilty of the offense(s) charged.', 
            papered: false },
            { title: 'Jury Trial Guilty', description: 'Formal pronouncement by a jury that they find the defendant guilty of the offense(s) charged. ', 
            papered: true },
            { title: 'Post and Forfeit', description: 'The Metropolitan Police Department (MPD) or the Office of the Attorney General for the District of Columbia has resolved the incident that leads to your arrest using the Post and Forfeit procedure.,The Post and Forfeit procedure allows a person charged with certain offenses to post and forfeit an amount as collateral (which otherwise would serve as security upon release to ensure the arrestee\'s appearance at trial) and thereby obtain a full and final resolution of the offense. The agreement to resolve the offense using the Post and Forfeit procedure is final.', papered: false },
            { title: 'Nolle Diversion', description: 'The United States Attorney\'s Office of the District of Columbia or the Office of the Attorney General for the District of Columbia has agreed that it will no longer pursue prosecution in this case because the defendant has complied with the conditions of his/her release as ordered by the Court', 
            papered: false },
            { title: 'Nolle Prosequi', description: 'The United States Attorney\'s Office of the District of Columbia or the Office of the Attorney General for the District of Columbia filed a Nolle Prosequi for the incident that lead to the arrest. This means that the Government has decided that it will no longer pursue prosecution in this case. ', 
            papered: false }
        ];
            
       
    }
})();

var App = angular.module('App', ['ui.bootstrap']);

angular.module('App')
.controller('MyAccordionController', function($scope){
  console.log('MyAccordionController');
  $scope.accordions = [];
  console.log($scope);
})
.controller('MyAccordionGroupController', function($scope){
  console.log('MyAccordionGroupController');
  $scope.accordion = {};
  console.log($scope);
  $scope.accordions.push($scope.accordion);
})
