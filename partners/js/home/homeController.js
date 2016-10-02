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

(function(){
    'use strict';

    angular
        .module('partner')
        .controller('HomeController', HomeController);

    function HomeController($scope, $rootScope, $firebaseAuth, userService, $state){
        var vm = this;
        var ref = new Firebase($rootScope.fbUrl);
        vm.authObj = $firebaseAuth(ref);

        if($rootScope.currentUser)
        {
            console.log($rootScope.currentUser);                              
            $scope.currentUser = $rootScope.currentUser.profile;
            vm.title = $scope.currentUser.title;
        }
        //console.log(currentUser);
    }
    
})();
