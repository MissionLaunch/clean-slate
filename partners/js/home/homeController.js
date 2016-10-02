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

(function () {
    var app = angular.module('myApp', []);

    app.controller('TabController', function () {
        this.tab = 1;

        this.setTab = function (tabId) {
            this.tab = tabId;
        };

        this.isSet = function (tabId) {
            return this.tab === tabId;
        };
    });
})();
