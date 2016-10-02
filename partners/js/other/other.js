
function searchPage($scope){
    $scope.searchResults = [{label:"Other Statutes",_infoLink:"http://codefordc.org/clean-slate/#/eligibility/50"}];
    
    $scope.itemDetail = function(link){
        $scope.detailFrame = link;
    };
}
