(function(){
    'use strict';

    angular.module('partner', ['firebase', 'ui.router']);

    angular
        .module('partner')
        .run(['$rootScope', '$firebaseAuth', function($rootScope, $firebaseAuth, $scope, userService, $state, $stateProvider) {
            //Base Firebase URL
            $rootScope.fbUrl = 'https://clean-slate.firebaseio.com/';
            var ref = new Firebase($rootScope.fbUrl);
            var authObj = $firebaseAuth(ref);
        
            $rootScope.logIn = function(form) {
               
                if(form.email && form.password) {
                            authObj.$authWithPassword({
                            email: form.email,
                            password: form.password
                        })
                        .then(function(authData){
                            $rootScope.currentUser = authData;
                        
                            ref.child("organizations").orderByChild("userID").equalTo(authData.uid).on("child_added", function(snapshot) {
                    
                                if(snapshot) {
                                    var profile = snapshot.val();
                                    profile.key = snapshot.key();
                                    $rootScope.profile = profile;
                                    $rootScope.currentUser.profile = profile;
                                    console.log(profile);
                                    console.log($rootScope.currentUser);
                              
                                }   
                            });
                            $state.go('home');
                        })
                    .catch(function(err){
                        console.log(err);
                    });
                }
                else
                {
                    alert(" whats going on Invalid login credentials");   
                }
            };
            
            
            $rootScope.logOut = function() {
                ref.unauth();
                $rootScope.currentUser = null;
                $state.go('login');
            };
   
   
   
        }])
       
        .config(function($stateProvider, $urlRouterProvider){

            $stateProvider.state('login', {
                url: '/login',
                templateUrl: 'js/login/login.html',
                controller: 'LoginController',
                controllerAs: 'vm'
            });

            $stateProvider.state('home', {
                url: '/home',
                templateUrl: 'js/home/home.html',
                controller: 'HomeController',
                controllerAs: 'vm'
                /*,
                resolve: {
                    // controller will not be loaded until $requireAuth resolves
                    // Auth refers to our $firebaseAuth wrapper in the example above
                    "currentAuth": ["Auth", function(Auth) {
                        // $requireAuth returns a promise so the resolve waits for it to complete
                        // If the promise is rejected, it will throw a $stateChangeError (see above)
                        return Auth.$requireAuth();
                    }]
                }*/
               
            });
            
            
            $stateProvider.state('clients', {
                url: '/clients',
                templateUrl: 'js/client/clients.html',
                controller: 'ClientController',
                controllerAs: 'vm'
               
            });
            
                  
            $stateProvider.state('newClient', {
                url: '/clients/new',
                templateUrl: 'js/client/client.html',
                controller: 'ClientController',
                controllerAs: 'vm'
               
            });
            
                  
            $stateProvider.state('client', {
                url: '/clients',
                templateUrl: 'js/client/client.html',
                controller: 'ClientController',
                controllerAs: 'vm'
            });
            
            

            $urlRouterProvider.otherwise('/home');
        });


})();

app.controller('MainCtrl', function ($scope) {
    $scope.currentTime = 0;
})

app.directive('someVideo', function ($window, $timeout) {
    return {
        scope: {
            videoCurrentTime: "=videoCurrentTime"
        },
        controller: function ($scope, $element) {

            $scope.onTimeUpdate = function () {
                var currTime = $element[0].currentTime;
                if (currTime - $scope.videoCurrentTime > 0.5 || $scope.videoCurrentTime - currTime > 0.5) {
                    $element[0].currentTime = $scope.videoCurrentTime;
                }
                $scope.$apply(function () {
                    $scope.videoCurrentTime = $element[0].currentTime;
                });
            }
        },
        link: function (scope, elm) {
            // Use this $watch to restart the video if it has ended
            scope.$watch('videoCurrentTime', function (newVal) {

                if (elm[0].ended) {
                    // Do a second check because the last 'timeupdate'
                    // after the video stops causes a hiccup.
                    if (elm[0].currentTime !== newVal) {
                        elm[0].currentTime = newVal;
                        elm[0].play();
                    }
                }
            });
            // Otherwise keep any model syncing here.
            elm.bind('timeupdate', scope.onTimeUpdate);
        }
    }
})
