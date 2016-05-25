(function(){
    'use strict';

    angular
        .module('partner')
        .controller('ClientController', ClientController);

    function ClientController($rootScope, $scope, $firebaseAuth, userService, $state, $firebaseArray){
          
        var vm = this;
        var ref = new Firebase($rootScope.fbUrl);
        
        var orgRef = ref.child('organizations').child($rootScope.currentUser.profile.key);       
        var clientRef = orgRef.child("clients");
        
        console.log($rootScope.currentUser);
        vm.authObj = $firebaseAuth(ref);
         
        $scope.clients = $firebaseArray(orgRef.child('clients'));
        
        
        vm.saveClient = saveClient;
        vm.logOut = logOut;
        vm.initDummyData = initDummyData;
        vm.addRecordItem = addRecordItem;
        vm.checkEligibility = checkEligibility;
        vm.findDConvictions = findDConvictions;
        vm.findConvictionDate = findConvictionDate;
        
        vm.initDummyData();

        function saveClient(newClient){
            
            console.log(newClient);
            
            //Checks checks to see if any records have been added for the current client 
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
               
                
            //Must change to add client as data NOT as actual users.
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
               
              if(recordItem.itemType == 'Felony')
                  recordItem.eligibilityStatus = recordItem.FelonyType;
              else 
                  recordItem.eligibilityStatus = recordItem.MisdemeanorType;
               
              var newRecordItemRef =  recordRef.push();
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
        
        function logOut(){
            console.log(vm.authObj);
               vm.authObj.$logout();
        };
        
        
        function initDummyData(){
            //Initialize form with basic data for person
                $scope.person = {};
                /*
                
                $scope.person.first = "John";
                $scope.person.middle = "Jay";
                $scope.person.last = "Smith";
                $scope.person.phone = "2022225555";
                $scope.person.email = "test@email.com";
                $scope.person.address1 = "1600 pennsylvania ave NW";
                $scope.person.address2 = "Washington, DC, 20002";
                $scope.person.dobMonth = "10";
                $scope.person.dobDay = "05";
                $scope.person.dobYear = "2015";*/
                $scope.person.pendingCase = false;    
                $scope.records = [];
                $scope.convictions = [];
                $scope.hasMDQconvictions = false;
        };
        
        function addRecordItem(){
            //This function will add a new item to criminal record then check eligibility

                $scope.newRecord.expanded = false;
            
                if(!($scope.newRecord.dispDate.month == null) && !($scope.newRecord.dispDate.day == null) && !($scope.newRecord.dispDate.year == null))
                {   
                $scope.newRecord.dispDate.full = $scope.newRecord.dispDate.month + "/" + $scope.newRecord.dispDate.day + "/" + $scope.newRecord.dispDate.year;
                $scope.newRecord.fullDate = new Date($scope.newRecord.dispDate.full);
                }
                
                    if($scope.newRecord.convictionStatus === 'Conviction')
                    {
                        //Maintain list of convictions
                        var newConviction = {};
                        newConviction.itemType = $scope.newRecord.itemType;
                        newConviction.convictionStatus = $scope.newRecord.convictionStatus;
                        newConviction.offDate = $scope.newRecord.dispDate;
                        newConviction.eligibilityDate = $scope.newRecord.dispDate;
                        
                        if($scope.newRecord.itemType === 'Felony' && $scope.newRecord.felonyType === 'Ineligible')
                        {
                        newConviction.eligibilityDate.year = (parseInt($scope.newRecord.dispDate.year) + 10).toString();
                        $scope.hasMDQconvictions = true;
                        }
                        else if($scope.newRecord.itemType === 'Misdemeanor')
                        {
                        newConviction.eligibilityDate.year = (parseInt($scope.newRecord.dispDate.year) + 5).toString();
                        
                        if($scope.newRecord.MisdemeanorType === 'Ineligible')
                            $scope.hasMDQconvictions = true;
                        }
                        
                        console.log(newConviction);
                        $scope.convictions.push(newConviction);
                }
                
                
                $scope.records.push($scope.newRecord);
                this.checkEligibility();
                
                console.log($scope.newRecord);
                
                $scope.newRecord = {};
        };
        
        function findDConvictions(){
        //This function will search the convictions array looking for a disquailifying convictions for 16-803c2
            var disqualified = false;

            angular.forEach($scope.convictions, function(item)
                {
                    if(parseInt(item.offDate.year) > parseInt(startDate.year))
                        disqualified = true;  
                    else if(parseInt(item.offDate.year) === parseInt(startDate.year) 
                    && parseInt(item.offDate.month) > parseInt(startDate.month))
                    disqualified = true;  
                });
                
                return disqualified;
    
        };
     
        function findConvictionDate() {
        //This function will search the convictions array looking for the most recent expiration date
            var expirationDate = {};

            angular.forEach($scope.convictions, function(item)
            {
                if(expirationDate === {})
                {
                    expirationDate = item.eligibilityDate;
                }
                else if(parseInt(expirationDate.year) > parseInt(item.eligibilityDate.year))
                {
                    expirationDate = item.eligibilityDate;
                }
                else if(parseInt(expirationDate.year) === parseInt(item.eligibilityDate.year)
                && parseInt(expirationDate.month) < parseInt(item.eligibilityDate.year))
                {
                    expirationDate = item.eligibilityDate;
                }
            });

            return expirationDate;
        };
        
        function checkEligibility() {
        //This function will determine eligibility for all items added to the record
    
            //This variable will hold the earliest date for eligibility sealing
            var convictionEligibilityDate = {}; 
            
            if($scope.convictions.length > 0);
                convictionEligibilityDate = vm.findConvictionDate();
            
            angular.forEach($scope.records, function(item)
            {
                var eligibilityDate = item.dispDate;
                item.eligibility = '';
                item.justifications = [];
                        
                if($scope.person.pendingCase === true)
                {
                    item.eligibility = 'Ineligible - Due to Pending Case';
                    eligibilityDate.year = 0;
                    
                    var newJustifications = {};
                    newJustifications.explanation = "Your pending case must be completed before you can seal.";
                    newJustifications.lawCode = "16-801(5)(B)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }
                
                if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Felony' &&  item.FelonyType === 'Ineligible')
                {
                    item.eligibility = 'Ineligible - Felony Conviction';
                    eligibilityDate.year = 0;
                    
                    var newJustifications = {};
                    newJustifications.explanation = "Ineligible Felonies are never eligible unless Bail Reform Act.";
                    newJustifications.lawCode = "N/A";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
            
                }
                else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Felony')
                {
                    if(item.papered === 'No')
                    {
                        eligibilityDate.year = (parseInt(item.dispDate.year) + 3);

                        var newJustifications = {};
                        newJustifications.explanation = "You can seal this crime three years since off papers";
                        newJustifications.lawCode = "16-803(b)(1)(A)";
                        newJustifications.exception = "N/A";   
                        item.justifications.push(newJustifications);
                    }
                    else if(item.papered === 'Yes')
                    {
                        eligibilityDate.year = (parseInt(item.dispDate.year) + 4);
                    
                        var newJustifications = {};
                        newJustifications.explanation = "You can seal this crime four years since off papers";
                        newJustifications.lawCode = "16-803(b)(1)(A)";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }
                    
                    if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                    {
                        
                        eligibilityDate = convictionEligibilityDate;       
                        
                        var newJustifications = {};
                        newJustifications.explanation = "Your conviction adds 5 - 10 years to waiting period.";
                        newJustifications.lawCode = "16-803(b)(2)(A)/(B)";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }               
                }
                    
                
                else if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Misdemeanor' && item.MisdemeanorType === 'Ineligible')
                {
                    item.eligibility = 'Ineligible - Misemeanor Conviction';
                    eligibilityDate.year = 0;
            
                    var newJustifications = {};
                    newJustifications.explanation = "Ineligible Misdemeanor Convictions are never eligible for sealing.";
                    newJustifications.lawCode = "16-803(c)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }
                else if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Misdemeanor' && item.MisdemeanorType === 'Eligible')
                {
                    if(($scope.hasMDQconvictions) || vm.findDConvictions(item.dispDate))
                    {  
                        item.eligibility = 'Ineligible due to another Conviction';
                        eligibilityDate.year = 0;
                        
                        var newJustifications = {};
                        newJustifications.explanation = "This can never be sealed due to another conviction on your record.";
                        newJustifications.lawCode = "16-801(5)(c)";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }
                    else if (5 < 4) //Must add logic to check for any convictions after current conviction
                    {
                        var newJustifications = {};
                        newJustifications.explanation = "This can never be sealed due to a subsequent conviction on your record.";
                        newJustifications.lawCode = "16-803(c)(2); 16-801(5)(A) ";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }
                    else
                    {
                        eligibilityDate.year = (parseInt(item.dispDate.year) + 8);

                        var newJustifications = {};
                        newJustifications.explanation = "This can be sealed after an 8 year waiting period.";
                        newJustifications.lawCode = "16-801(5)(c)";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }}
                
                else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Misdemeanor' &&  item.MisdemeanorType === 'Eligible')
                {
                    
                    if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                    {      
                        eligibilityDate = convictionEligibilityDate;  
                    
                        var newJustifications = {};
                        newJustifications.explanation = "Your other conviction will add 5-10 years to the waiting period.";
                        newJustifications.lawCode = "16-803(a)(2)(A) ; 16-803(a)(2)(B)";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
        
                    } 
                    else
                    {
                        eligibilityDate.year = (parseInt(item.dispDate.year) + 2);
                    
                        var newJustifications = {};
                        newJustifications.explanation = "Your eligible misdemeanor conviction can be sealed after a 2 year waiting period.";
                        newJustifications.lawCode = "16-803(a)(1)(A)";
                        newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";
                        item.justifications.push(newJustifications);        } 
            }
                
                else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Misdemeanor' &&  item.MisdemeanorType === 'Ineligible')
                {
                    if(item.papered === 'No')
                    {                    
                        if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                        {
                            eligibilityDate = convictionEligibilityDate;     
                            
                            var newJustifications = {};
                            newJustifications.explanation = "This can never be sealed due to a subsequent conviction on your record.";
                            newJustifications.lawCode = "16-803(b)(2)(A); 16-803(b)(2)(B) ";
                            newJustifications.exception = "N/A";
                            item.justifications.push(newJustifications);
                        }
                        else
                        {
                            eligibilityDate.year = (parseInt(item.dispDate.year) + 3);
                            
                                var newJustifications = {};
                            newJustifications.explanation = "This misdemeanor can be sealed after a 3 year waiting period.";
                            newJustifications.lawCode = "16-803(b)(1)(A)";
                            newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";
                    
                            item.justifications.push(newJustifications);
                        }
                    }
                    else if(item.papered === 'Yes')
                    {
                        
                        if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                    {   	    
                        eligibilityDate = convictionEligibilityDate;
                        
                    item.explanation = "Your pending case must be completed before the court will allow you to seal.";
                    item.lawCode = "16-801(5)(B)";
                    item.exception = "N/A";   
                    } 
                    else
                    {
                    eligibilityDate.year = (parseInt(item.dispDate.year) + 4);
                    
                    item.explanation = "Your pending case must be completed before the court will allow you to seal.";
                    item.lawCode = "16-801(5)(B)";
                    item.exception = "N/A";
                        
                    }   
                    }
                }
                else
                {
                    item.eligibility = 'Pending';
                    
                    item.explanation = "Your pending case must be completed before the court will allow you to seal.";
                    item.lawCode = "16-801(5)(B)";
                    item.exception = "N/A";
                }
                
                if(item.eligibility === '' && parseInt(eligibilityDate.year) > 0)
                {
                    item.eligibility = 'Eligible for sealing in ' + eligibilityDate.year;
                    
                    
                    if(new Date().getFullYear() >= parseInt(eligibilityDate.year) )
                        item.resultClass = "success";
                    else
                        item.resultClass = "warning";
                        
                        console.log(new Date().getFullYear() <= parseInt(eligibilityDate.year) );
                        console.log(new Date().getFullYear());
                        console.log(parseInt(eligibilityDate.year) );
                    
                }
                else
                {
                    item.resultClass = "danger";
                }
                
                
                console.log(item);
            });
            
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

/*

Code from previous iteration of app

sampleApp.controller('RecordsController', function ($scope, $routeParams, sharedService) {
    
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
        $scope.person.pendingCase = false;    
        $scope.records = [];
        $scope.convictions = [];
        $scope.hasMDQconvictions = false;
     
 
    $scope.addRecordItem = function () {
    //This function will add a new item to criminal record then check eligibility

        $scope.newRecord.expanded = false;
    
        if(!($scope.newRecord.dispDate.month == null) && !($scope.newRecord.dispDate.day == null) && !($scope.newRecord.dispDate.year == null))
        {   
        $scope.newRecord.dispDate.full = $scope.newRecord.dispDate.month + "/" + $scope.newRecord.dispDate.day + "/" + $scope.newRecord.dispDate.year;
        $scope.newRecord.fullDate = new Date($scope.newRecord.dispDate.full);
        }
        
            if($scope.newRecord.convictionStatus === 'Conviction')
            {
                //Maintain list of convictions
                var newConviction = {};
                newConviction.itemType = $scope.newRecord.itemType;
                newConviction.convictionStatus = $scope.newRecord.convictionStatus;
                newConviction.offDate = $scope.newRecord.dispDate;
                newConviction.eligibilityDate = $scope.newRecord.dispDate;
                
                if($scope.newRecord.itemType === 'Felony' && $scope.newRecord.felonyType === 'Ineligible')
                {
                newConviction.eligibilityDate.year = (parseInt($scope.newRecord.dispDate.year) + 10).toString();
                $scope.hasMDQconvictions = true;
                }
                else if($scope.newRecord.itemType === 'Misdemeanor')
                {
                newConviction.eligibilityDate.year = (parseInt($scope.newRecord.dispDate.year) + 5).toString();
                
                if($scope.newRecord.MisdemeanorType === 'Ineligible')
                    $scope.hasMDQconvictions = true;
                }
                
                console.log(newConviction);
                $scope.convictions.push(newConviction);
        }
        
        
        $scope.records.push($scope.newRecord);
        $scope.checkEligibility();
        
        console.log($scope.newRecord);
        
        $scope.newRecord = {};
    }
     
    $scope.findDConvictions = function (startDate) {
    //This function will search the convictions array looking for a disquailifying convictions for 16-803c2
        var disqualified = false;

        angular.forEach($scope.convictions, function(item)
            {
                if(parseInt(item.offDate.year) > parseInt(startDate.year))
                    disqualified = true;  
                else if(parseInt(item.offDate.year) === parseInt(startDate.year) 
                && parseInt(item.offDate.month) > parseInt(startDate.month))
                disqualified = true;  
            });
            
            return disqualified;
    }
    
    $scope.findConvictionDate = function () {
    //This function will search the convictions array looking for the most recent expiration date
        var expirationDate = {};

        angular.forEach($scope.convictions, function(item)
        {
            if(expirationDate === {})
            {
                expirationDate = item.eligibilityDate;
            }
            else if(parseInt(expirationDate.year) > parseInt(item.eligibilityDate.year))
            {
                expirationDate = item.eligibilityDate;
            }
            else if(parseInt(expirationDate.year) === parseInt(item.eligibilityDate.year)
            && parseInt(expirationDate.month) < parseInt(item.eligibilityDate.year))
            {
                expirationDate = item.eligibilityDate;
            }
        });

        return expirationDate;
    }
     
    $scope.checkEligibility = function () {
    //This function will determine eligibility for all items added to the record
  
        //This variable will hold the earliest date for eligibility sealing
        var convictionEligibilityDate = {}; 
        
        if($scope.convictions.length > 0);
            convictionEligibilityDate = $scope.findConvictionDate();
        
        angular.forEach($scope.records, function(item)
        {
            var eligibilityDate = item.dispDate;
            item.eligibility = '';
            item.justifications = [];
                    
            if($scope.person.pendingCase === true)
            {
                item.eligibility = 'Ineligible - Due to Pending Case';
                eligibilityDate.year = 0;
                
                var newJustifications = {};
                newJustifications.explanation = "Your pending case must be completed before you can seal.";
                newJustifications.lawCode = "16-801(5)(B)";
                newJustifications.exception = "N/A";
                item.justifications.push(newJustifications);
            }
            
            if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Felony' &&  item.FelonyType === 'Ineligible')
            {
                item.eligibility = 'Ineligible - Felony Conviction';
                eligibilityDate.year = 0;
                
                var newJustifications = {};
                newJustifications.explanation = "Ineligible Felonies are never eligible unless Bail Reform Act.";
                newJustifications.lawCode = "N/A";
                newJustifications.exception = "N/A";
                item.justifications.push(newJustifications);
        
            }
            else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Felony')
            {
                if(item.papered === 'No')
                {
                    eligibilityDate.year = (parseInt(item.dispDate.year) + 3);

                    var newJustifications = {};
                    newJustifications.explanation = "You can seal this crime three years since off papers";
                    newJustifications.lawCode = "16-803(b)(1)(A)";
                    newJustifications.exception = "N/A";   
                    item.justifications.push(newJustifications);
                }
                else if(item.papered === 'Yes')
                {
                    eligibilityDate.year = (parseInt(item.dispDate.year) + 4);
                
                    var newJustifications = {};
                    newJustifications.explanation = "You can seal this crime four years since off papers";
                    newJustifications.lawCode = "16-803(b)(1)(A)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }
                
                if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                {
                    
                    eligibilityDate = convictionEligibilityDate;       
                    
                    var newJustifications = {};
                    newJustifications.explanation = "Your conviction adds 5 - 10 years to waiting period.";
                    newJustifications.lawCode = "16-803(b)(2)(A)/(B)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }               }
                
            
            else if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Misdemeanor' && item.MisdemeanorType === 'Ineligible')
            {
                item.eligibility = 'Ineligible - Misemeanor Conviction';
                eligibilityDate.year = 0;
        
                var newJustifications = {};
                newJustifications.explanation = "Ineligible Misdemeanor Convictions are never eligible for sealing.";
                newJustifications.lawCode = "16-803(c)";
                newJustifications.exception = "N/A";
                item.justifications.push(newJustifications);
            }
            else if(item.convictionStatus === 'Conviction' &&  item.itemType === 'Misdemeanor' && item.MisdemeanorType === 'Eligible')
            {
                if(($scope.hasMDQconvictions) || $scope.findDConvictions(item.dispDate))
                {  
                    item.eligibility = 'Ineligible due to another Conviction';
                    eligibilityDate.year = 0;
                    
                    var newJustifications = {};
                    newJustifications.explanation = "This can never be sealed due to another conviction on your record.";
                    newJustifications.lawCode = "16-801(5)(c)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }
                else if (5 < 4) //Must add logic to check for any convictions after current conviction
                {
                    var newJustifications = {};
                    newJustifications.explanation = "This can never be sealed due to a subsequent conviction on your record.";
                    newJustifications.lawCode = "16-803(c)(2); 16-801(5)(A) ";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }
                else
                {
                    eligibilityDate.year = (parseInt(item.dispDate.year) + 8);

                    var newJustifications = {};
                    newJustifications.explanation = "This can be sealed after an 8 year waiting period.";
                    newJustifications.lawCode = "16-801(5)(c)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
                }}
            
            else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Misdemeanor' &&  item.MisdemeanorType === 'Eligible')
            {
                
                if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                {      
                    eligibilityDate = convictionEligibilityDate;  
                
                    var newJustifications = {};
                    newJustifications.explanation = "Your other conviction will add 5-10 years to the waiting period.";
                    newJustifications.lawCode = "16-803(a)(2)(A) ; 16-803(a)(2)(B)";
                    newJustifications.exception = "N/A";
                    item.justifications.push(newJustifications);
    
                } 
                else
                {
                    eligibilityDate.year = (parseInt(item.dispDate.year) + 2);
                
                    var newJustifications = {};
                    newJustifications.explanation = "Your eligible misdemeanor conviction can be sealed after a 2 year waiting period.";
                    newJustifications.lawCode = "16-803(a)(1)(A)";
                    newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";
                    item.justifications.push(newJustifications);        } 
        }
            
            else if(item.convictionStatus === 'Non-Conviction' &&  item.itemType === 'Misdemeanor' &&  item.MisdemeanorType === 'Ineligible')
            {
                if(item.papered === 'No')
                {                    
                    if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                    {
                        eligibilityDate = convictionEligibilityDate;     
                        
                        var newJustifications = {};
                        newJustifications.explanation = "This can never be sealed due to a subsequent conviction on your record.";
                        newJustifications.lawCode = "16-803(b)(2)(A); 16-803(b)(2)(B) ";
                        newJustifications.exception = "N/A";
                        item.justifications.push(newJustifications);
                    }
                    else
                    {
                        eligibilityDate.year = (parseInt(item.dispDate.year) + 3);
                        
                            var newJustifications = {};
                        newJustifications.explanation = "This misdemeanor can be sealed after a 3 year waiting period.";
                        newJustifications.lawCode = "16-803(b)(1)(A)";
                        newJustifications.exception = "If non-conviction because Deferred Sentencing Agreement, cannot be expunged if you have any misdemeanor or felony conviction";
                
                        item.justifications.push(newJustifications);
                    }
                }
                else if(item.papered === 'Yes')
                {
                    
                    if($scope.convictions.length > 0 && parseInt(convictionEligibilityDate.year) > parseInt(eligibilityDate.year))
                {   	    
                    eligibilityDate = convictionEligibilityDate;
                    
                item.explanation = "Your pending case must be completed before the court will allow you to seal.";
                item.lawCode = "16-801(5)(B)";
                item.exception = "N/A";   
                } 
                else
                {
                eligibilityDate.year = (parseInt(item.dispDate.year) + 4);
                
                item.explanation = "Your pending case must be completed before the court will allow you to seal.";
                item.lawCode = "16-801(5)(B)";
                item.exception = "N/A";
                    
                }   
                }
            }
            else
            {
                item.eligibility = 'Pending';
                
                item.explanation = "Your pending case must be completed before the court will allow you to seal.";
                item.lawCode = "16-801(5)(B)";
                item.exception = "N/A";
            }
            
            if(item.eligibility === '' && parseInt(eligibilityDate.year) > 0)
            {
                item.eligibility = 'Eligible for sealing in ' + eligibilityDate.year;
                
                
                if(new Date().getFullYear() >= parseInt(eligibilityDate.year) )
                    item.resultClass = "success";
                else
                    item.resultClass = "warning";
                    
                    console.log(new Date().getFullYear() <= parseInt(eligibilityDate.year) );
                    console.log(new Date().getFullYear());
                    console.log(parseInt(eligibilityDate.year) );
                
            }
            else
            {
                item.resultClass = "danger";
            }
            
            
            console.log(item);
        });
        
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
    });
  */
