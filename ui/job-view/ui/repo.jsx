export let $rootScope, $location,
  linkifyBugsFilter,
  thEvents, thUrl, thJobModel, thJobFilters,
  thResultStatus, thResultStatusInfo, ThResultSetStore;

export const setupAngularProviders = ($injector) => {
  $rootScope = $injector.get('$rootScope');
  $location = $injector.get('$location');
  linkifyBugsFilter = $injector.get('$filter')('linkifyBugs');
  thEvents = $injector.get('thEvents');
  thUrl = $injector.get('thUrl');
  thJobModel = $injector.get('ThJobModel');
  thJobFilters = $injector.get('thJobFilters');
  thResultStatus = $injector.get('thResultStatus');
  thResultStatusInfo = $injector.get('thResultStatusInfo');
  ThResultSetStore = $injector.get('ThResultSetStore');
};
